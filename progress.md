# 進捗（再開用）

> 利用制限で中断した場合は、このファイルを読んで再開する。最終更新: 2026-10-27T12:55:11Z

## 現在
- 作業中: API-55 完了（スキル plan-tasks の作成）
- 次の手順: 次のタスクへ

## 再開手順
1. このファイルと Jira（プロジェクト API）で、未完了タスクを確認する（ラベル=工程、ステータス=進行中/To Do）。
2. 作業ブランチは develop_v2 から派生する（feature/ai-dev-*）。PR の先は develop_v2。
3. タスクごとにコミットする。コミット件名の先頭に Jira キーを付ける。
4. 「進行中」のタスクがあれば、その作業の続きから始める（未コミットの変更がないか、git status で確認する）。
5. 承認: 今回に限り、タスクの完了確認は不要（承認扱い）。危険コマンドとシークレット参照は、必ずユーザーに確認する。

## ステータス対応
未着手=To Do / 進行中=進行中 / 承認待ち=レビュー中 / 完了=完了

## PR
| ブランチ | PR |
| --- | --- |
| feature/ai-dev-base | #13 |
| feature/ai-dev-rules | #14 |
| feature/ai-dev-templates | #15 |
| feature/ai-dev-agents | #16 |

## タスク
| キー | 工程 | ブランチ | 件名 | 状態 |
| --- | --- | --- | --- | --- |
| API-31 | 基盤 | feature/ai-dev-base | CLAUDE.md を AI駆動開発向けに整備 | 完了 |
| API-32 | 基盤 | feature/ai-dev-base | 環境変数の雛形 .env.example の作成 | 完了 |
| API-33 | 基盤 | feature/ai-dev-base | プロジェクト台帳 project.json の作成 | 完了 |
| API-34 | 基盤 | feature/ai-dev-base | 再開用の進捗ファイルの仕様と雛形の作成 | 完了 |
| API-35 | ルール | feature/ai-dev-rules | ルール 00-workflow の作成 | 完了 |
| API-36 | ルール | feature/ai-dev-rules | ルール 10-approval の作成 | 完了 |
| API-37 | ルール | feature/ai-dev-rules | ルール 20-atlassian の作成 | 完了 |
| API-38 | ルール | feature/ai-dev-rules | ルール 30-git の作成 | 完了 |
| API-39 | ルール | feature/ai-dev-rules | ルール 40-coding-test の作成 | 完了 |
| API-40 | ルール | feature/ai-dev-rules | ルール 90-security の作成 | 完了 |
| API-41 | テンプレート | feature/ai-dev-templates | 要件定義書テンプレートの作成 | 完了 |
| API-42 | テンプレート | feature/ai-dev-templates | 基本設計書テンプレートの作成 | 完了 |
| API-43 | テンプレート | feature/ai-dev-templates | 詳細設計書テンプレートの作成 | 完了 |
| API-44 | テンプレート | feature/ai-dev-templates | 単体テスト報告書テンプレートの作成 | 完了 |
| API-45 | テンプレート | feature/ai-dev-templates | Jira タスクテンプレートと工程ラベル一覧の作成 | 完了 |
| API-46 | エージェント | feature/ai-dev-agents | エージェント requirements-analyst の作成 | 完了 |
| API-47 | エージェント | feature/ai-dev-agents | エージェント task-planner の作成 | 完了 |
| API-48 | エージェント | feature/ai-dev-agents | エージェント doc-writer の作成 | 完了 |
| API-49 | エージェント | feature/ai-dev-agents | エージェント reviewer の作成 | 完了 |
| API-50 | エージェント | feature/ai-dev-agents | エージェント implementer の作成 | 完了 |
| API-51 | エージェント | feature/ai-dev-agents | エージェント test-writer の作成 | 完了 |
| API-52 | エージェント | feature/ai-dev-agents | エージェント atlassian-writer の作成 | 完了 |
| API-53 | スキル | feature/ai-dev-skills | スキル ai-dev-start の作成 | 完了 |
| API-54 | スキル | feature/ai-dev-skills | スキル requirements-interview の作成 | 完了 |
| API-55 | スキル | feature/ai-dev-skills | スキル plan-tasks の作成 | 完了 |
| API-56 | スキル | feature/ai-dev-skills | スキル run-phase の作成 | 未着手 |
| API-57 | スキル | feature/ai-dev-skills | スキル approval-gate の作成 | 未着手 |
| API-58 | スキル | feature/ai-dev-skills | スキル jira-ops の作成 | 未着手 |
| API-59 | スキル | feature/ai-dev-skills | スキル confluence-ops の作成 | 未着手 |
| API-60 | スキル | feature/ai-dev-skills | スキル implement-with-tests の作成 | 未着手 |
| API-61 | フック | feature/ai-dev-hooks | フック session-start の作成 | 未着手 |
| API-62 | フック | feature/ai-dev-hooks | フック guard-bash の作成 | 未着手 |
| API-63 | フック | feature/ai-dev-hooks | フック guard-gate の作成 | 未着手 |
| API-64 | フック | feature/ai-dev-hooks | フック verify-write の作成 | 未着手 |
| API-65 | フック | feature/ai-dev-hooks | settings.json の作成（権限・フック登録・モデル固定） | 未着手 |
