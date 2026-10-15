import { create } from "zustand";
import type { CartItem, Product, PaymentMethod } from "@/types";

const CART_RECOVERY_KEY = "cart_recovery";

interface SavedCart {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  selectedCustomerId: string | null;
}

function saveRecovery(items: CartItem[], paymentMethod: PaymentMethod, selectedCustomerId: string | null) {
  if (items.length > 0) {
    localStorage.setItem(CART_RECOVERY_KEY, JSON.stringify({ items, paymentMethod, selectedCustomerId }));
  } else {
    localStorage.removeItem(CART_RECOVERY_KEY);
  }
}

function loadRecovery(): SavedCart | null {
  try {
    const raw = localStorage.getItem(CART_RECOVERY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(CART_RECOVERY_KEY);
    return null;
  }
}

interface CartStore {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  selectedCustomerId: string | null;
  lastAddedItemId: string | null;
  pendingKasbon: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCustomer: (id: string | null) => void;
  clearCart: () => void;
  recoverCart: () => boolean;
  consumeKasbon: () => void;
}

const storage = typeof window !== "undefined" ? loadRecovery() : null;

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  paymentMethod: "cash",
  selectedCustomerId: null,
  lastAddedItemId: null,
  pendingKasbon: false,

  addToCart: (product) => {
    const existing = get().items.find(
      (item) => item.productId === product.id
    );
    if (existing) {
      get().updateQuantity(product.id, existing.quantity + 1);
      set({ lastAddedItemId: product.id });
      setTimeout(() => {
        const current = get().lastAddedItemId;
        if (current === product.id) set({ lastAddedItemId: null });
      }, 600);
      return;
    }
    const newItem: CartItem = {
      productId: product.id,
      name: product.name,
      quantity: 1,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      subtotal: product.sellPrice,
      profit: product.sellPrice - product.buyPrice,
    };
    set((s) => ({ items: [...s.items, newItem], lastAddedItemId: product.id }));
    setTimeout(() => {
      const current = get().lastAddedItemId;
      if (current === product.id) set({ lastAddedItemId: null });
    }, 600);
  },

  removeFromCart: (productId) => {
    set((s) => ({
      items: s.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((s) => ({
      items: s.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: qty,
              subtotal: item.sellPrice * qty,
              profit: (item.sellPrice - item.buyPrice) * qty,
            }
          : item
      ),
    }));
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  setCustomer: (id) => set({ selectedCustomerId: id }),

  clearCart: () => {
    set({ items: [], paymentMethod: "cash", selectedCustomerId: null });
    saveRecovery([], "cash", null);
  },

  recoverCart: () => {
    const saved = loadRecovery();
    if (saved && saved.items.length > 0) {
      set({
        items: saved.items,
        paymentMethod: saved.paymentMethod,
        selectedCustomerId: saved.selectedCustomerId,
      });
      return true;
    }
    return false;
  },

  consumeKasbon: () => {
    set((s) => {
      // Apply the pending kasbon flag: force payment method to kasbon.
      const apply = s.pendingKasbon;
      return apply
        ? { paymentMethod: "kasbon", pendingKasbon: false }
        : {};
    });
  },
}));

// Auto-save cart recovery on every change
const { subscribe } = useCartStore;
subscribe((state) => {
  saveRecovery(state.items, state.paymentMethod, state.selectedCustomerId);
});
