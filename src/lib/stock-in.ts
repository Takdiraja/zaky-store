import type { StockInItem, StockInReceipt } from "@/types";
import { useProductStore } from "@/stores/use-product-store";
import { useStockInStore, generateStockInNumber } from "@/stores/use-stockin-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { generateCapitalNumber } from "@/lib/capital-counter";

export interface StockInDraftItem {
  productId: string;
  productName: string;
  unitId: string | null;
  unitName: string;
  contains: number;
  qty: number;
  buyPricePerUnit: number;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Simpan nota barang masuk:
 * 1. Simpan nota ke stock_in_receipts
 * 2. Tambah stok tiap produk (qty × contains) + update harga beli per pcs
 *    (rata-rata tertimbang dengan stok lama)
 * 3. Catat SEKALI sebagai modal tipe "Belanja Stok"
 */
export async function saveStockInReceipt(
  items: StockInDraftItem[],
  supplier: string | null,
  notes: string,
): Promise<string> {
  const productStore = useProductStore.getState();
  const stockInStore = useStockInStore.getState();
  const capitalStore = useCapitalStore.getState();

  const receiptItems: StockInItem[] = items.map((it) => ({
    id: `si-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: it.productId,
    productName: it.productName,
    unitId: it.unitId,
    unitName: it.unitName,
    qty: it.qty,
    contains: it.contains,
    buyPricePerUnit: it.buyPricePerUnit,
    subtotal: it.qty * it.buyPricePerUnit,
    stockAdded: it.qty * it.contains,
  }));

  const totalAmount = receiptItems.reduce((s, it) => s + it.subtotal, 0);
  const receiptNumber = generateStockInNumber(stockInStore.receipts);
  const receiptDate = todayISO();

  // 1. Simpan nota
  const receiptId = await stockInStore.addReceipt({
    receiptNumber,
    receiptDate,
    supplier,
    items: receiptItems,
    totalAmount,
    notes,
  });

  // 2. Update stok + harga beli per produk
  for (const it of receiptItems) {
    const p = productStore.getProductById(it.productId);
    if (!p) continue;
    const newStock = p.stock + it.stockAdded;
    // Rata-rata tertimbang harga beli per pcs
    const oldValue = p.stock * p.buyPrice;
    const addedValue = it.stockAdded * (it.buyPricePerUnit / it.contains);
    const newBuyPrice = newStock > 0 ? Math.round((oldValue + addedValue) / newStock) : p.buyPrice;
    await productStore.updateProduct(p.id, {
      stock: newStock,
      buyPrice: newBuyPrice,
    });
  }

  // 3. Catat modal sekali
  const capNum = await generateCapitalNumber();
  await capitalStore.addCapitalTransaction({
    capitalNumber: capNum,
    transactionDate: receiptDate,
    type: "stock_purchase",
    category: "warung",
    amount: totalAmount,
    description: `Belanja stok ${receiptNumber} (${receiptItems.length} item${supplier ? `, ${supplier}` : ""})`,
  });

  return receiptId;
}

/** Ringkasan nota untuk preview sebelum simpan. */
export function summarizeStockIn(items: StockInDraftItem[]): {
  totalAmount: number;
  totalStockAdded: number;
  itemCount: number;
} {
  return {
    totalAmount: items.reduce((s, it) => s + it.qty * it.buyPricePerUnit, 0),
    totalStockAdded: items.reduce((s, it) => s + it.qty * it.contains, 0),
    itemCount: items.length,
  };
}
