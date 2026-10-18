import { create } from "zustand";
import type { Expense } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  pouchUpdate,
  pouchRemove,
  nowISO,
} from "@/lib/pouch-helpers";
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

const byExpenseDateDesc = (a: Expense, b: Expense) =>
  String(b.expenseDate ?? "").localeCompare(String(a.expenseDate ?? ""));

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  loading: true,
  initialized: false,

  loadExpenses: () => {
    return subscribeCollection<Expense>(
      "expenses",
      (expenses) => set({ expenses, loading: false, initialized: true }),
      byExpenseDateDesc,
    );
  },

  addExpense: async (data) => {
    const id = await pouchAdd("expenses", {
      ...data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    await createAuditLog({
      action: "create",
      entity: "expense",
      entityId: id,
      description: `Menambah pengeluaran "${data.title}" (${data.expenseNumber})`,
    });

    return id;
  },

  updateExpense: async (id, data) => {
    await pouchUpdate("expenses", id, {
      ...data,
      updatedAt: nowISO(),
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
    await pouchRemove("expenses", id);

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
