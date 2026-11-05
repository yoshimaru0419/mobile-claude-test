# AGENTS.md

AI エージェント（Claude Code、GitHub Copilot など）向けの指示です。

## Atlassian（Jira / Confluence など）の操作

### MCP ではなく `atl` CLI を使う
- Jira や Confluence などの Atlassian 製品を操作するときは、Atlassian の MCP サーバーを MCP クライアントとして接続せず、このリポジトリの `atl` CLI をターミナルで実行する
- `atl` は Atlassian Rovo MCP Server（`https://mcp.atlassian.com/v2/mcp?tools=all`）を普通のコマンドとして呼び出すラッパー。ツール一覧は実行のたびにサーバーから取得するので、MCP に追加されたツールもそのまま使える
- 使い方の詳細は `README.md` を参照

### 準備
- Node.js 24 以上が必要
- インストール: `npm install -g .`（リポジトリから）
- 環境変数 `ATLASSIAN_EMAIL` と `ATLASSIAN_API_TOKEN`（スコープ付き API トークン）を使う。値は表示・出力しない

### 基本の流れ
1. 依頼の対象（プロジェクト、スペースなど）を、下の「既定値」と「呼び名の対応」で特定する
2. `atl tools` で使えるツールを確認する（`atl tools | grep -i jira` のように絞り込んでよい）
3. `atl describe <ツール名>` で引数を確認する
4. `atl call <ツール名> key=value ...` で実行する

### 実行してよいもの・確認が必要なもの
- 読み取り専用のツール（`get*`、`list*`、`lookup*`、`atlassianUserInfo` など）は実行してよい
- 作成・更新・削除系のツール（`create*`、`edit*`、`update*`、`delete*`、`transition*`、`add*`、`manage*` など）は、実行前に入力内容を見せてユーザーの確認を取る
- Rovo クレジット（Atlassian 側の利用枠）を消費しうるツール（`search`、`getTeamworkGraphContext` などの Teamwork Graph 系）は、実行前に必ずユーザーの確認を取る
- Jira の検索は `searchJiraIssuesUsingJql`（JQL）、Confluence の検索は `searchConfluence`（CQL）を使う

### 迷ったとき
- 依頼の対象に当てはまる候補が複数あるときは、候補を示してユーザーに選んでもらう
- 「既定値」に書かれていないプロジェクトやスペースを操作するときは、操作前にユーザーに確認する
- 必須項目が分からないまま作成しない。`atl describe` や `getJiraIssueTypeMetaWithFields` で調べ、埋められない項目はユーザーに聞く

## 既定値（このプロジェクト）

### 共通
- サイト: `https://yoshimaru0419.atlassian.net`
  - `cloudId` が必要なツールには、このサイト URL を渡す（要確認: URL で通らなければ `getAccessibleAtlassianResources` で取得した cloudId を使う）
  - サイトはこの 1 件だけなので、`getAccessibleAtlassianResources` を毎回呼ぶ必要はない
- 検索の件数は `maxResults: 10`（Confluence は `limit: 10`）を基本にし、足りなければ増やす

### Jira
| 項目 | 値 |
| --- | --- |
| プロジェクトキー | `API` |
| プロジェクト名 | API接続検証用 |
| 種類 | ソフトウェア（チーム管理） |
| 課題タイプ | 要確認（例: 「タスク」→ Task、「バグ」→ Bug） |
| 作成時の必須項目 | 要確認 |
| ステータス | 要確認（「完了にして」などをどの遷移に対応させるか） |
| ボード | 要確認 |

### Confluence
| 用途 | スペースキー | spaceId | 備考 |
| --- | --- | --- | --- |
| 要求仕様 | 要確認 | 要確認 | 親ページ ID: 要確認 |
| 議事録 | 要確認 | 要確認 | |

- 新しいページのタイトル: 要確認（例: `[要求仕様] <機能名>`）

### 呼び名の対応
ユーザーがふだん使う呼び名と、実際のキーや ID の対応です。

| 呼び名 | 実体 |
| --- | --- |
| 「API」「接続検証」 | Jira プロジェクト `API` |
| 「仕様」「要求仕様」 | 要確認（Confluence スペース） |

### よく使う検索
- 未完了の課題: `project = API AND statusCategory != Done ORDER BY updated DESC`
- 自分の担当: `project = API AND assignee = currentUser() AND statusCategory != Done`
- 要求仕様の検索（CQL）: 要確認（例: `space = "XXX" AND title ~ "要求仕様"`）
