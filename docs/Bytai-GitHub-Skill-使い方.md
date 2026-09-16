# Bytai GitHub Skill 使い方

## 1. 何のためのSkillか

`bytai-github-workflow` は、Bytaiビルド利用者がGitやGitHubの細かな操作を覚えなくても、Codexへ自然言語で開発を依頼できるようにするためのSkillです。

顧客は基本的に、

> 顧客一覧に検索機能を追加して

> 保存時のエラーを直して

のように、やりたい業務変更だけをCodexへ伝えます。

GitHub上ではSkillが、通常開発を `stagingブランチ` に寄せ、本番用の `mainブランチ` を不用意に変更しないための手順をCodexへ与えます。Bytaiではcommitとpushを通常一体の操作として扱い、commitしたらそのまま対応するリモートブランチへpushします。

---

## 2. 置き場所

Repositoryルートから次の場所に置きます。

```text
/
├─ .agents/
│  └─ skills/
│     └─ bytai-github-workflow/
│        ├─ SKILL.md
│        └─ references/
│           └─ policy.md
│
├─ docs/
│  └─ Bytai-GitHub-Skill-使い方.md
│
├─ AGENTS.md
├─ bytai.project.json
└─ ...
```

CodexのRepository Skillの標準配置は `.agents/skills/<skill-name>/SKILL.md` です。

このSkillは顧客ごとのRepositoryへcommitしてGitHubへpushします。

---

## 3. AGENTS.mdとの役割分担

### AGENTS.md

Repositoryで常に守る基本ルール。

例:

- system_idを変更しない
- D1 schema変更はmigrationに残す
- PRODを勝手に変更しない
- GitHubを正本にする

### Skill

特定の作業をするときの詳細な手順。

`bytai-github-workflow` は、

- stagingブランチでの通常開発
- commit + push
- Pull Request
- mainブランチへの本番昇格

を担当します。

---

## 4. AGENTS.mdに追加する推奨文

Skillの自動検出に依存しすぎないため、`AGENTS.md` に次を追加しておくことを推奨します。

```markdown
## Bytai skills

- Git/GitHub操作、通常開発のbranch選択、commit、push、Pull Request、本番昇格を行う場合は、`.agents/skills/bytai-github-workflow/SKILL.md` を使用する。
```

これによりCodexがRepository Skillを自動選択しない場合でも、RepositoryルールからSkillへ誘導できます。

---

## 5. 顧客の通常の使い方

通常はSkill名を意識する必要はありません。

### 例1

```text
顧客一覧に会社名検索を追加して
```

期待する流れ:

```text
Codex
↓
stagingブランチ系統で作業
↓
コード変更
↓
typecheck / build
↓
commit + push
↓
CI/CD
↓
Cloudflare ステージング
```

### 例2

```text
この保存エラーを直して
```

これも通常開発なので `mainブランチ` は変更しません。

---

## 6. Skillを明示的に使わせたい場合

必要な場合はCodexへ、

```text
bytai-github-workflow Skillを使って、この変更を行って
```

と指示します。

Codexの画面でSkillの明示呼び出しに対応している場合は、Skill名から呼び出しても構いません。

通常はSkillのdescriptionと `AGENTS.md` によって自動的に適用される運用を目指します。

---

## 7. 本番へ反映するとき

顧客またはBytai担当者が確認した後、

```text
本番へ反映して
```

と明示します。

期待する流れ:

```text
stagingブランチ
↓
check確認
↓
stagingブランチ → mainブランチ Pull Request
↓
merge
↓
mainブランチ
↓
CI/CD
↓
Cloudflare 本番
```

「検索機能を追加して」などの通常指示だけでは、本番反映を行いません。

---

## 8. Skillを後から拡張する

今後、同じSkillにGitHub関連の手順を追加できます。

例:

```text
.agents/skills/bytai-github-workflow/
├─ SKILL.md
├─ references/
│  ├─ policy.md
│  ├─ pull-request.md
│  ├─ rollback.md
│  └─ troubleshooting.md
├─ scripts/
│  └─ 必要になった補助スクリプト
└─ assets/
   └─ 必要になったテンプレート
```

`SKILL.md` を巨大化させすぎず、詳細情報は `references/` に分けます。

---

## 9. 将来Skillを分割する基準

GitHub運用と別の専門領域になったら、同じSkillへ詰め込まず別Skillにします。

将来候補:

```text
bytai-github-workflow
bytai-db-migration
bytai-checkpoint
bytai-cloudflare-deploy
bytai-spec-update
```

つまり、

- GitHub操作 → GitHub Skill
- DB変更 → DB Skill
- 復旧 → Checkpoint Skill
- Cloudflare → Deploy Skill

のように役割を分けます。

---

## 10. Skillを更新するとき

Skill自体もRepositoryのコードと同様にGit管理します。

通常の更新は `stagingブランチ` で行います。

```text
Skill修正
↓
stagingブランチ
↓
確認
↓
必要なタイミングでmainブランチへ昇格
```

Bytai全顧客共通の改善ができた場合は、将来的に `bytai-init` 側のテンプレートへ反映し、新規顧客Repositoryへ最初から生成する方式にできます。

---

## 11. 顧客が覚えること

顧客にはGit用語を多く覚えてもらう必要はありません。

基本的には次の2種類の指示だけで運用します。

### 通常開発

```text
○○機能を追加して
○○を直して
○○を変更して
```

→ `stagingブランチ`

### 本番

```text
確認したので本番へ反映して
```

→ `stagingブランチ` から `mainブランチ` へ昇格

これをBytaiビルドの標準利用体験とします。
