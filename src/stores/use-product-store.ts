import { create } from "zustand";
import type { Product } from "@/types";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuditLog } from "@/lib/audit-log";

interface ProductStore {
  products: Product[];
  loading: boolean;
  initialized: boolean;
  searchQuery: string;
  selectedCategory: string;
  loadProducts: () => () => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  getFilteredProducts: () => Product[];
  getFavoriteProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  findProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  addProduct: (
    p: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateProduct: (
    id: string,
    data: Partial<Product>,
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  quickAddStock: (id: string, qty: number) => Promise<void>;
  reduceStock: (id: string, qty: number) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<{ success: boolean; message?: string }>;
}

const productsCollection = collection(db, "products");
const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: true,
  initialized: false,
  searchQuery: "",
  selectedCategory: "Semua",

  loadProducts: () => {
    const unsub = onSnapshot(
      productsQuery,
      (snapshot) => {
        const products = snapshot.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
            }) as Product,
        );
        set({ products, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    let filtered = products.filter((p) => p.isActive);
    const q = searchQuery.toLowerCase();
    if (q) filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    if (selectedCategory !== "Semua")
      filtered = filtered.filter((p) => p.category === selectedCategory);
    return filtered;
  },

  getProductById: (id) => get().products.find((p) => p.id === id),

  findProductByBarcode: (barcode) => {
    const norm = barcode.trim();
    const products = get().products;
    // 1. Exact match dulu (paling aman)
    const exact = products.find(
      (p) => p.isActive && p.barcode != null && p.barcode.trim() === norm,
    );
    if (exact) return exact;
    // 2. Fallback: toleransi leading zero (UPC-A 12 digit vs EAN-13 13 digit
    // kadang terbaca beda format padahal produknya sama)
    const stripZeros = (s: string) => s.replace(/^0+/, "") || "0";
    const normStripped = stripZeros(norm);
    if (!normStripped) return undefined;
    return products.find(
      (p) =>
        p.isActive &&
        p.barcode != null &&
        stripZeros(p.barcode.trim()) === normStripped,
    );
  },

  getLowStockProducts: () =>
    get().products.filter((p) => p.isActive && p.stock <= p.minStock),

  getFavoriteProducts: () => {
    return get().products
      .filter((p) => p.isActive && p.is_favorite === true)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  addProduct: async (data) => {
    const docRef = await addDoc(productsCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "product",
      entityId: docRef.id,
      description: `Menambahkan produk "${data.name}"`,
    });

    return docRef.id;
  },

  updateProduct: async (id, data) => {
    await updateDoc(doc(productsCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const product = get().products.find((p) => p.id === id);
    await createAuditLog({
      action: "update",
      entity: "product",
      entityId: id,
      description: `Mengubah produk "${product?.name || id}"`,
    });
  },

  deleteProduct: async (id) => {
    const product = get().products.find((p) => p.id === id);
    await deleteDoc(doc(productsCollection, id));

    await createAuditLog({
      action: "delete",
      entity: "product",
      entityId: id,
      description: `Menghapus produk "${product?.name || id}"`,
    });
  },

  quickAddStock: async (id, qty) => {
    const ref = doc(productsCollection, id);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) return;
      const current = snap.data().stock ?? 0;
      transaction.update(ref, {
        stock: current + qty,
        updatedAt: serverTimestamp(),
      });
    });
  },

  reduceStock: async (id, qty) => {
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(productsCollection, id);
        const snap = await transaction.get(ref);
        if (!snap.exists()) throw new Error("Produk tidak ditemukan");
        const current = snap.data().stock ?? 0;
        if (current < qty) throw new Error("Stok tidak mencukupi");
        transaction.update(ref, {
          stock: current - qty,
          updatedAt: serverTimestamp(),
        });
      });
      return true;
    } catch {
      return false;
    }
  },

  toggleFavorite: async (id) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return { success: false, message: "Produk tidak ditemukan" };

    if (!product.is_favorite) {
      const favCount = get().products.filter((p) => p.is_favorite === true).length;
      if (favCount >= 20) {
        return { success: false, message: "Maksimal 20 produk favorit" };
      }
    }

    await updateDoc(doc(productsCollection, id), {
      is_favorite: !product.is_favorite,
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "update",
      entity: "product",
      entityId: id,
      description: `${!product.is_favorite ? "Menandai" : "Menghapus"} produk "${product.name}" ${!product.is_favorite ? "sebagai" : "dari"} favorit`,
    });

    return { success: true };
  },
}));
