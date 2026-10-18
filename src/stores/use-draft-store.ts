import { create } from "zustand";
import type { CartItem, PaymentMethod } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  pouchRemove,
  nowISO,
} from "@/lib/pouch-helpers";
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

const byCreatedDesc = (a: Draft, b: Draft) =>
  String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));

export const useDraftStore = create<DraftStore>((set, get) => ({
  drafts: [],
  loading: true,
  initialized: false,

  loadDrafts: () => {
    return subscribeCollection<Draft>(
      "drafts",
      (drafts) => set({ drafts, loading: false, initialized: true }),
      byCreatedDesc,
    );
  },

  saveDraft: async (name, items, paymentMethod, selectedCustomerId) => {
    const draftNumber = await generateDraftNumber();
    const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
    const totalProfit = items.reduce((s, i) => s + i.profit, 0);

    await pouchAdd("drafts", {
      draftNumber,
      name: name || draftNumber,
      items,
      paymentMethod,
      selectedCustomerId,
      totalAmount,
      totalProfit,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    return draftNumber;
  },

  deleteDraft: async (id) => {
    await pouchRemove("drafts", id);
  },
}));
