---
name: confluence-ops
description: Confluence Cloud の REST API（v2）を curl で操作する手順と見本。ページの作成・更新・取得・検証と、ストレージ形式の落とし穴をまとめる。Confluence を操作するときに使う。
---
# confluence-ops: Confluence の操作（curl）

MCP は使わず、`curl` で REST API v2 を呼ぶ。Jira と同じ認証情報を使う。書き込みは `atlassian-writer` が行う。

## 共通
```bash
C="curl -sS -m 30 -u $JIRA_EMAIL:$JIRA_API_TOKEN -H 'Accept: application/json'"
```

## 読み取り
```bash
# スペース一覧（ID を得る）
$C "$JIRA_BASE_URL/wiki/api/v2/spaces?limit=25"
# ページの取得（本文はストレージ形式）
$C "$JIRA_BASE_URL/wiki/api/v2/pages/<ID>?body-format=storage"
# 同名ページの確認
$C -G --data-urlencode 'title=<タイトル>' --data-urlencode 'space-id=<SPACE>' "$JIRA_BASE_URL/wiki/api/v2/pages"
```

## 作成（POST /wiki/api/v2/pages）
```bash
jq -n --rawfile body 本文.html '{spaceId:"<SPACE>", status:"current", title:"<タイトル>", body:{representation:"storage", value:$body}}' > page.json
curl ... -H 'Content-Type: application/json' -X POST --data @page.json -o resp.json -w '%{http_code}' "$JIRA_BASE_URL/wiki/api/v2/pages"
```
成功すると `id` と `_links.webui` が返る。本文は、HTML ファイルに書き、`jq --rawfile` で JSON にする（エスケープで壊れにくい）。

## 更新（PUT /wiki/api/v2/pages/{id}）
現在の版を取得し、`version.number` を **+1** して、`id` `status` `title` `body` を付けて送る。

## 登録前の確認
1. 同名ページがないこと（同一スペースでは、同名ページは作れない）。
2. **整形式であること**（XML として正しい）。
3. 文字参照を使っていないこと。

## 登録後の検証（必須）
取得し直して、版・状態・章（`<h2>`）の数・表の数を確認する。

## 落とし穴
- ストレージ形式は XML。`&divide;` `&times;` `&minus;` などの HTML 文字参照は**使えない**。実際の文字（÷ × −）を書く。`&` `<` `>` は `&amp;` `&lt;` `&gt;`。
- Confluence は、保存時に ÷ などを文字参照として保持するが、画面では正しく表示される。取得時に `&divide;` に見えても、失われてはいない。
- 個人スペースしかない場合は、そこに作る。共有スペースへの配置は、ユーザーに確認する。
- 本文に、秘密情報を書かない。
