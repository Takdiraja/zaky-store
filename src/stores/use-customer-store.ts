import { create } from "zustand";
import type { Customer } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  pouchUpdate,
  pouchMutate,
  pouchRemove,
  nowISO,
} from "@/lib/pouch-helpers";
import { createAuditLog } from "@/lib/audit-log";

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  initialized: boolean;
  loadCustomers: () => () => void;
  addCustomer: (
    c: Omit<Customer, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateCustomer: (
    id: string,
    data: Partial<Customer>,
  ) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getDebtors: () => Customer[];
  getAllCustomers: () => Customer[];
  getActiveDebtSummary: () => { count: number; total: number };
  updateDebt: (id: string, delta: number) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

const byCreatedDesc = (a: Customer, b: Customer) =>
  String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: true,
  initialized: false,

  loadCustomers: () => {
    return subscribeCollection<Customer>(
      "customers",
      (customers) => set({ customers, loading: false, initialized: true }),
      byCreatedDesc,
    );
  },

  addCustomer: async (data) => {
    const id = await pouchAdd("customers", {
      ...data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });
    return id;
  },

  updateCustomer: async (id, data) => {
    await pouchUpdate("customers", id, {
      ...data,
      updatedAt: nowISO(),
    });
  },

  getCustomerById: (id) => get().customers.find((c) => c.id === id),

  getDebtors: () => get().customers.filter((c) => c.currentDebt > 0),

  getAllCustomers: () => get().customers,

  getActiveDebtSummary: () => {
    const debtors = get().customers.filter((c) => c.currentDebt > 0);
    return {
      count: debtors.length,
      total: debtors.reduce((sum, c) => sum + c.currentDebt, 0),
    };
  },

  updateDebt: async (id, delta) => {
    const customer = get().customers.find((c) => c.id === id);
    if (!customer) return;
    await pouchMutate("customers", id, (doc) => ({
      currentDebt: Math.max(0, (Number(doc.currentDebt) ?? 0) + delta),
      updatedAt: nowISO(),
    }));
  },

  deleteCustomer: async (id) => {
    const customer = get().customers.find((c) => c.id === id);
    await pouchRemove("customers", id);

    await createAuditLog({
      action: "delete",
      entity: "customer",
      entityId: id,
      description: `Menghapus pelanggan "${customer?.name || id}"`,
    });
  },
}));
