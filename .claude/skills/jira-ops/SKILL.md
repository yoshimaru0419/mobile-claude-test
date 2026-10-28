---
name: jira-ops
description: Jira Cloud の REST API を curl で操作する手順と見本。起票・更新・ステータス遷移・検索・削除、書き込み後の検証、落とし穴をまとめる。Jira を操作するときに使う。
---
# jira-ops: Jira の操作（curl）

MCP は使わず、`curl` で REST API を呼ぶ。認証は環境変数（値は表示しない）。書き込みは `atlassian-writer` が行う。

## 共通
```bash
J="curl -sS -m 20 -u $JIRA_EMAIL:$JIRA_API_TOKEN -H 'Accept: application/json'"
```
識別子は `.claude/project.json`（プロジェクトキー、遷移ID）。

## 読み取り
```bash
# 自分の確認
$J "$JIRA_BASE_URL/rest/api/3/myself"
# 課題タイプ
$J "$JIRA_BASE_URL/rest/api/3/issue/createmeta/<KEY>/issuetypes"
# 検索（新しい API）
$J -G --data-urlencode 'jql=project = <KEY> ORDER BY key ASC' --data-urlencode 'fields=summary,status,labels' "$JIRA_BASE_URL/rest/api/3/search/jql"
# 変更できるステータス
$J "$JIRA_BASE_URL/rest/api/3/issue/<ISSUE>/transitions"
```

## 起票（POST /rest/api/3/issue）
`.claude/templates/jira/task.json` の型を、`jq -n` で組み立てる。説明欄は ADF 形式。
```bash
curl ... -H 'Content-Type: application/json' -X POST --data @payload.json -o resp.json -w '%{http_code}' "$JIRA_BASE_URL/rest/api/3/issue"
# 成功: 201 と { "key": "..." }
```

## 更新（PUT /rest/api/3/issue/{key}）→ 204
- 見積もり: `{"fields":{"timetracking":{"originalEstimate":"2h"}}}`
- ラベルは**上書き**。追加は `{"update":{"labels":[{"add":"x"}]}}`。

## ステータス遷移（POST /rest/api/3/issue/{key}/transitions）→ 204
`{"transition":{"id":"21"}}`（11=未着手 / 21=進行中 / 31=承認待ち / 41=完了。環境により異なるため、`transitions` で確認する）

## 削除（DELETE /rest/api/3/issue/{key}）→ 204
**ユーザーが対象と範囲を示して許可したときだけ。** 実行前に、対象の一覧を取得して確認する。

## 書き込み後の検証（必須）
取得し直して、件数・ラベル・ステータス・期限・見積もりを確認する。

## 落とし穴
- 応答の整形は、本文とステータスコードを**分けて**取得する（`-o ファイル -w '%{http_code}'`）。同じ行に出すと、`jq` が失敗して結果が見えなくなる。
- 結果が見えない・失敗したときは、**再実行の前に現状を取得する**（二重登録を避ける）。
- 課題タイプ・遷移ID・必須項目は、環境ごとに違う。実際に問い合わせて確認する。
- ステータス名の画面表示は、API では変更できない（管理者の操作）。
