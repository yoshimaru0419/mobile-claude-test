#!/usr/bin/env bash
# SessionStart フック: 環境と状態を確認し、標準出力で Claude に渡す（値は出力しない）。
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true
echo "【AI駆動開発】セッション開始チェック"

missing=0
for v in JIRA_BASE_URL JIRA_EMAIL JIRA_API_TOKEN; do
  if [ -n "${!v}" ]; then echo "- $v: 設定あり"; else echo "- $v: 未設定"; missing=1; fi
done
if [ "$missing" = 1 ]; then
  echo "! 環境変数が不足しています。.env.example を参照して、環境設定に追加するよう、ユーザーに案内してください（値をチャットに貼らせないこと）。"
fi

# Jira の状態を、ステータスごとに集計（読み取りのみ。失敗しても無視）
if [ "$missing" = 0 ] && [ -f .claude/project.json ] && command -v python3 >/dev/null 2>&1; then
  python3 -I - <<'PY' 2>/dev/null || echo "- Jira の状態: 取得できませんでした（接続を確認してください）"
import base64, json, os, urllib.parse, urllib.request
base = os.environ["JIRA_BASE_URL"].rstrip("/")
key = json.load(open(".claude/project.json"))["jira"]["projectKey"]
auth = base64.b64encode(f'{os.environ["JIRA_EMAIL"]}:{os.environ["JIRA_API_TOKEN"]}'.encode()).decode()
q = urllib.parse.urlencode({"jql": f"project = {key}", "fields": "status", "maxResults": 100})
req = urllib.request.Request(f"{base}/rest/api/3/search/jql?{q}", headers={"Authorization": f"Basic {auth}", "Accept": "application/json"})
issues = json.load(urllib.request.urlopen(req, timeout=10)).get("issues", [])
counts = {}
for i in issues:
    s = i["fields"]["status"]["name"]; counts[s] = counts.get(s, 0) + 1
print(f"- Jira（{key}）: 合計 {len(issues)} 件 / " + (" / ".join(f"{k} {v}" for k, v in counts.items()) or "なし"))
PY
fi

echo "- 進捗ファイル: ブランチ claude/progress-state の progress.md（仕様: .claude/state/README.md）"
echo "→ まず ai-dev-start スキルで、状態を復元して、次の一手を決めてください。"
exit 0
