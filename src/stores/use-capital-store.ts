import { create } from "zustand";
import type { CapitalTransaction, CapitalType, CapitalCategory } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  pouchUpdate,
  pouchRemove,
  nowISO,
} from "@/lib/pouch-helpers";
import { createAuditLog } from "@/lib/audit-log";

const CAPITAL_TYPE_LABELS: Record<CapitalType, string> = {
  initial: "Modal Awal",
  addition: "Penambahan Modal",
  withdrawal: "Penarikan Modal",
  stock_purchase: "Belanja Stok",
};

export const CAPITAL_CATEGORY_LABELS: Record<CapitalCategory, string> = {
  warung: "Warung Capital",
  digital_service: "Digital Services Capital",
};

/** Default category for legacy records that predate categories. */
export const DEFAULT_CAPITAL_CATEGORY: CapitalCategory = "warung";

/** Normalizes a possibly-missing/legacy category to a valid one. */
export function normalizeCapitalCategory(
  category: CapitalCategory | string | null | undefined,
): CapitalCategory {
  return category === "digital_service" ? "digital_service" : "warung";
}

interface CapitalStore {
  capitalTransactions: CapitalTransaction[];
  loading: boolean;
  initialized: boolean;
  loadCapitalTransactions: () => () => void;
  addCapitalTransaction: (
    data: Omit<CapitalTransaction, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateCapitalTransaction: (
    id: string,
    data: Partial<CapitalTransaction>,
  ) => Promise<void>;
  deleteCapitalTransaction: (id: string) => Promise<void>;
  /** Current capital for a category (default: all categories combined). */
  getCurrentCapital: (category?: CapitalCategory) => number;
  hasInitialCapital: (category?: CapitalCategory) => boolean;
  /** Lifecycle sums (initial/addition/withdrawal/stock_purchase/current) for a category. */
  getCapitalBreakdown: (category?: CapitalCategory) => {
    initial: number;
    addition: number;
    withdrawal: number;
    stockPurchase: number;
    current: number;
  };
}

const byTxnDateDesc = (a: CapitalTransaction, b: CapitalTransaction) =>
  String(b.transactionDate ?? "").localeCompare(String(a.transactionDate ?? ""));

export const useCapitalStore = create<CapitalStore>((set, get) => ({
  capitalTransactions: [],
  loading: true,
  initialized: false,

  loadCapitalTransactions: () => {
    return subscribeCollection<CapitalTransaction>(
      "capital_transactions",
      (capitalTransactions) =>
        set({
          capitalTransactions: capitalTransactions.map((t) => ({
            ...t,
            category: normalizeCapitalCategory(t.category),
          })),
          loading: false,
          initialized: true,
        }),
      byTxnDateDesc,
    );
  },

  addCapitalTransaction: async (data) => {
    const id = await pouchAdd("capital_transactions", {
      ...data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    await createAuditLog({
      action: "create",
      entity: "capital",
      entityId: id,
      description: `Mencatat ${CAPITAL_TYPE_LABELS[data.type].toLowerCase()} "${data.capitalNumber}" sebesar ${data.amount}`,
    });

    return id;
  },

  updateCapitalTransaction: async (id, data) => {
    await pouchUpdate("capital_transactions", id, {
      ...data,
      updatedAt: nowISO(),
    });

    const type =
      data.type ??
      get().capitalTransactions.find((c) => c.id === id)?.type;
    await createAuditLog({
      action: "update",
      entity: "capital",
      entityId: id,
      description: `Mengubah transaksi modal ${type ? CAPITAL_TYPE_LABELS[type].toLowerCase() : id}`,
    });
  },

  deleteCapitalTransaction: async (id) => {
    const capital = get().capitalTransactions.find((c) => c.id === id);
    await pouchRemove("capital_transactions", id);

    await createAuditLog({
      action: "delete",
      entity: "capital",
      entityId: id,
      description: `Menghapus transaksi modal "${capital?.capitalNumber || id}"`,
    });
  },

  getCurrentCapital: (category) => {
    const list = get().capitalTransactions;
    const filtered = category
      ? list.filter((t) => normalizeCapitalCategory(t.category) === category)
      : list;
    return filtered.reduce((sum, t) => {
      if (t.type === "withdrawal" || t.type === "stock_purchase") return sum - t.amount;
      return sum + t.amount;
    }, 0);
  },

  hasInitialCapital: (category) => {
    const list = get().capitalTransactions;
    const filtered = category
      ? list.filter((t) => normalizeCapitalCategory(t.category) === category)
      : list;
    return filtered.some((t) => t.type === "initial");
  },

  getCapitalBreakdown: (category) => {
    const list = get().capitalTransactions;
    const filtered = category
      ? list.filter((t) => normalizeCapitalCategory(t.category) === category)
      : list;
    const initial = filtered
      .filter((t) => t.type === "initial")
      .reduce((s, t) => s + t.amount, 0);
    const addition = filtered
      .filter((t) => t.type === "addition")
      .reduce((s, t) => s + t.amount, 0);
    const withdrawal = filtered
      .filter((t) => t.type === "withdrawal")
      .reduce((s, t) => s + t.amount, 0);
    const stockPurchase = filtered
      .filter((t) => t.type === "stock_purchase")
      .reduce((s, t) => s + t.amount, 0);
    return {
      initial,
      addition,
      withdrawal,
      stockPurchase,
      current: initial + addition - withdrawal - stockPurchase,
    };
  },
}));

export { CAPITAL_TYPE_LABELS };
