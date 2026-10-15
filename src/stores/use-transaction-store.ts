import { create } from "zustand";
import type { Transaction, DailyReport, TransactionStatus, CartItem, PaymentMethod } from "@/types";
import { getTodayISO } from "@/lib/formatters";
import { toDateKey } from "@/lib/period-metrics";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuditLog } from "@/lib/audit-log";
import { useProductStore } from "@/stores/use-product-store";
import { useCustomerStore } from "@/stores/use-customer-store";

interface EditTransactionChanges {
  items: CartItem[];
  totalAmount: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  customerId: string | null;
  status: TransactionStatus;
  notes?: string | null;
}

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  initialized: boolean;
  loadTransactions: () => () => void;
  addTransaction: (
    t: Omit<Transaction, "id" | "createdAt">,
  ) => Promise<string>;
  getTodayTransactions: () => Transaction[];
  getTransactionsByDateRange: (
    start: string,
    end: string,
  ) => Transaction[];
  getTransactionsByCustomer: (customerId: string) => Transaction[];
  getDebtTransactions: () => Transaction[];
  updateTransactionStatus: (
    id: string,
    status: TransactionStatus,
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    changes: EditTransactionChanges,
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<void>;
  getDailyReport: (date: string) => DailyReport;
  getTopProducts: (
    start: string,
    end: string,
    limit?: number,
  ) => { name: string; qty: number; revenue: number }[];
}

