---
name: bytai-github-workflow
description: BytaiビルドのGitHub運用を実行するための標準ワークフロー。通常の開発、修正、Git操作、branch選択、commit、push、PR、本番反映を扱うときに使う。通常開発はstagingブランチ、本番はmainブランチとし、明示的な本番指示なしにmainブランチへ変更しない。
---

# Bytai GitHub Workflow

このSkillは、BytaiビルドのRepositoryでGit/GitHub操作を安全かつ一貫して行うために使う。

## 最初に確認するもの

作業開始時に、Repository内の次のファイルを確認する。

1. `AGENTS.md`
2. `bytai.project.json`
3. `PROJECT.md`
4. 必要に応じて既存コード、`migrations/`、`docs/`

Repository固有ルールがこのSkillより厳しい場合は、Repository固有ルールを優先する。

詳細なbranch policyと完了チェックは `references/policy.md` を必要なときだけ読む。

## branchの基本

- `stagingブランチ` = 通常開発・確認用
- `mainブランチ` = 本番用
- 通常の開発・修正は `stagingブランチ` を基準に行う。
- `mainブランチ` へ通常開発を直接pushしない。
- ユーザーから明示的な本番反映指示がない限り、`mainブランチ` を変更しない。

Codexの実行環境がタスクごとの一時branchを自動作成する場合は、`stagingブランチ` から分岐し、変更の取り込み先も `stagingブランチ` にする。

## 通常開発

ユーザーが機能追加、修正、改善を依頼した場合:

1. 現在の基準branchが `stagingブランチ` であることを確認する。
2. Repositoryを確認し、既存構造を尊重して変更する。
3. DB schemaを変更する場合は `migrations/` に新しいmigrationを追加する。
4. 利用可能ならテスト、typecheck、buildを実行する。
5. 失敗があれば修正する。未解決の失敗を隠して完了扱いにしない。
6. 変更をcommitしたら、直ちに対応するリモートブランチへpushする。commitとpushは通常一体の操作として扱い、ローカルcommitだけを残して完了扱いにしない。
7. 通常開発では `mainブランチ` に進まない。
8. 完了時に、変更内容と確認結果を簡潔に報告する。

## commitとpush

- Bytaiでは、通常の開発操作においてcommitとpushを分けて扱わない。
- commitしたら、直ちに対応するリモートブランチへpushする。
- ローカルcommitだけを残して「完了」としない。
- 通常開発では、`stagingブランチ` 系統へのcommit + pushまでを一連の保存操作として扱う。

## 本番反映

ユーザーが「本番へ反映」「PRODへ反映」「mainブランチへ昇格」など、明示的に本番反映を指示した場合のみ実行する。

1. `stagingブランチ` の状態とCI結果を確認する。
2. 未解決のtypecheck/build/test失敗がある場合は本番へ進めない。
3. DB migrationがある場合は内容と復旧経路を確認する。
4. `stagingブランチ` から `mainブランチ` へのPull Requestを作成する。
5. Repositoryの運用ルールで許可され、ユーザーの本番反映指示が明確な場合のみmergeする。
6. `mainブランチ` への直接pushで本番反映を代替しない。
7. CI/CD結果を確認できる場合は確認する。
8. 完了時に、本番反映の結果を簡潔に報告する。

## 禁止事項

- 明示指示なしに `mainブランチ` を変更しない。
- 通常開発を `mainブランチ` へ直接pushしない。
- 適用済みmigrationを書き換えない。
- Secret、API key、`.env` の実値をRepositoryへcommitしない。
- CI失敗を無視して本番へ進めない。
- Git/GitHub操作に失敗したとき、危険な代替操作で無理に続行しない。

## GitHub操作ができない場合

現在のCodex環境または権限で必要なGitHub操作を完了できない場合:

1. そこで停止する。
2. 何が完了し、何が未完了かを明確にする。
3. ユーザーに必要な最小限の操作だけを伝える。
4. `mainブランチ` への直接pushなど、安全ルールを弱める代替策は使わない。

## 完了条件

通常開発では、少なくとも次を満たして完了とする。

- 変更が意図したRepositoryにある
- 通常開発は `stagingブランチ` 系統にある
- 必要なmigrationが追加されている
- 実行可能なチェックが通っている、または未解決事項が明示されている
- `mainブランチ` は明示的な本番指示なしに変更されていない
