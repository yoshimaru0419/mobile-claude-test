# 進捗（再開用）

> 利用制限で中断した場合は、このファイルを読んで再開する。最終更新: 2026-10-28T11:59:21Z

## 現在
- 作業中: AI駆動開発の基盤（35タスク・PR #13〜#18）がすべて develop_v2 にマージ済み
- 次の手順: 次の改善候補: (1) confluence-ops の spaceId 参照 (2) guard-gate の遷移ID を project.json から読む (3) task.json の jq フィルター化 (4) project.json への書き込み先の再検討 (5) 電卓での通し動作確認

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
| feature/ai-dev-base | #13（マージ済み） |
| feature/ai-dev-rules | #14（マージ済み） |
| feature/ai-dev-templates | #15（マージ済み） |
| feature/ai-dev-agents | #16（マージ済み） |
| feature/ai-dev-skills | #17（マージ済み） |
| feature/ai-dev-hooks | #18（マージ済み） |

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
| API-56 | スキル | feature/ai-dev-skills | スキル run-phase の作成 | 完了 |
| API-57 | スキル | feature/ai-dev-skills | スキル approval-gate の作成 | 完了 |
| API-58 | スキル | feature/ai-dev-skills | スキル jira-ops の作成 | 完了 |
| API-59 | スキル | feature/ai-dev-skills | スキル confluence-ops の作成 | 完了 |
| API-60 | スキル | feature/ai-dev-skills | スキル implement-with-tests の作成 | 完了 |
| API-61 | フック | feature/ai-dev-hooks | フック session-start の作成 | 完了 |
| API-62 | フック | feature/ai-dev-hooks | フック guard-bash の作成 | 完了 |
| API-63 | フック | feature/ai-dev-hooks | フック guard-gate の作成 | 完了 |
| API-64 | フック | feature/ai-dev-hooks | フック verify-write の作成 | 完了 |
| API-65 | フック | feature/ai-dev-hooks | settings.json の作成（権限・フック登録・モデル固定） | 完了 |

