#!/usr/bin/env bash
# PreToolUse(Bash) フック: 承認なしの工程進行を阻止する。
# Jira の課題を「進行中」にする遷移（id=21）のとき、同じプロジェクトで「前の工程」のタスクが
# 完了でなければ、ブロックする（終了コード 2）。工程の順序は .claude/project.json の phaseLabels。
# 解除: ユーザーが許可した場合に限り、コマンドに AI_DEV_SKIP_GATE=1 を付ける。
# 注意: 確認できない場合（接続不可など）は、作業を止めないために許可する。
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true
HOOK_INPUT="$(cat)" python3 -I - <<'PY'
import base64, json, os, re, sys, urllib.parse, urllib.request

try:
    cmd = (json.loads(os.environ.get("HOOK_INPUT", "{}")).get("tool_input") or {}).get("command", "") or ""
except Exception:
    sys.exit(0)

m = re.search(r"/rest/api/3/issue/([A-Z][A-Z0-9]*-\d+)/transitions", cmd)
if not m or not re.search(r'"id"\s*:\s*\\?"?21\b', cmd) or "AI_DEV_SKIP_GATE=1" in cmd:
    sys.exit(0)
issue = m.group(1)

try:
    cfg = json.load(open(".claude/project.json"))["jira"]
    phases, project = cfg["phaseLabels"], cfg["projectKey"]
    base = os.environ["JIRA_BASE_URL"].rstrip("/")
    auth = base64.b64encode(f'{os.environ["JIRA_EMAIL"]}:{os.environ["JIRA_API_TOKEN"]}'.encode()).decode()

    def get(path, **params):
        url = f"{base}{path}" + ("?" + urllib.parse.urlencode(params) if params else "")
        req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth}", "Accept": "application/json"})
        return json.load(urllib.request.urlopen(req, timeout=10))

    labels = get(f"/rest/api/3/issue/{issue}", fields="labels")["fields"]["labels"]
    idx = [phases.index(l) for l in labels if l in phases]
    if not idx or min(idx) == 0:
        sys.exit(0)  # 工程ラベルがない、または最初の工程
    earlier = phases[: min(idx)]
    jql = f'project = {project} AND labels in ({",".join(chr(34) + p + chr(34) for p in earlier)}) AND statusCategory != Done'
    pending = get("/rest/api/3/search/jql", jql=jql, fields="summary,status", maxResults=20).get("issues", [])
    # 検索の結果にも、完了（done）のものが混じらないよう、念のため取り除く
    pending = [i for i in pending if i["fields"]["status"].get("statusCategory", {}).get("key") != "done"]
except SystemExit:
    raise
except Exception:
    sys.exit(0)

if pending:
    lines = [f"  - {i['key']} {i['fields']['summary']}（{i['fields']['status']['name']}）" for i in pending]
    sys.stderr.write(f"【ゲート】{issue} は、前の工程（{' / '.join(earlier)}）が完了していないため、着手できません。\n"
                     "前の工程のタスクが、承認されて「完了」になってから進めてください。\n未完了:\n" + "\n".join(lines) + "\n"
                     "ユーザーが許可した場合のみ、コマンドに AI_DEV_SKIP_GATE=1 を付けて実行できます。\n")
    sys.exit(2)
sys.exit(0)
PY
