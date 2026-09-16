import type { InventoryTransaction, ProductStock, TransactionType } from "../types/inventory";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "処理に失敗しました。");
  }

  return body;
}

export const inventoryApi = {
  getProducts: (search = "") => request<{ products: ProductStock[] }>(
    `/api/products?search=${encodeURIComponent(search)}`,
  ),
  getTransactions: () => request<{ transactions: InventoryTransaction[] }>(
    "/api/transactions?limit=20",
  ),
  updateStock: (productId: number) => request<{ product: ProductStock }>(
    `/api/products/${productId}/stock-update`,
    { method: "POST" },
  ),
  createTransaction: (data: {
    productId: number;
    transactionType: TransactionType;
    quantity: number;
    transactionDate: string;
    note: string;
  }) => request<{ transaction: InventoryTransaction }>("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
};