## テトリス開発（2026-10-28 追記）
- 要件定義書: Confluence ページID 720897（承認済み）
- Jira: API-66〜API-88（23件、ラベル: 工程名 + テトリス）。API-66 のみ完了、他は未着手
- 次の一手: API-67（未決事項の確認：一時停止・実機確認手順書の要否）→ 基本設計（API-68〜70）
- 工程の終わりごとにユーザー承認を得る（承認前に次工程へ着手しない）
- 要件変更（ユーザー指示）: 一時停止 F-17 と実機確認手順書 N-01 を追加。要件定義書は版2。Jira は API-89（手順書タスク）を追加し、関連9件に F-17 を反映（計24件）
- API-67 は「承認待ち」。次の一手: ユーザーが改訂版の要件定義書（版2）を承認 → API-67 を完了にして基本設計（API-68〜70）へ
- 注意: guard-bash.sh は、printf/echo の後ろの行に認証変数があると誤検知する。curl は先頭で関数にまとめ、echo の中では使わない
- 要件定義書の承認済み（版2）。API-67 完了
- 基本設計書: Confluence ページID 851969（版1）。API-68〜70 は「承認待ち」。次の一手: ユーザーの承認 → API-68〜70 を完了にして詳細設計（API-71〜74）へ
- 技術決定（ユーザー承認）: TypeScript + Vite + Vitest、描画は Canvas、有料ツールは事前承認
- 基本設計書は承認済み（版2、Node は 22 系の最新パッチ）。API-68〜70 完了
- 詳細設計書: Confluence ページID 917505（版1）。API-71〜74 は「承認待ち」。次の一手: ユーザーの承認 → API-71〜74 を完了にして実装（API-75〜83）へ。実装は feature/** を開発の統合ブランチから作り、PR 単位は【実装】雛形と CI／コアロジック／画面と入力
- 詳細設計の追加: ui/timer（stepTimer）を純関数として分離。レベルは保持せず levelOf(lines) で導く
- ユーザー指示: 画面の高さは 640px 以上を対象、スクロール禁止（640px 未満は案内を表示しゲームを進めない）。要件定義書 版3・基本設計書 版3・詳細設計書 版2 に反映。Jira API-74・82・89 の記述を更新
- 詳細設計書（ページID 917505）は版2を承認待ち（API-71〜74）
- 詳細設計書は承認済み（API-71〜74 完了）。実装に着手（API-75 進行中）
- ゲートのフックの不具合（JQL の status != "完了" が全件一致）を発見。ユーザー許可: 実装の着手（API-75〜83）に限り AI_DEV_SKIP_GATE=1 を使ってよい。修正は PR #20（API-90）
- PR #19【実装】雛形と CI（API-75、CI 成功）。マージ待ち。次の一手: マージ後に feature/tetris-core を開発の統合ブランチから作り、API-76〜80（コアロジック）を1タスク1コミットで実装
- ローカルの Node: スクラッチに v22.23.4 を展開（PATH の先頭に追加して使う）。TypeScript 7 / Vite 8 / Vitest 5
- PR #19（雛形と CI）・PR #20（ゲート修正、API-90 完了）はマージ済み。ゲートの修正が有効になったため、以降 AI_DEV_SKIP_GATE は不要
- API-76〜80（コアロジック）を feature/tetris-core に実装し、PR #21【実装】コアロジック を作成（マージ待ち）。API-75〜80 は「進行中」（実装工程の承認で完了にする）
- 次の一手: #21 のマージ後に feature/tetris-ui を開発の統合ブランチから作り、API-81〜83（結合・描画・入力）を実装 → PR【実装】画面と入力 → 実装工程の承認依頼
- 注意: guard-bash.sh は、同じコマンドに、強制オプションつきの削除と、リモートへの送信が並ぶと、強制送信と誤検知する。送信は単独のコマンドで実行する
- PR #21（コアロジック）はマージ済み。PR #22【実装】画面と入力（API-81〜83）を作成、CI 成功。実装工程の全タスク（API-75〜83）を「承認待ち」にした
- 実装のレビュー（reviewer）の結果: 重大なし。「下端のボタンが切れる」との指摘は、640〜900px の全261通りで再現せず（余白の数え違い）。提案: ゲームオーバー表示の文言が設計と少し違う（実装は「R キーまたはリスタート」）、Canvas が devicePixelRatio 未対応（実機のぼやけは N-01 で確認）
- 次の一手: ユーザーが #22 をマージし、実装工程を承認 → API-75〜83 を完了にして、単体テスト（API-84〜89）へ。単体テストは test-writer が担当（実装担当とは別）。単体テスト用ブランチは feature/** を開発の統合ブランチから作る
- 実装工程は承認済み（API-75〜83 完了、PR #22 までマージ済み）
- 単体テスト: PR #24（コア 128 件）、PR #23（画面まわり 79 件）。合計 207 件すべて成功、CI も成功。test-writer が作成し、独立に実行して確認
- 単体テスト報告書: Confluence ページID 753681。実機確認手順書: ページID 950281（結果は未記入。確認はユーザーが iPhone Safari と PC Chrome で実施し、表に直接記入）。基本設計書は版4（実機確認の対象を変更）
- API-84〜89 は「承認待ち」。次の一手: ユーザーが #23・#24 をマージし、単体テスト工程を承認 → API-84〜89 を完了にして、全工程完了
- 未実施: スマホ実機での確認（手順書で、ユーザーが実施）
- PR #23・#24 マージ済み。API-84〜89 は、まだ「承認待ち」（ユーザーの明示の承認が必要。ユーザーは完了済みと認識していたため、状態の差を報告済み）
- 残課題を Jira に起票（API-91〜106、16件、ラベル「課題」、工程ラベルは付けない＝ゲートの誤判定を避けるため）。優先度: High 2（API-91 実機確認、API-95 ゲームの堅牢化）、Medium 8、Low 4、Lowest 2
- 次の一手: ユーザーの承認 → API-84〜89 を完了。その後、API-91（実機確認はユーザー作業）、API-94（誤検知）、API-95 の順に着手
