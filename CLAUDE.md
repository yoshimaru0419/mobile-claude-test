# CLAUDE.md

## Gitルール

### 長期ブランチ
- `develop`: 開発の統合ブランチ。作業ブランチの派生元
- `staging`: 検証用ブランチ

### 作業ブランチの命名と派生元
| 種別 | ブランチ名 | 派生元 |
| --- | --- | --- |
| 機能追加 | `feature/**` | `develop` |
| ドキュメント作成 | `doc/**` | `develop` |

- 作業ブランチは必ず `develop` から作成する
- 作成例: `git checkout -b feature/login origin/develop`
