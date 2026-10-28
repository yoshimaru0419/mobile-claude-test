#!/usr/bin/env bash
# PreToolUse(Bash) フック: 危険な操作を阻止する。阻止は終了コード 2、理由は標準エラー出力。
# 解除: ユーザーが対象と範囲を示して許可した場合に限り、コマンドに下記の印を付ける。
#   AI_DEV_ALLOW_DELETE=1          … Jira / Confluence の DELETE を許可
#   AI_DEV_ALLOW_PROTECTED_PUSH=1  … 保護ブランチへの push / 強制 push を許可
HOOK_INPUT="$(cat)" python3 -I - <<'PY'
import json, os, re, subprocess, sys

try:
    cmd = (json.loads(os.environ.get("HOOK_INPUT", "{}")).get("tool_input") or {}).get("command", "") or ""
except Exception:
    sys.exit(0)

allow_delete = "AI_DEV_ALLOW_DELETE=1" in cmd
allow_push = "AI_DEV_ALLOW_PROTECTED_PUSH=1" in cmd
protected = r"(?:develop_v2|develop|staging|main)"
reasons = []

# 1. Jira / Confluence の削除
if re.search(r"(-X\s*DELETE|--request\s+DELETE)", cmd, re.I) and re.search(r"atlassian|JIRA_BASE_URL|/rest/api/|/wiki/", cmd, re.I) and not allow_delete:
    reasons.append("Jira / Confluence の削除は、ユーザーが対象と範囲を示して許可したときだけ実行できます。許可を得て、コマンドに AI_DEV_ALLOW_DELETE=1 を付けてください。")

# 2. git push（強制 push、保護ブランチ）
if re.search(r"\bgit\s+(?:-C\s+\S+\s+)?push\b", cmd):
    if re.search(r"(\s--force\b|\s--force-with-lease|\s-f\b|\s\+\S)", cmd) and not allow_push:
        reasons.append("強制 push は、ユーザーの許可が必要です（履歴を書き換えます）。")
    to_protected = re.search(r"(?:\s|:)(?:refs/heads/)?" + protected + r"(?:\s|$)", cmd) and re.search(r"\bpush\b.*\b(?:origin|upstream)\b", cmd)
    if not to_protected:
        try:
            branch = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True, timeout=5).stdout.strip()
        except Exception:
            branch = ""
        explicit_ref = re.search(r"\bpush\b(?:\s+-\S+)*\s+\S+\s+\S+", cmd)
        if re.fullmatch(protected, branch or "") and not explicit_ref:
            to_protected = True
    if to_protected and not allow_push:
        reasons.append("保護ブランチ（develop_v2 / develop / staging / main）への直接 push は禁止です。作業ブランチから PR を作成してください。例外は、ユーザーの許可を得て AI_DEV_ALLOW_PROTECTED_PUSH=1 を付けます。")

# 3. 秘密情報の出力
secret_patterns = [
    r"\b(echo|printf)\b[^|;&]*\$\{?JIRA_API_TOKEN",
    r"\bprintenv\b",
    r"(^|[;&|]\s*)env\s*($|[;&|])",
    r"(^|[;&|]\s*)(set|export\s+-p|declare\s+-[xp]+)\s*($|[;&|])",
    r"/proc/\S*/environ",
    r"\bcat\b[^|;&]*\.env(?!\.example)\b",
]
if any(re.search(p, cmd) for p in secret_patterns):
    reasons.append("秘密情報（環境変数・.env）の内容を出力する可能性があります。値は表示しないでください。存在の確認は「設定あり/未設定」だけで行います。必要な場合は、ユーザーに確認してください。")

# 4. 破壊的な削除
if re.search(r"\brm\s+(?:-\w*r\w*f|-\w*f\w*r)\w*\s+(?:/|~|\$HOME)(?:\s|$|\*)", cmd):
    reasons.append("ルートやホームの再帰削除は禁止です。")

if reasons:
    sys.stderr.write("【ガード】この操作はブロックしました。\n" + "\n".join("- " + r for r in reasons) + "\n")
    sys.exit(2)
sys.exit(0)
PY
