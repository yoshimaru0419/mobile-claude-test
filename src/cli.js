// atl - Atlassian Rovo MCP Server を普通のコマンドとして呼び出すCLIラッパー
import { parseArgs } from "node:util";
import { CliError, DEFAULT_URL, MCPClient, VERSION } from "./mcp-client.js";

const HELP = `atl - Atlassian Rovo MCP Server のCLIラッパー

使い方:
  atl tools [--json]                 使えるツールの一覧（--json でスキーマ込み）
  atl describe <ツール名>            ツールの説明と引数
  atl call <ツール名> key=value ...  ツールを実行
  atl call <ツール名> --json '{...}' 引数をJSONで渡して実行
  atl call ... --raw                 応答をそのままJSONで出力

共通オプション:
  --url <URL>     MCPサーバーのURL（既定: 環境変数 ATLASSIAN_MCP_URL または ${DEFAULT_URL}）
  -h, --help      このヘルプを表示
  -v, --version   バージョンを表示

環境変数:
  ATLASSIAN_EMAIL      Atlassianアカウントのメールアドレス（Basic認証）
  ATLASSIAN_API_TOKEN  APIトークン（EMAILなしならBearerとして送信）
  ATLASSIAN_MCP_URL    接続先（省略時 ${DEFAULT_URL}）
`;

const COMMON_OPTIONS = {
  url: { type: "string" },
  help: { type: "boolean", short: "h" },
};

const COMMANDS = {
  tools: {
    options: { json: { type: "boolean" } },
    run: cmdTools,
  },
  describe: {
    options: {},
    run: cmdDescribe,
  },
  call: {
    options: { json: { type: "string" }, raw: { type: "boolean" } },
    run: cmdCall,
  },
};

// ---------- 補助関数 ----------

const out = (s = "") => process.stdout.write(s + "\n");
const err = (s = "") => process.stderr.write(s + "\n");
const pretty = (v) => JSON.stringify(v, null, 2);

function buildAuth(env) {
  const token = env.ATLASSIAN_API_TOKEN;
  if (!token) throw new CliError("環境変数 ATLASSIAN_API_TOKEN を設定してください");
  const email = env.ATLASSIAN_EMAIL;
  if (email) {
    return "Basic " + Buffer.from(`${email}:${token}`, "utf8").toString("base64");
  }
  return "Bearer " + token;
}

async function connect(ctx) {
  const client = new MCPClient(ctx.url, buildAuth(ctx.env));
  await client.initialize();
  return client;
}

function findTool(tools, name) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    throw new CliError(`ツール '${name}' は見つかりません。\`atl tools\` で一覧を確認してください`);
  }
  return tool;
}

/** key=value を引数オブジェクトに変換。スキーマがstring型ならそのまま、他はJSONとして解釈 */
export function parseKv(pairs, schema) {
  const props = schema?.properties ?? {};
  const args = {};
  for (const p of pairs) {
    const i = p.indexOf("=");
    if (i < 0) throw new CliError(`引数は key=value 形式で指定してください: ${p}`);
    const key = p.slice(0, i);
    const value = p.slice(i + 1);
    if (props[key]?.type === "string") {
      args[key] = value;
      continue;
    }
    try {
      args[key] = JSON.parse(value);
    } catch {
      args[key] = value;
    }
  }
  return args;
}

/** ツールの実行結果を表示し、終了コードを返す */
function printResult(result, raw) {
  if (raw) {
    out(pretty(result));
  } else {
    const content = result?.content ?? [];
    for (const item of content) {
      if (item?.type === "text") {
        const text = item.text ?? "";
        try {
          out(pretty(JSON.parse(text)));
        } catch {
          out(text);
        }
      } else {
        out(pretty(item));
      }
    }
    if (content.length === 0 && result?.structuredContent !== undefined) {
      out(pretty(result.structuredContent));
    }
  }
  return result?.isError ? 1 : 0;
}

// ---------- サブコマンド ----------

