// ビルド確認: 静的サイトのため成果物は作らず、公開物が壊れていないことだけを検査する。
//  1. 公開する JS をすべて構文チェックする
//  2. index.html が参照する CSS / JS が存在することを確認する
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const errors = [];

const jsFiles = ["calc.js", "app.js"];
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" });
  } catch (e) {
    errors.push(`構文エラー: ${f}\n${e.stderr}`);
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((r) => !/^(https?:)?\/\//.test(r));
for (const ref of refs) {
  if (!fs.existsSync(path.join(root, ref))) errors.push(`index.html の参照先がありません: ${ref}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`build ok (JS ${jsFiles.length} 件, 参照 ${refs.length} 件)`);
