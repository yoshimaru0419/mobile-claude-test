// MCP（Streamable HTTP）を最小限だけ話すクライアント
import { readFileSync } from "node:fs";

export const DEFAULT_URL = "https://mcp.atlassian.com/v1/mcp";
export const PROTOCOL_VERSION = "2025-06-18";
export const VERSION = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;

/** ユーザーに見せるエラー。CLIはメッセージを標準エラーに出して終了コード1で終わる */
export class CliError extends Error {}

export class MCPClient {
  /**
   * @param {string} url MCPサーバーのURL
   * @param {string} auth Authorization ヘッダーの値
   * @param {{ timeoutMs?: number }} [options]
   */
  constructor(url, auth, { timeoutMs = 120_000 } = {}) {
    this.url = url;
    this.auth = auth;
    this.timeoutMs = timeoutMs;
    this.sessionId = null;
    this.protocolVersion = PROTOCOL_VERSION;
    this.nextId = 0;
  }

  async post(payload, expectResponse = true) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: this.auth,
    };
    if (this.sessionId) {
      headers["Mcp-Session-Id"] = this.sessionId;
      headers["MCP-Protocol-Version"] = this.protocolVersion;
    }

    let res, body;
    try {
      res = await fetch(this.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new CliError(`HTTP ${res.status}: ${detail}`);
      }
      const sid = res.headers.get("Mcp-Session-Id");
      if (sid) this.sessionId = sid;
      if (!expectResponse) {
        await res.body?.cancel();
        return null;
      }
      body = await res.text();
    } catch (e) {
      if (e instanceof CliError) throw e;
      throw new CliError(`接続できません: ${e.cause?.message ?? e.message}`);
    }

    const ctype = res.headers.get("Content-Type") ?? "";
    if (ctype.includes("text/event-stream")) return parseSse(body, payload.id);
    try {
      return JSON.parse(body);
    } catch {
      throw new CliError(`サーバーの応答をJSONとして解釈できません: ${body.slice(0, 200)}`);
    }
  }

  async request(method, params) {
    const msg = { jsonrpc: "2.0", id: ++this.nextId, method };
    if (params !== undefined) msg.params = params;
    const res = await this.post(msg);
    if (res.error !== undefined) {
      throw new CliError("MCPエラー: " + JSON.stringify(res.error));
    }
    return res.result;
  }

  async notify(method) {
    await this.post({ jsonrpc: "2.0", method }, false);
  }

  async initialize() {
    const result = await this.request("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "atl-cli", version: VERSION },
    });
    this.protocolVersion = result?.protocolVersion ?? PROTOCOL_VERSION;
    await this.notify("notifications/initialized");
    return result;
  }

  async listTools() {
    const tools = [];
    let cursor;
    do {
      const res = await this.request("tools/list", cursor ? { cursor } : {});
      tools.push(...(res?.tools ?? []));
      cursor = res?.nextCursor;
    } while (cursor);
    return tools;
  }

  async callTool(name, args) {
    return this.request("tools/call", { name, arguments: args });
  }
}

/** SSE形式の応答から、該当IDのJSON-RPCメッセージを取り出す */
export function parseSse(body, wantId) {
  for (const event of body.replace(/\r\n/g, "\n").split("\n\n")) {
    const data = event
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      continue;
    }
    if (msg?.id === wantId) return msg;
  }
  throw new CliError("サーバーの応答に結果が含まれていません");
}
