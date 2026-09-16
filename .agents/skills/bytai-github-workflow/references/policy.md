# Bytai GitHub Branch Policy

## 目的

Bytaiビルドでは、顧客の通常開発と本番反映をbranchで明確に分ける。

```text
Codex Web
  ↓
stagingブランチ
  ↓
CI/CD
  ↓
Cloudflare ステージング
  ↓
確認
  ↓
明示的な本番反映指示
  ↓
stagingブランチ → mainブランチ Pull Request
  ↓
mainブランチ
  ↓
CI/CD
  ↓
Cloudflare 本番
```

## branch

### stagingブランチ

- RepositoryのDefault branch
- 通常開発の基準
- 顧客の機能追加・修正・改善の反映先
- ステージング環境へのCD元

### mainブランチ

- 本番用
- 通常開発では直接変更しない
- `stagingブランチ` からの明示的な昇格によって更新する
- 本番環境へのCD元

## 明示的な本番指示の例

本番操作として扱ってよい例:

- 「本番へ反映して」
- 「PRODへ反映して」
- 「stagingブランチの内容をmainブランチへ反映して」
- 「確認したので本番公開して」

通常開発として扱う例:

- 「検索機能を追加して」
- 「このエラーを直して」
- 「画面を見やすくして」
- 「在庫一覧にCSV出力を追加して」

後者では `mainブランチ` を変更しない。

## DB変更

DB schema変更時:

- 必ず新しいmigrationを追加する
- 適用済みmigrationを書き換えない
- 本番反映前にmigration内容を確認する
- 復旧経路を確認する

## Secrets

以下をRepositoryへ保存しない。

- API key
- Cloudflare API Token
- password
- `.env` の実値
- その他Secret

## チェック

Repositoryに該当scriptがある場合、変更後に以下を実行する。

```bash
npm run typecheck
npm run build
```

testsが定義されている場合はtestsも実行する。

## 失敗時

- CI/check失敗時は本番へ進まない
- GitHub操作権限がない場合は停止して報告する
- 安全ルールを回避するために `mainブランチ` へ直接pushしない
