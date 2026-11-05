# CLAUDE.md

## Gitルール

### 長期ブランチ
- `develop`: 開発の統合ブランチ。作業ブランチの派生元
- `staging`: 検証用ブランチ

### 作業ブランチの命名と派生元
| 種別 | ブランチ名 | 派生元 |
| --- | --- | --- |
| 機能追加 | `feature/**` | `develop` |
| ドキュメント作成 | `doc/**` | `develop` |

- 作業ブランチは必ず `develop` から作成する
- 作成例: `git checkout -b feature/login origin/develop`

## Atlassian（Jira / Confluence など）の操作

### MCP ではなく `atl` CLI を使う
- Jira や Confluence などの Atlassian 製品を操作するときは、Atlassian の MCP サーバーを MCP クライアントとして接続せず、このリポジトリの `atl` CLI を使う
- `atl` は Atlassian Rovo MCP Server（`https://mcp.atlassian.com/v2/mcp?tools=all`）を普通のコマンドとして呼び出すラッパー。ツール一覧は実行のたびにサーバーから取得するので、MCP に追加されたツールもそのまま使える
- 使い方の詳細は `README.md` を参照

### 準備
- Node.js 24 以上が必要
- インストール: `npm install -g .`（リポジトリから）
- 環境変数 `ATLASSIAN_EMAIL` と `ATLASSIAN_API_TOKEN`（スコープ付き API トークン）を使う。値は表示・出力しない

### 基本の流れ
1. `atl tools` で使えるツールを確認する
2. `atl describe <ツール名>` で引数を確認する
3. `atl call <ツール名> key=value ...` で実行する
   - 多くのツールは `cloudId` が必要。`atl call getAccessibleAtlassianResources` で取得する

### 実行してよいもの・確認が必要なもの
- 読み取り専用のツール（`get*`、`list*`、`atlassianUserInfo` など）は実行してよい
- 作成・更新・削除系のツール（`create*`、`edit*`、`update*`、`delete*`、`transition*`、`add*`、`manage*` など）は、実行前に必ずユーザーの確認を取る
- Rovo クレジット（Atlassian 側の利用枠）を消費しうるツール（`search`、`getTeamworkGraphContext` などの Teamwork Graph 系）は、実行前に必ずユーザーの確認を取る
