import { FormEvent, useCallback, useEffect, useState } from "react";

import { inventoryApi } from "./services/inventoryApi";
import type { InventoryTransaction, ProductStock, TransactionType } from "./types/inventory";
import "./styles.css";

const today = new Date().toISOString().slice(0, 10);
const numberFormat = new Intl.NumberFormat("ja-JP");

export default function App() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    productId: "",
    transactionType: "inbound" as TransactionType,
    quantity: "",
    transactionDate: today,
    note: "",
  });

  const loadData = useCallback(async (query = search) => {
    try {
      setLoading(true);
      setError("");
      const [stockResult, historyResult] = await Promise.all([
        inventoryApi.getProducts(query),
        inventoryApi.getTransactions(),
      ]);
      setProducts(stockResult.products);
      setTransactions(historyResult.transactions);
      setForm((current) => ({
        ...current,
        productId: current.productId || String(stockResult.products[0]?.id ?? ""),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "データを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(search), 250);
    return () => window.clearTimeout(timer);
  }, [search, loadData]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await inventoryApi.createTransaction({
        productId: Number(form.productId),
        transactionType: form.transactionType,
        quantity: Number(form.quantity),
        transactionDate: form.transactionDate,
        note: form.note,
      });
      setSuccess(`${form.transactionType === "inbound" ? "入庫" : "出庫"}を登録しました。`);
      setForm((current) => ({ ...current, quantity: "", note: "" }));
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登録に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockUpdate(product: ProductStock) {
    setError("");
    setSuccess("");
    setUpdatingProductId(product.id);
    try {
      await inventoryApi.updateStock(product.id);
      setSuccess(`${product.name}の現在庫（${numberFormat.format(product.currentStock)}）を基準在庫として更新しました。`);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "在庫の更新に失敗しました。");
    } finally {
      setUpdatingProductId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">在</div>
        <div><h1>在庫管理</h1><p>入出庫と在庫状況を一元管理</p></div>
        <span className="environment">STAGING</span>
      </header>

      <main>
        {(error || success) && (
          <div className={`notice ${error ? "notice-error" : "notice-success"}`} role="alert">
            {error || success}
          </div>
        )}

        <section className="panel form-panel">
          <div className="section-heading"><div><span className="eyebrow">TRANSACTION</span><h2>入出庫登録</h2></div></div>
          <form onSubmit={handleSubmit}>
            <label className="field product-field">商品
              <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">商品を選択</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.sku}　{product.name}</option>)}
              </select>
            </label>
            <fieldset className="type-switch"><legend>区分</legend>
              {(["inbound", "outbound"] as const).map((type) => (
                <label key={type} className={form.transactionType === type ? `active ${type}` : ""}>
                  <input type="radio" name="type" value={type} checked={form.transactionType === type} onChange={() => setForm({ ...form, transactionType: type })} />
                  {type === "inbound" ? "入庫" : "出庫"}
                </label>
              ))}
            </fieldset>
            <label className="field">数量<input required min="1" step="1" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" /></label>
            <label className="field">日付<input required type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} /></label>
            <label className="field note-field">備考（任意）<input maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="発注番号、用途など" /></label>
            <button className={`submit-button ${form.transactionType}`} disabled={submitting} type="submit">{submitting ? "登録中…" : `${form.transactionType === "inbound" ? "入庫" : "出庫"}を登録`}</button>
          </form>
        </section>

        <section className="panel stock-panel">
          <div className="section-heading">
            <div><span className="eyebrow">INVENTORY</span><h2>在庫一覧</h2></div>
            <label className="search"><span>⌕</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="商品コード・商品名で検索" /></label>
          </div>
          <div className="table-wrap"><table>
            <thead><tr><th>商品コード</th><th>商品名</th><th>最終更新日</th><th className="numeric">基準在庫</th><th className="numeric inbound-text">入庫累計</th><th className="numeric outbound-text">出庫累計</th><th className="numeric current-heading">現在庫</th><th><span className="visually-hidden">操作</span></th></tr></thead>
            <tbody>
              {!loading && products.length === 0 && <tr><td className="empty" colSpan={8}>該当する商品はありません。</td></tr>}
              {products.map((product) => <tr key={product.id}>
                <td><span className="sku">{product.sku}</span></td><td className="product-name">{product.name}</td><td>{product.stockUpdatedAt.slice(0, 10)}</td>
                <td className="numeric">{numberFormat.format(product.baseStockQuantity)}</td><td className="numeric inbound-text">+{numberFormat.format(product.inboundTotal)}</td><td className="numeric outbound-text">−{numberFormat.format(product.outboundTotal)}</td>
                <td className="numeric"><strong className={product.currentStock <= 5 ? "stock-value low" : "stock-value"}>{numberFormat.format(product.currentStock)}</strong></td>
                <td className="stock-action"><button type="button" className="stock-update-button" disabled={updatingProductId !== null} onClick={() => void handleStockUpdate(product)}>{updatingProductId === product.id ? "更新中…" : "在庫更新"}</button></td>
              </tr>)}
            </tbody>
          </table></div>
          <p className="formula">現在庫 ＝ 基準在庫 ＋ 最終更新日より後の入庫 − 出庫</p>
        </section>

        <section className="panel history-panel">
          <div className="section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>最近の入出庫履歴</h2></div><span className="count">直近 {transactions.length} 件</span></div>
          <div className="table-wrap"><table>
            <thead><tr><th>日時</th><th>商品</th><th>区分</th><th className="numeric">数量</th><th>備考</th></tr></thead>
            <tbody>{transactions.map((transaction) => <tr key={transaction.id}>
              <td>{transaction.transactionDate}</td><td><span className="history-product">{transaction.productName}</span><small>{transaction.sku}</small></td>
              <td><span className={`badge ${transaction.transactionType}`}>{transaction.transactionType === "inbound" ? "入庫" : "出庫"}</span></td>
              <td className="numeric quantity">{numberFormat.format(transaction.quantity)}</td><td className="note">{transaction.note || "—"}</td>
            </tr>)}</tbody>
          </table></div>
        </section>
      </main>
      <footer>YAMADA STOCK　•　在庫は基準在庫と入出庫履歴から自動計算されます</footer>
    </div>
  );
}
