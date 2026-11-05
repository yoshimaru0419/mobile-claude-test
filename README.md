# atl-cli

Atlassian Rovo MCP Server を、MCP クライアントなしで普通のコマンドとして呼び出す CLI です。

ツールの一覧や引数はコマンドを実行するたびにサーバーから取得します（`tools/list`）。そのため、MCP サーバーにツールが追加されても、CLI を変更せずにそのまま使えます。

## 必要なもの

- Node.js 18.18 以上（実行時の依存パッケージはありません）

## インストール

```sh
# リポジトリから
npm install -g .

# GitHub から直接
npm install -g github:yoshimaru0419/mobile-claude-test#develop_v4
```

## 設定

| 環境変数 | 内容 |
| --- | --- |
| `ATLASSIAN_API_TOKEN` | API トークン（必須）。`ATLASSIAN_EMAIL` がなければ Bearer として送信 |
| `ATLASSIAN_EMAIL` | Atlassian アカウントのメールアドレス。指定すると Basic 認証 |
| `ATLASSIAN_MCP_URL` | 接続先（省略時 `https://mcp.atlassian.com/v1/mcp`） |

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

## 開発

```sh
npm test   # ローカルのモック MCP サーバーに対して E2E テストを実行
```
