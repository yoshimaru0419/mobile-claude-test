# Web電卓

ブラウザだけで動く電卓アプリです。フロントエンドのみ（HTML / CSS / JavaScript）で、ビルドや外部ライブラリは使いません。

## 機能
- 加算（`+`）、減算（`−`）、乗算（`×`）、除算（`÷`）
- `=` による計算結果の表示、連続計算（例: `1+2+3=` は `6`）
- 小数の入力、`C` によるクリア
- ゼロ除算は「エラー」と表示（数字を入力すると復帰）

## 使い方
1. 数字、演算子、`=` の順にボタンを押します。
2. 演算子を押すと、そのボタンが白く強調されます。
3. `C` で入力と計算をすべてクリアします。

## 起動方法
`index.html` をブラウザで開くだけで動きます。

```sh
git clone https://github.com/yoshimaru0419/mobile-claude-test.git
cd mobile-claude-test
open index.html   # Linux は xdg-open、Windows は start
```

GitHub Pages で公開する場合は、Settings → Pages で公開するブランチと `/ (root)` を指定します。

## 開発
Node.js 18 以上が必要です（外部パッケージのインストールは不要）。

| コマンド | 内容 |
| --- | --- |
| `npm test` | `calc.js` のテストを実行 |
| `npm run build` | ビルド確認（JS の構文チェックと、`index.html` の参照先の存在確認） |

プルリクエストのたびに、GitHub Actions で `npm run build` と `npm test` が実行されます。

## ファイル構成
| ファイル | 役割 |
| --- | --- |
| `index.html` | 画面 |
| `style.css` | スタイル |
| `calc.js` | 計算ロジック（DOM に触れない） |
| `app.js` | 画面操作（ボタンのクリック処理と表示の更新） |
| `test/calc.test.js` | `calc.js` のテスト |
| `scripts/build-check.js` | ビルド確認 |

## Git ルール
ブランチの運用は [CLAUDE.md](CLAUDE.md) を参照してください。
