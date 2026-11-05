#!/usr/bin/env node
import http from "node:http";
import { main } from "../src/cli.js";

// fetch は既定では HTTPS_PROXY / HTTP_PROXY / NO_PROXY を見ないため、
// 社内プロキシ経由でも接続できるよう環境変数のプロキシ設定を有効にする
if (typeof http.setGlobalProxyFromEnv === "function") {
  http.setGlobalProxyFromEnv();
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (e) => {
    console.error(e);
    process.exitCode = 1;
  },
);
