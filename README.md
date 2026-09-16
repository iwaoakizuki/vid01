# 在庫管理システム

Cloudflare Workers、D1、Reactで構成した、小規模事業者向けの在庫管理アプリケーションです。

現在庫はDBに直接保存せず、商品の基準在庫に、基準日より後の入庫を加算し、出庫を減算して算出します。

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

初回はローカルD1へmigrationを適用してください。

```bash
npx wrangler d1 migrations apply DB --local --env dev
npm run build
npm run worker:dev
```

ローカルURL: `http://localhost:8787`

## API

- `GET /api/products?search=`: 商品・計算済み在庫一覧
- `GET /api/transactions?limit=20`: 最近の入出庫履歴
- `POST /api/transactions`: 入出庫登録
- `POST /api/products/:id/stock-update`: 計算済みの現在庫を新しい基準在庫として保存
- `GET /api/health`: ヘルスチェック

入出庫登録のJSONは `productId`、`transactionType` (`inbound` / `outbound`)、`quantity`、`transactionDate` (`YYYY-MM-DD`)、任意の `note` を受け取ります。出庫数が計算上の現在庫を超える場合は `409` を返します。

在庫更新後は、更新時点の現在庫を基準に、それ以降の入出庫から現在庫を計算します。

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
