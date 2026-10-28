# シーケンス図（Mermaid）

設計書のシーケンス図を、コード（Mermaid）で管理する。画像（PNG）は、ここには置かず、Confluence の設計書の子ページに貼る。

| 場所 | 内容 | Confluence |
| --- | --- | --- |
| `basic/*.mmd` | 基本設計の図（モジュール間のやりとり） | 基本設計書の子ページ |
| `detail/*.mmd` | 詳細設計の図（関数単位の呼び出し） | 詳細設計書の子ページ |
| `mermaid-config.json` | 描画の設定（日本語フォント、番号の表示） | - |

## 画像への描画

日本語のフォントが必要（例: IPA ゴシック、Noto Sans CJK JP）。ブラウザ（Chromium）の場所は、環境によって違うため、`puppeteer.json` を自分で作る（コミットしない）。

```json
{ "executablePath": "/path/to/chrome", "args": ["--no-sandbox"] }
```

```bash
# 1 つの図
npx -p @mermaid-js/mermaid-cli mmdc -i docs/diagrams/basic/01-startup.mmd -o out/01-startup.png \
  -c docs/diagrams/mermaid-config.json -p puppeteer.json -s 2 -b white

# すべての図
for f in docs/diagrams/*/*.mmd; do
  npx -p @mermaid-js/mermaid-cli mmdc -i "$f" -o "out/$(basename "${f%.mmd}").png" \
    -c docs/diagrams/mermaid-config.json -p puppeteer.json -s 2 -b white
done
```

`@mermaid-js/mermaid-cli` は、描画の道具で、アプリの依存には入れない（`npx` で一時的に使う）。

## 書き方の決まり
- ファイル名は、`<番号>-<内容>.mmd`。先頭の `title` に、図の名前を書く。
- 参加者（participant）の名前は、設計書とコードの名前に合わせる（例: `core/game`、`ui/main`）。
- 図は、コードと食い違わないようにする。コードを変更したときは、該当の図も直す。
- 基本設計の図は、モジュール間のやりとり。詳細設計の図は、関数単位の呼び出しと、条件分岐（`alt`、`opt`、`loop`）まで書く。
- Confluence に貼るときは、画像と、ソース（`.mmd` の中身）の両方を載せる。