const transactionsCollection = collection(db, "transactions");
const transactionsQuery = query(
  transactionsCollection,
  orderBy("createdAt", "desc"),
);

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: true,
  initialized: false,

  loadTransactions: () => {
    const unsub = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactions = snapshot.docs.map(
          (d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
            } as Transaction;
          },
        );
        set({ transactions, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addTransaction: async (data) => {
    const docRef = await addDoc(transactionsCollection, {
      ...data,
      createdAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "transaction",
      entityId: docRef.id,
      description: `Transaksi ${data.paymentMethod} sebesar ${data.totalAmount}`,
    });

    return docRef.id;
  },

  getTodayTransactions: () => {
    const today = getTodayISO();
    return get().transactions.filter((t) => toDateKey(t.date) === today);
  },

  getTransactionsByDateRange: (start, end) => {
    // Construct both bounds in LOCAL time (date-only strings parse as UTC
    // midnight, which shifts the range by the UTC offset and misassigns
    // days — e.g. "Hari Ini" would exclude most of the day in UTC+7).
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    endDate.setHours(23, 59, 59, 999);
    return get().transactions.filter((t) => {
      const d = new Date(`${toDateKey(t.date)}T00:00:00`);
      return d >= startDate && d <= endDate;
    });
  },

  getTransactionsByCustomer: (customerId) =>
    get().transactions.filter((t) => t.customerId === customerId),

  getDebtTransactions: () =>
    get().transactions.filter(
      (t) => t.paymentMethod === "kasbon" && t.status === "debt",
    ),

  updateTransactionStatus: async (id, status) => {
    const txn = get().transactions.find((t) => t.id === id);
    const ref = doc(transactionsCollection, id);

    // QRIS stock reconciliation: stock is held until payment is confirmed.
    //   debt → paid : deduct stock
    //   paid → debt : restore stock
    if (txn?.paymentMethod === "qris" && txn.status !== status) {
      const productStore = useProductStore.getState();
      if (status === "paid") {
        const applied: { productId: string; qty: number }[] = [];
        for (const item of txn.items) {
          const ok = await productStore.reduceStock(item.productId, item.quantity);
          if (!ok) {
            // Roll back applied reductions.
            for (const r of applied) {
              await productStore.quickAddStock(r.productId, r.qty);
            }
            throw new Error("Stok tidak mencukupi");
          }
          applied.push({ productId: item.productId, qty: item.quantity });
        }
      } else {
        for (const item of txn.items) {
          await productStore.quickAddStock(item.productId, item.quantity);
        }
      }
    }

    await updateDoc(ref, { status });

    await createAuditLog({
      action: "update",
      entity: "transaction",
      entityId: id,
      description: `Transaksi ${id} ditandai ${status === "paid" ? "lunas" : "hutang"}`,
    });
  },

  updateTransaction: async (id, changes) => {
    const oldTxn = get().transactions.find((t) => t.id === id);
    if (!oldTxn) {
      return { ok: false, error: "Transaksi tidak ditemukan" };
    }

    const productStore = useProductStore.getState();
    const customerStore = useCustomerStore.getState();

    // 1. Stock reconciliation — net delta per product, applied once.
    //    positive delta = deduct stock; negative delta = add back.
    const oldQtyMap = new Map<string, number>();
    oldTxn.items.forEach((i) => {
      oldQtyMap.set(i.productId, (oldQtyMap.get(i.productId) ?? 0) + i.quantity);
    });
    const newQtyMap = new Map<string, number>();
    changes.items.forEach((i) => {
      newQtyMap.set(i.productId, (newQtyMap.get(i.productId) ?? 0) + i.quantity);
    });

    const allProductIds = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);
    const appliedReductions: { productId: string; qty: number }[] = [];

    for (const productId of allProductIds) {
      const delta = (newQtyMap.get(productId) ?? 0) - (oldQtyMap.get(productId) ?? 0);
      if (delta === 0) continue;
      if (delta > 0) {
        const ok = await productStore.reduceStock(productId, delta);
        if (!ok) {
          // Roll back applied reductions.
          for (const r of appliedReductions) {
            await productStore.quickAddStock(r.productId, r.qty);
          }
          return { ok: false, error: "Stok tidak mencukupi" };
        }
        appliedReductions.push({ productId, qty: delta });
      } else {
        await productStore.quickAddStock(productId, -delta);
      }
    }

    // 2. Debt reconciliation — net change to customer currentDebt.
    const wasKasbon = oldTxn.paymentMethod === "kasbon";
    const isKasbon = changes.paymentMethod === "kasbon";
    const oldCustomerId = oldTxn.customerId;
    const newCustomerId = changes.customerId;
    const oldAmount = oldTxn.totalAmount;
    const newAmount = changes.totalAmount;

    const debtOps: { customerId: string; delta: number }[] = [];
    if (wasKasbon && oldCustomerId) {
      if (oldCustomerId === newCustomerId) {
        if (isKasbon) {
          debtOps.push({ customerId: oldCustomerId, delta: newAmount - oldAmount });
        } else {
          debtOps.push({ customerId: oldCustomerId, delta: -oldAmount });
        }
      } else {
        // Old kasbon, different customer: remove from old, add to new if kasbon.
        debtOps.push({ customerId: oldCustomerId, delta: -oldAmount });
        if (isKasbon && newCustomerId) {
          debtOps.push({ customerId: newCustomerId, delta: newAmount });
        }
      }
    } else if (!wasKasbon && isKasbon && newCustomerId) {
      debtOps.push({ customerId: newCustomerId, delta: newAmount });
    }

    for (const op of debtOps) {
      await customerStore.updateDebt(op.customerId, op.delta);
    }

    // 3. Write transaction (non-editable fields untouched).
    const cleanChanges: Partial<Transaction> = {
      items: changes.items,
      totalAmount: changes.totalAmount,
      totalProfit: changes.totalProfit,
      paymentMethod: changes.paymentMethod,
      customerId: changes.customerId,
      status: changes.status,
    };
    if (changes.notes !== undefined) {
      cleanChanges.notes = changes.notes;
    }
    await updateDoc(doc(transactionsCollection, id), {
      ...cleanChanges,
      updatedAt: serverTimestamp(),
    });

    // 4. Audit log with edited fields + previous/new values.
    await createAuditLog({
      action: "update",
      entity: "transaction",
      entityId: id,
      description: `Transaksi ${oldTxn.receiptNumber || id} diedit`,
      details: {
        receiptNumber: oldTxn.receiptNumber || null,
        editedFields: [
          "items",
          "totalAmount",
          "totalProfit",
          "paymentMethod",
          "customerId",
          ...(changes.notes !== undefined ? ["notes"] : []),
        ],
        previous: {
          items: oldTxn.items,
          totalAmount: oldTxn.totalAmount,
          totalProfit: oldTxn.totalProfit,
          paymentMethod: oldTxn.paymentMethod,
          customerId: oldTxn.customerId,
        },
        new: {
          items: changes.items,
          totalAmount: changes.totalAmount,
          totalProfit: changes.totalProfit,
          paymentMethod: changes.paymentMethod,
          customerId: changes.customerId,
        },
      },
    });

    return { ok: true };
  },

  deleteTransaction: async (id) => {
    const txn = get().transactions.find((t) => t.id === id);
    if (!txn) throw new Error("Transaksi tidak ditemukan");

    const productStore = useProductStore.getState();
    const customerStore = useCustomerStore.getState();

    // 1. Restore stock (unless the QRIS payment was never confirmed — in
    //    that case stock was never deducted).
    const stockDeducted = !(txn.paymentMethod === "qris" && txn.status === "debt");
    if (stockDeducted) {
      for (const item of txn.items) {
        await productStore.quickAddStock(item.productId, item.quantity);
      }
    }

    // 2. Debt reconciliation — kasbon transactions reduce the customer's debt.
    if (txn.paymentMethod === "kasbon" && txn.customerId) {
      await customerStore.updateDebt(txn.customerId, -txn.totalAmount);
    }

    // 3. Delete the transaction document.
    await deleteDoc(doc(transactionsCollection, id));

    // 4. Audit log.
    await createAuditLog({
      action: "delete",
      entity: "transaction",
      entityId: id,
      description: `Menghapus transaksi ${txn.receiptNumber || id} sebesar ${txn.totalAmount} (${txn.paymentMethod})`,
      details: {
        receiptNumber: txn.receiptNumber || null,
        totalAmount: txn.totalAmount,
        paymentMethod: txn.paymentMethod,
        status: txn.status,
        customerId: txn.customerId,
      },
    });
  },

  getDailyReport: (date) => {
    const dayTx = get().transactions.filter(
      (t) =>
        toDateKey(t.date) === date &&
        // Unpaid QRIS is not yet revenue — exclude from sales totals.
        !(t.paymentMethod === "qris" && t.status === "debt"),
    );
    return {
      date,
      totalSales: dayTx.reduce((sum, t) => sum + t.totalAmount, 0),
      totalProfit: dayTx.reduce((sum, t) => sum + t.totalProfit, 0),
      totalCash: dayTx
        .filter((t) => t.paymentMethod === "cash")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      totalKasbon: dayTx
        .filter((t) => t.paymentMethod === "kasbon")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      transactionCount: dayTx.length,
    };
  },

  getTopProducts: (start, end, limit = 5) => {
    const txns = get()
      .getTransactionsByDateRange(start, end)
      .filter((t) => !(t.paymentMethod === "qris" && t.status === "debt"));
    const productMap = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();
    txns.forEach((t) => {
      t.items.forEach((item) => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productMap.set(item.productId, {
            name: item.name,
            qty: item.quantity,
            revenue: item.subtotal,
          });
        }
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },
}));
