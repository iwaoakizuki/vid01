export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

interface TransactionInput {
  productId?: unknown;
  transactionType?: unknown;
  quantity?: unknown;
  transactionDate?: unknown;
  note?: unknown;
}

const stockSelect = `
  SELECT p.id, p.sku, p.name,
    p.base_stock_quantity AS baseStockQuantity,
    p.stock_updated_at AS stockUpdatedAt,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'inbound' THEN t.quantity ELSE 0 END), 0) AS inboundTotal,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'outbound' THEN t.quantity ELSE 0 END), 0) AS outboundTotal,
    p.base_stock_quantity
      + COALESCE(SUM(CASE WHEN t.transaction_type = 'inbound' THEN t.quantity ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN t.transaction_type = 'outbound' THEN t.quantity ELSE 0 END), 0) AS currentStock
  FROM products p
  LEFT JOIN inventory_transactions t
    ON t.product_id = p.id AND datetime(t.transaction_date) > datetime(p.stock_updated_at)`;

const historySelect = `
  SELECT t.id, t.product_id AS productId, p.sku, p.name AS productName,
    t.transaction_type AS transactionType, t.quantity,
    t.transaction_date AS transactionDate, t.note, t.created_at AS createdAt
  FROM inventory_transactions t
  JOIN products p ON p.id = t.product_id`;

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

async function listProducts(url: URL, env: Env): Promise<Response> {
  const search = url.searchParams.get("search")?.trim() ?? "";
  const query = `${stockSelect}
    WHERE (? = '' OR p.sku LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\')
    GROUP BY p.id ORDER BY p.sku`;
  const escaped = search.replace(/([%_\\])/g, "\\$1");
  const pattern = `%${escaped}%`;
  const { results } = await env.DB.prepare(query).bind(search, pattern, pattern).all();
  return Response.json({ products: results });
}

async function listTransactions(url: URL, env: Env): Promise<Response> {
  const requestedLimit = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20;
  const { results } = await env.DB.prepare(
    `${historySelect} ORDER BY datetime(t.transaction_date) DESC, t.id DESC LIMIT ?`,
  ).bind(limit).all();
  return Response.json({ transactions: results });
}

async function createTransaction(request: Request, env: Env): Promise<Response> {
  let input: TransactionInput;
  try {
    input = await request.json() as TransactionInput;
  } catch {
    return jsonError("入力内容を確認してください。", 400);
  }

  const productId = Number(input.productId);
  const quantity = Number(input.quantity);
  const type = input.transactionType;
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (!Number.isInteger(productId) || productId < 1) return jsonError("商品を選択してください。", 400);
  if (type !== "inbound" && type !== "outbound") return jsonError("入庫または出庫を選択してください。", 400);
  if (!Number.isInteger(quantity) || quantity < 1) return jsonError("数量は1以上の整数で入力してください。", 400);
  if (!isDate(input.transactionDate)) return jsonError("正しい日付を入力してください。", 400);
  if (note.length > 200) return jsonError("備考は200文字以内で入力してください。", 400);

  const product = await env.DB.prepare(
    `${stockSelect} WHERE p.id = ? GROUP BY p.id`,
  ).bind(productId).first<{ currentStock: number; stockUpdatedAt: string }>();
  if (!product) return jsonError("指定された商品が見つかりません。", 404);
  if (input.transactionDate <= product.stockUpdatedAt.slice(0, 10)) {
    return jsonError(`日付は最終在庫更新日（${product.stockUpdatedAt.slice(0, 10)}）より後を指定してください。`, 400);
  }
  if (type === "outbound" && quantity > Number(product.currentStock)) {
    return jsonError(`在庫不足です。現在庫 ${product.currentStock} に対して ${quantity} は出庫できません。`, 409);
  }

  const transactionDate = `${input.transactionDate} 12:00:00`;
  const result = await env.DB.prepare(`
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity, transaction_date, note)
    VALUES (?, ?, ?, ?, ?)
  `).bind(productId, type, quantity, transactionDate, note || null).run();
  const transaction = await env.DB.prepare(`${historySelect} WHERE t.id = ?`)
    .bind(result.meta.last_row_id).first();
  return Response.json({ transaction }, { status: 201 });
}

async function updateStockBaseline(productId: number, env: Env): Promise<Response> {
  if (!Number.isInteger(productId) || productId < 1) {
    return jsonError("正しい商品を指定してください。", 400);
  }

  const result = await env.DB.prepare(`
    UPDATE products
    SET base_stock_quantity = base_stock_quantity + COALESCE((
          SELECT SUM(CASE
            WHEN transaction_type = 'inbound' THEN quantity
            WHEN transaction_type = 'outbound' THEN -quantity
          END)
          FROM inventory_transactions
          WHERE product_id = products.id
            AND datetime(transaction_date) > datetime(products.stock_updated_at)
        ), 0),
        stock_updated_at = MAX(
          datetime('now'),
          COALESCE((
            SELECT MAX(datetime(transaction_date))
            FROM inventory_transactions
            WHERE product_id = products.id
              AND datetime(transaction_date) > datetime(products.stock_updated_at)
          ), datetime('now'))
        ),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(productId).run();

  if (result.meta.changes === 0) return jsonError("指定された商品が見つかりません。", 404);

  const product = await env.DB.prepare(`${stockSelect} WHERE p.id = ? GROUP BY p.id`)
    .bind(productId).first();
  return Response.json({ product });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return Response.json({ ok: true, system_id: "yamada-stock" });
      }
      if (url.pathname === "/api/products" && request.method === "GET") return listProducts(url, env);
      const stockUpdateMatch = url.pathname.match(/^\/api\/products\/(\d+)\/stock-update$/);
      if (stockUpdateMatch && request.method === "POST") {
        return updateStockBaseline(Number(stockUpdateMatch[1]), env);
      }
      if (url.pathname === "/api/transactions" && request.method === "GET") return listTransactions(url, env);
      if (url.pathname === "/api/transactions" && request.method === "POST") return createTransaction(request, env);
      if (url.pathname.startsWith("/api/")) return jsonError("APIが見つかりません。", 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Inventory API error", error);
      return jsonError("サーバーエラーが発生しました。", 500);
    }
  },
} satisfies ExportedHandler<Env>;