async function cmdTools(ctx, values) {
  const tools = await (await connect(ctx)).listTools();
  if (values.json) {
    out(pretty(tools));
    return 0;
  }
  const sorted = [...tools].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const t of sorted) {
    const first = (t.description ?? "").trim().split(/\r?\n/)[0] ?? "";
    out(`${t.name.padEnd(40)} ${first}`);
  }
  err(`\n合計 ${tools.length} ツール`);
  return 0;
}

async function cmdDescribe(ctx, values, positionals) {
  if (positionals.length !== 1) throw new CliError("使い方: atl describe <ツール名>");
  const tool = findTool(await (await connect(ctx)).listTools(), positionals[0]);
  const schema = tool.inputSchema ?? {};
  const required = new Set(schema.required ?? []);
  out(`# ${tool.name}\n`);
  out((tool.description ?? "").trim() + "\n");
  out("## 引数");
  const props = Object.entries(schema.properties ?? {});
  if (props.length === 0) out("（なし）");
  for (const [name, p] of props) {
    const mark = required.has(name) ? "必須" : "任意";
    const typ = Array.isArray(p.type) ? p.type.join("|") : (p.type ?? "any");
    const desc = (p.description ?? "").trim().replace(/\r?\n/g, " ");
    out(`- ${name} (${typ}, ${mark}) ${desc}`);
  }
  return 0;
}

async function cmdCall(ctx, values, positionals) {
  const [toolName, ...params] = positionals;
  if (!toolName) throw new CliError("使い方: atl call <ツール名> [key=value ...] [--json '{...}']");
  if (values.json !== undefined && params.length > 0) {
    throw new CliError("--json と key=value 形式の引数は同時に指定できません");
  }
  const client = await connect(ctx);
  let args;
  if (values.json !== undefined) {
    try {
      args = JSON.parse(values.json);
    } catch (e) {
      throw new CliError(`--json の形式が正しくありません: ${e.message}`);
    }
  } else {
    const tool = findTool(await client.listTools(), toolName);
    args = parseKv(params, tool.inputSchema);
  }
  return printResult(await client.callTool(toolName, args), values.raw);
}

// ---------- エントリポイント ----------

/**
 * @param {string[]} argv コマンドライン引数（process.argv.slice(2)）
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<number>} 終了コード
 */
export async function main(argv, env = process.env) {
  try {
    // サブコマンドより前にある共通オプションを読む
    let url;
    let i = 0;
    for (; i < argv.length; i++) {
      const a = argv[i];
      if (a === "-h" || a === "--help") {
        out(HELP);
        return 0;
      } else if (a === "-v" || a === "--version") {
        out(VERSION);
        return 0;
      } else if (a === "--url") {
        url = argv[++i];
        if (url === undefined) throw new CliError("--url には値が必要です");
      } else if (a.startsWith("--url=")) {
        url = a.slice(6);
      } else if (a.startsWith("-")) {
        throw new CliError(`不明なオプションです: ${a}\n\n${HELP}`);
      } else {
        break;
      }
    }

    const name = argv[i];
    if (name === undefined) {
      err(HELP);
      return 2;
    }
    const command = COMMANDS[name];
    if (!command) throw new CliError(`不明なコマンドです: ${name}\n\n${HELP}`);

    let parsed;
    try {
      parsed = parseArgs({
        args: argv.slice(i + 1),
        options: { ...COMMON_OPTIONS, ...command.options },
        allowPositionals: true,
        strict: true,
      });
    } catch (e) {
      throw new CliError(e.message);
    }
    if (parsed.values.help) {
      out(HELP);
      return 0;
    }

    const ctx = {
      env,
      url: parsed.values.url ?? url ?? env.ATLASSIAN_MCP_URL ?? DEFAULT_URL,
    };
    return await command.run(ctx, parsed.values, parsed.positionals);
  } catch (e) {
    if (e instanceof CliError) {
      err(e.message);
      return 1;
    }
    throw e;
  }
}
