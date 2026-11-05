import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseSse } from "../src/mcp-client.js";
import { parseKv } from "../src/cli.js";

const BIN = fileURLToPath(new URL("../bin/atl.js", import.meta.url));

const TOOLS = [
  {
    name: "searchJira",
    description: "Search Jira issues\nwith JQL",
    inputSchema: {
      type: "object",
      properties: {
        jql: { type: "string", description: "JQL query" },
        maxResults: { type: "number", description: "Max\nresults" },
      },
      required: ["jql"],
    },
  },
  {
    name: "atlassianUserInfo",
    description: "Current user",
    inputSchema: { type: "object", properties: {} },
  },
];

let server;
let url;
const seen = []; // サーバーが受け取ったリクエスト

function reply(res, msg, sse) {
  if (sse) {
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.end(`event: message\r\ndata: {"jsonrpc":"2.0","method":"notifications/progress"}\r\n\r\ndata: ${JSON.stringify(msg)}\r\n\r\n`);
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(msg));
  }
}

before(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const msg = JSON.parse(raw);
      seen.push({ headers: req.headers, msg });
      if (req.headers.authorization === "Bearer bad") {
        res.writeHead(401);
        return res.end("unauthorized");
      }
      if (msg.method === "initialize") {
        res.setHeader("Mcp-Session-Id", "sess-1");
        return reply(res, { jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2025-06-18" } }, true);
      }
      if (req.headers["mcp-session-id"] !== "sess-1") {
        res.writeHead(400);
        return res.end("no session");
      }
      if (msg.method === "notifications/initialized") {
        res.writeHead(202);
        return res.end();
      }
      if (msg.method === "tools/list") {
        // 1件ずつページング
        const page = msg.params.cursor === "p2" ? 1 : 0;
        const result = { tools: [TOOLS[page]] };
        if (page === 0) result.nextCursor = "p2";
        return reply(res, { jsonrpc: "2.0", id: msg.id, result }, page === 1);
      }
      if (msg.method === "tools/call") {
        const { name, arguments: args } = msg.params;
        if (name === "boom") {
          return reply(res, { jsonrpc: "2.0", id: msg.id, error: { code: -32602, message: "bad tool" } });
        }
        if (name === "fails") {
          return reply(res, { jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: "失敗" }], isError: true } });
        }
        return reply(res, {
          jsonrpc: "2.0",
          id: msg.id,
          result: { content: [{ type: "text", text: JSON.stringify({ name, args }) }] },
        });
      }
      res.writeHead(404);
      res.end();
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${server.address().port}/v1/mcp`;
});

after(() => server.close());

function atl(args, env = {}) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [BIN, ...args],
      { env: { PATH: process.env.PATH, ATLASSIAN_MCP_URL: url, ATLASSIAN_API_TOKEN: "tok", ...env } },
      (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr }),
    );
  });
}

test("tools: ページングして名前順に一覧表示", async () => {
  const r = await atl(["tools"]);
  assert.equal(r.code, 0);
  const lines = r.stdout.trim().split("\n");
  assert.match(lines[0], /^atlassianUserInfo\s+Current user$/);
  assert.match(lines[1], /^searchJira\s+Search Jira issues$/);
  assert.match(r.stderr, /合計 2 ツール/);
});

test("tools --json: スキーマ込みで出力", async () => {
  const r = await atl(["tools", "--json"]);
  assert.deepEqual(JSON.parse(r.stdout), TOOLS);
});

test("describe: 引数の型と必須/任意を表示", async () => {
  const r = await atl(["describe", "searchJira"]);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /^# searchJira/);
  assert.match(r.stdout, /- jql \(string, 必須\) JQL query/);
  assert.match(r.stdout, /- maxResults \(number, 任意\) Max results/);
});

test("describe: 存在しないツールはエラー", async () => {
  const r = await atl(["describe", "nope"]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /ツール 'nope' は見つかりません/);
});

test("call key=value: string型はそのまま、他はJSONとして解釈", async () => {
  const r = await atl(["call", "searchJira", "jql=123", "maxResults=5"]);
  assert.equal(r.code, 0);
  assert.deepEqual(JSON.parse(r.stdout), { name: "searchJira", args: { jql: "123", maxResults: 5 } });
});

test("call --json と --raw", async () => {
  const r = await atl(["call", "anyTool", "--json", '{"a":[1,2]}', "--raw"]);
  assert.equal(r.code, 0);
  const result = JSON.parse(r.stdout);
  assert.deepEqual(JSON.parse(result.content[0].text), { name: "anyTool", args: { a: [1, 2] } });
});

test("call: isError なら終了コード1", async () => {
  const r = await atl(["call", "fails", "--json", "{}"]);
  assert.equal(r.code, 1);
  assert.equal(r.stdout.trim(), "失敗");
});

test("call: JSON-RPCエラー", async () => {
  const r = await atl(["call", "boom", "--json", "{}"]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /MCPエラー: .*bad tool/);
});

test("認証: EMAILありならBasic、なしならBearer", async () => {
  seen.length = 0;
  await atl(["tools"], { ATLASSIAN_EMAIL: "a@example.com" });
  assert.equal(seen[0].headers.authorization, "Basic " + Buffer.from("a@example.com:tok").toString("base64"));
  assert.equal(seen[1].headers["mcp-protocol-version"], "2025-06-18");
  seen.length = 0;
  await atl(["tools"]);
  assert.equal(seen[0].headers.authorization, "Bearer tok");
});

test("トークン未設定・HTTPエラー・接続不可", async () => {
  let r = await atl(["tools"], { ATLASSIAN_API_TOKEN: "" });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /ATLASSIAN_API_TOKEN/);

  r = await atl(["tools"], { ATLASSIAN_API_TOKEN: "bad" });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /HTTP 401: unauthorized/);

  r = await atl(["--url", "http://127.0.0.1:1/mcp", "tools"]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /接続できません/);
});

test("不明なコマンド・オプション", async () => {
  let r = await atl(["foo"]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /不明なコマンドです: foo/);
  r = await atl(["tools", "--bogus"]);
  assert.equal(r.code, 1);
});

test("parseKv", () => {
  const schema = { properties: { s: { type: "string" } } };
  assert.deepEqual(parseKv(["s=true", "b=true", "n=1.5", "t=hello", "e=a=b"], schema), {
    s: "true",
    b: true,
    n: 1.5,
    t: "hello",
    e: "a=b",
  });
  assert.throws(() => parseKv(["novalue"], schema), /key=value/);
});

test("parseSse: 該当IDのメッセージを取り出す", () => {
  const body = 'data: {"jsonrpc":"2.0","id":1,"result":1}\n\ndata: {"jsonrpc":"2.0",\ndata: "id":2,"result":2}\n\n';
  assert.deepEqual(parseSse(body, 2), { jsonrpc: "2.0", id: 2, result: 2 });
  assert.throws(() => parseSse(body, 3), /結果が含まれていません/);
});
