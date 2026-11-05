# atl-cli

Atlassian Rovo MCP Server を、MCP クライアントなしで普通のコマンドとして呼び出す CLI です。

ツールの一覧や引数はコマンドを実行するたびにサーバーから取得します（`tools/list`）。そのため、MCP サーバーにツールが追加されても、CLI を変更せずにそのまま使えます。

## 必要なもの

- Node.js 24 以上（`.nvmrc` で 24 を指定。実行時の依存パッケージはありません）

## インストール

```sh
# リポジトリから
npm install -g .

# GitHub から直接
npm install -g github:yoshimaru0419/mobile-claude-test#feature/atl-cli
```

## 設定

| 環境変数 | 内容 |
| --- | --- |
| `ATLASSIAN_API_TOKEN` | API トークン（必須）。`ATLASSIAN_EMAIL` がなければ Bearer として送信 |
| `ATLASSIAN_EMAIL` | Atlassian アカウントのメールアドレス。指定すると Basic 認証 |
| `ATLASSIAN_MCP_URL` | 接続先（省略時 `https://mcp.atlassian.com/v2/mcp?tools=all`） |

### 接続先について

- 既定は Atlassian MCP v2 です。v1（`/v1/mcp`）では一部のツールしか使えません。
- v2 の `/v2/mcp` は、よく使う「Primary」ツールだけを一覧に出し、それ以外は `discover` / `executeRead` などを経由して呼ぶ仕組みです。atl は `?tools=all` を付けて、利用できる全ツールを一覧に出しています。
- 一覧に出るツールは、トークンのスコープと管理者の設定で決まります。

### API トークン

- 組織の管理者が API トークン認証を有効にする必要があります（Atlassian Administration → Rovo → Rovo MCP server → Authentication）。
- **スコープ付きの API トークン**が必要です。スコープなしのトークンでは、認証は通ってもツールの実行が 401 になります。
- 必要なスコープは `read:jira:agent-interface`、`search:jira:agent-interface`、`read:confluence:agent-interface` などです。全ツールとスコープの対応は公式の「Supported tools」ページを参照してください。

## 使い方

```sh
atl tools                                   # 使えるツールの一覧
atl tools --json                            # スキーマ込みで JSON 出力
atl describe searchJiraIssuesUsingJql       # ツールの説明と引数
atl call <ツール名> key=value ...           # ツールを実行
atl call <ツール名> --json '{"key":"value"}'  # 引数を JSON でまとめて渡す
atl call <ツール名> ... --raw               # 応答をそのまま JSON で出力
atl --url <URL> tools                       # 接続先を指定
```

`key=value` の値は、スキーマで `string` 型の引数ならそのまま文字列として渡します。それ以外の型では JSON として解釈し（`5`、`true`、`["a","b"]` など）、解釈できなければ文字列として渡します。

ツールが `isError` を返したときは、終了コード 1 で終わります。

## 検証結果（2026-11-05）

本番の Atlassian MCP v2 に、スコープ付き API トークン（Basic 認証）で接続して読み取りを確認しました。Node 24 で実行しています。

### ツール一覧（`tools/list`）

| 接続先 | ツール数 | Jira | Confluence | その他 |
| --- | --- | --- | --- | --- |
| `https://mcp.atlassian.com/v2/mcp?tools=all`（既定） | 232 | 43 | 71 | 118 |
| `https://mcp.atlassian.com/v2/mcp` | 26 | 7 | 4 | 15 |

- 内訳はツール名に `jira` / `confluence` を含むかどうかで数えた概算です。
- `?tools=all` の「その他」には Bitbucket、JSM、Assets、Loom、Goals / Projects、Focus Area、Talent、Capacity Plan、Teamwork Graph、`search` などが含まれます。
- `?tools=all` なしでは、`discover` / `executeRead` / `executeWrite` / `executeDestructive` と主要な Jira / Confluence ツールだけが一覧に出ます（`listJiraProjects` などは出ません）。

### ツール実行

| コマンド | 結果 |
| --- | --- |
| `atl call atlassianUserInfo` | 成功。`accountId` を取得 |
| `atl call getAccessibleAtlassianResources` | 成功。アクセス可能なサイト 1 件、`cloudId` を取得（Jira / Confluence とも read-write） |
| `atl call listJiraProjects cloudId=<cloudId>` | 成功。プロジェクト 1 件 |

- エラーは発生しませんでした。
- Rovo クレジットを消費しうるツール（`search` や Teamwork Graph 系）と、作成・更新・削除系のツールは実行していません。

## 開発

```sh
npm test   # ローカルのモック MCP サーバーに対して E2E テストを実行
```
