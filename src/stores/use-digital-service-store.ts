import { create } from "zustand";
import type { DigitalServiceTransaction } from "@/types";
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
import { toDateKey } from "@/lib/period-metrics";

interface AddDigitalServiceInput {
  transactionNumber: string;
  serviceType: string;
  customerIdentifier: string;
  subService?: string | null;
  tokenCode?: string | null;
  customerName: string | null;
  nominalAmount: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: "cash" | "qris";
  transactionDate: string;
  notes: string | null;
  receiptNumber: string | null;
  printed: boolean;
  printCount: number;
}

interface DigitalServiceStore {
  transactions: DigitalServiceTransaction[];
  loading: boolean;
  initialized: boolean;
  loadTransactions: () => () => void;
  addTransaction: (
    data: AddDigitalServiceInput,
  ) => Promise<string>;
  updateTransaction: (
    id: string,
    changes: Partial<DigitalServiceTransaction>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  /** Marks the receipt as printed and bumps the print counter. */
  markPrinted: (id: string) => Promise<void>;
  getTransactionsByDateRange: (
    start: string,
    end: string,
  ) => DigitalServiceTransaction[];
}

const digitalServiceCollection = collection(db, "digital_services");
const digitalServiceQuery = query(
  digitalServiceCollection,
  orderBy("transactionDate", "desc"),
);

export const useDigitalServiceStore = create<DigitalServiceStore>((set, get) => ({
  transactions: [],
  loading: true,
  initialized: false,

  loadTransactions: () => {
    const unsub = onSnapshot(
      digitalServiceQuery,
      (snapshot) => {
        const transactions = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
          } as DigitalServiceTransaction;
        });
        set({ transactions, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addTransaction: async (data) => {
    const docRef = await addDoc(digitalServiceCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "digital_service",
      entityId: docRef.id,
      description: `Transaksi layanan digital ${data.transactionNumber} (${data.serviceType}) sebesar ${data.totalAmount}`,
    });

    return docRef.id;
  },

  updateTransaction: async (id, changes) => {
    await updateDoc(doc(digitalServiceCollection, id), {
      ...changes,
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "update",
      entity: "digital_service",
      entityId: id,
      description: `Transaksi layanan digital ${id} diperbarui`,
    });
  },

  deleteTransaction: async (id) => {
    const txn = get().transactions.find((t) => t.id === id);
    await deleteDoc(doc(digitalServiceCollection, id));

    await createAuditLog({
      action: "delete",
      entity: "digital_service",
      entityId: id,
      description: `Menghapus transaksi layanan digital ${txn?.transactionNumber || id}`,
    });
  },

  markPrinted: async (id) => {
    const txn = get().transactions.find((t) => t.id === id);
    await updateDoc(doc(digitalServiceCollection, id), {
      printed: true,
      printCount: (txn?.printCount ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });
  },

  getTransactionsByDateRange: (start, end) => {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    endDate.setHours(23, 59, 59, 999);
    return get().transactions.filter((t) => {
      const d = new Date(`${toDateKey(t.transactionDate)}T00:00:00`);
      return d >= startDate && d <= endDate;
    });
  },
}));
