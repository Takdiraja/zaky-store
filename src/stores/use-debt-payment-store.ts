import { create } from "zustand";
import type { DebtPayment } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  nowISO,
} from "@/lib/pouch-helpers";

interface DebtPaymentStore {
  payments: DebtPayment[];
  loading: boolean;
  initialized: boolean;
  loadPayments: () => () => void;
  addPayment: (
    p: Omit<DebtPayment, "id">,
  ) => Promise<string>;
  getPaymentsByCustomer: (customerId: string) => DebtPayment[];
}

const byPaymentDateDesc = (a: DebtPayment, b: DebtPayment) =>
  String(b.paymentDate ?? "").localeCompare(String(a.paymentDate ?? ""));

export const useDebtPaymentStore = create<DebtPaymentStore>((set, get) => ({
  payments: [],
  loading: true,
  initialized: false,

  loadPayments: () => {
    return subscribeCollection<DebtPayment>(
      "debt_payments",
      (payments) => set({ payments, loading: false, initialized: true }),
      byPaymentDateDesc,
    );
  },

  addPayment: async (data) => {
    const id = await pouchAdd("debt_payments", {
      ...data,
      createdAt: nowISO(),
    });
    return id;
  },

  getPaymentsByCustomer: (customerId) =>
    get().payments.filter((p) => p.customerId === customerId),
}));
