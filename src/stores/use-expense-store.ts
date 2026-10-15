import { create } from "zustand";
import type { Expense } from "@/types";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuditLog } from "@/lib/audit-log";

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  initialized: boolean;
  loadExpenses: () => () => void;
  addExpense: (
    data: Omit<Expense, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateExpense: (
    id: string,
    data: Partial<Expense>,
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByDateRange: (start: string, end: string) => Expense[];
}

const expensesCollection = collection(db, "expenses");
const expensesQuery = query(
  expensesCollection,
  orderBy("expenseDate", "desc"),
);

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  loading: true,
  initialized: false,

  loadExpenses: () => {
    const unsub = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const expenses = snapshot.docs.map(
          (d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
            } as Expense;
          },
        );
        set({ expenses, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addExpense: async (data) => {
    const docRef = await addDoc(expensesCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "expense",
      entityId: docRef.id,
      description: `Menambah pengeluaran "${data.title}" (${data.expenseNumber})`,
    });

    return docRef.id;
  },

  updateExpense: async (id, data) => {
    await updateDoc(doc(expensesCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const title =
      data.title ??
      get().expenses.find((e) => e.id === id)?.title ??
      id;
    await createAuditLog({
      action: "update",
      entity: "expense",
      entityId: id,
      description: `Mengubah pengeluaran "${title}"`,
    });
  },

  deleteExpense: async (id) => {
    const expense = get().expenses.find((e) => e.id === id);
    await deleteDoc(doc(expensesCollection, id));

    await createAuditLog({
      action: "delete",
      entity: "expense",
      entityId: id,
      description: `Menghapus pengeluaran "${expense?.title || id}"`,
    });
  },

  getExpensesByDateRange: (start, end) => {
    // Build bounds in LOCAL time; date-only strings parse as UTC midnight
    // and would shift the range by the UTC offset.
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    endDate.setHours(23, 59, 59, 999);
    return get().expenses.filter((e) => {
      const d = new Date(`${e.expenseDate}T00:00:00`);
      return d >= startDate && d <= endDate;
    });
  },
}));
