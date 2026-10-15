import { create } from "zustand";
import type { DebtPayment } from "@/types";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const paymentsCollection = collection(db, "debt_payments");
const paymentsQuery = query(
  paymentsCollection,
  orderBy("paymentDate", "desc"),
);

export const useDebtPaymentStore = create<DebtPaymentStore>((set, get) => ({
  payments: [],
  loading: true,
  initialized: false,

  loadPayments: () => {
    const unsub = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const payments = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
          } as unknown as DebtPayment;
        });
        set({ payments, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addPayment: async (data) => {
    const docRef = await addDoc(paymentsCollection, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getPaymentsByCustomer: (customerId) =>
    get().payments.filter((p) => p.customerId === customerId),
}));
