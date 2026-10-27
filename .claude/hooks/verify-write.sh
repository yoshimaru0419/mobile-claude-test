#!/usr/bin/env bash
# PostToolUse(Bash) フック: Jira / Confluence への書き込みの後に、取得して検証するよう促す。
# 実行済みの操作は止められないため、終了コード 2 で、標準エラー出力を Claude に見せる。
HOOK_INPUT="$(cat)" python3 -I - <<'PY'
import json, os, re, sys

try:
    cmd = (json.loads(os.environ.get("HOOK_INPUT", "{}")).get("tool_input") or {}).get("command", "") or ""
except Exception:
    sys.exit(0)

is_atlassian = re.search(r"atlassian|JIRA_BASE_URL|/rest/api/|/wiki/", cmd, re.I)
is_write = re.search(r"(-X\s*(POST|PUT|DELETE)\b|--request\s+(POST|PUT|DELETE)\b|--data\b|\s-d\s)", cmd, re.I)
is_read_search = re.search(r"/search/jql|/myself|/createmeta", cmd)
if is_atlassian and is_write and not is_read_search:
    sys.stderr.write(
        "【検証】Jira / Confluence への書き込みを実行しました。次に進む前に、取得し直して確認してください。\n"
        "- 件数・ラベル・ステータス・期限・見積もり（Jira）、版・章の数・表の数（Confluence）\n"
        "- 結果が見えない、または失敗した場合は、再実行する前に現状を取得すること（二重登録を避ける）\n"
        "- 応答は、本文とステータスコードを分けて取得すること\n")
    sys.exit(2)
sys.exit(0)
PY
