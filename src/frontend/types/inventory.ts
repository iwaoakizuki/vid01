export type TransactionType = "inbound" | "outbound";

export interface ProductStock {
  id: number;
  sku: string;
  name: string;
  baseStockQuantity: number;
  stockUpdatedAt: string;
  inboundTotal: number;
  outboundTotal: number;
  currentStock: number;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  transactionType: TransactionType;
  quantity: number;
  transactionDate: string;
  note: string | null;
  createdAt: string;
}
