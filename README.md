# 在庫管理システム

Bytai standard application repository.

## Start

```bash
npm install
npm run dev
```

## Type check

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

## Worker DEV

```bash
npm run worker:dev
```

## Deploy

DEV:

```bash
npm run deploy:dev
```

PROD is a separate manual promotion step. Run it only after DEV verification and explicit production approval:

```bash
npm run deploy:prod
```

A normal Git push is not production approval.

Project identity:

- `bytai.project.json`
- `PROJECT.md`

AI rules:

- `AGENTS.md`
- `CLAUDE.md`
