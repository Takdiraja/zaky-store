import { create } from "zustand";
import type { CartItem, PaymentMethod } from "@/types";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateDraftNumber } from "@/lib/draft-counter";

export interface Draft {
  id: string;
  draftNumber: string;
  name: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  selectedCustomerId: string | null;
  totalAmount: number;
  totalProfit: number;
  createdAt: string;
  updatedAt: string;
}

interface DraftStore {
  drafts: Draft[];
  loading: boolean;
  initialized: boolean;
  loadDrafts: () => () => void;
  saveDraft: (
    name: string,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    selectedCustomerId: string | null,
  ) => Promise<string>;
  deleteDraft: (id: string) => Promise<void>;
}

const draftsCollection = collection(db, "drafts");
const draftsQuery = query(draftsCollection, orderBy("createdAt", "desc"));

export const useDraftStore = create<DraftStore>((set, get) => ({
  drafts: [],
  loading: true,
  initialized: false,

  loadDrafts: () => {
    const unsub = onSnapshot(
      draftsQuery,
      (snapshot) => {
        const drafts = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
          } as Draft;
        });
        set({ drafts, loading: false, initialized: true });
      },
      () => set({ loading: false }),
    );
    return unsub;
  },

  saveDraft: async (name, items, paymentMethod, selectedCustomerId) => {
    const draftNumber = await generateDraftNumber();
    const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
    const totalProfit = items.reduce((s, i) => s + i.profit, 0);

    await addDoc(draftsCollection, {
      draftNumber,
      name: name || draftNumber,
      items,
      paymentMethod,
      selectedCustomerId,
      totalAmount,
      totalProfit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return draftNumber;
  },

  deleteDraft: async (id) => {
    await deleteDoc(doc(draftsCollection, id));
  },
}));
