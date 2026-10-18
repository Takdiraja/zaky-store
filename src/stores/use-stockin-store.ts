import { create } from "zustand";
import type { StockInReceipt } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  pouchRemove,
  nowISO,
} from "@/lib/pouch-helpers";
import { createAuditLog } from "@/lib/audit-log";

interface StockInStore {
  receipts: StockInReceipt[];
  loading: boolean;
  initialized: boolean;
  loadReceipts: () => () => void;
  addReceipt: (
    data: Omit<StockInReceipt, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  deleteReceipt: (id: string) => Promise<void>;
}

const byReceiptDateDesc = (a: StockInReceipt, b: StockInReceipt) =>
  String(b.receiptDate ?? "").localeCompare(String(a.receiptDate ?? ""));

function toReceipt(doc: StockInReceipt): StockInReceipt {
  return {
    id: doc.id,
    receiptNumber: String(doc.receiptNumber ?? ""),
    receiptDate: String(doc.receiptDate ?? ""),
    supplier: (doc.supplier as string | null) ?? null,
    items: (doc.items as StockInReceipt["items"]) ?? [],
    totalAmount: Number(doc.totalAmount ?? 0),
    notes: String(doc.notes ?? ""),
    createdAt: String(doc.createdAt ?? ""),
    updatedAt: String(doc.updatedAt ?? ""),
  };
}

export const useStockInStore = create<StockInStore>((set, get) => ({
  receipts: [],
  loading: true,
  initialized: false,

  loadReceipts: () => {
    return subscribeCollection<StockInReceipt>(
      "stock_in_receipts",
      (receipts) =>
        set({
          receipts: receipts.map(toReceipt),
          loading: false,
          initialized: true,
        }),
      byReceiptDateDesc,
    );
  },

  addReceipt: async (data) => {
    const id = await pouchAdd("stock_in_receipts", {
      ...data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });
    createAuditLog({
      action: "create",
      entity: "stock_in_receipt",
      entityId: id,
      description: `Menambah nota barang masuk ${data.receiptNumber} (${data.items.length} item, total ${data.totalAmount})`,
    }).catch(() => {});
    return id;
  },

  deleteReceipt: async (id) => {
    const r = get().receipts.find((x) => x.id === id);
    await pouchRemove("stock_in_receipts", id);
    createAuditLog({
      action: "delete",
      entity: "stock_in_receipt",
      entityId: id,
      description: `Menghapus nota barang masuk ${r?.receiptNumber ?? id}`,
    }).catch(() => {});
  },
}));

/** Generate nomor nota: BM-YYYYMMDD-XXX */
export function generateStockInNumber(existing: StockInReceipt[]): string {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const prefix = `BM-${ymd}-`;
  const maxSeq = existing
    .filter((r) => r.receiptNumber.startsWith(prefix))
    .map((r) => parseInt(r.receiptNumber.slice(prefix.length), 10) || 0)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}
