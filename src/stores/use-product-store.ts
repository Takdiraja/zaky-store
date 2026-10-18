import { create } from "zustand";
import type { Product, ProductUnit } from "@/types";
import {
  subscribeCollection,
  pouchAdd,
  pouchUpdate,
  pouchMutate,
  pouchRemove,
  nowISO,
} from "@/lib/pouch-helpers";
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
  /**
   * Cari produk + unit kemasan yang cocok dengan barcode.
   * Mengembalikan unit yang match (kalau barcode milik kemasan),
   * atau unit null kalau yang match barcode utama/alias (satuan dasar).
   */
  findProductAndUnitByBarcode: (
    barcode: string,
  ) => { product: Product; unit: ProductUnit | null } | undefined;
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

const byCreatedDesc = (a: Product, b: Product) =>
  String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: true,
  initialized: false,
  searchQuery: "",
  selectedCategory: "Semua",

  loadProducts: () => {
    return subscribeCollection<Product>(
      "products",
      (products) => set({ products, loading: false, initialized: true }),
      byCreatedDesc,
    );
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
    // Semua barcode yang dikenali sebuah produk: barcode utama + alias.
    const allCodes = (p: Product): string[] => {
      const codes: string[] = [];
      if (p.barcode != null && p.barcode.trim()) codes.push(p.barcode.trim());
      for (const b of p.barcodes ?? []) {
        const t = b.trim();
        if (t) codes.push(t);
      }
      return codes;
    };
    // 1. Exact match dulu (paling aman)
    const exact = products.find(
      (p) => p.isActive && allCodes(p).includes(norm),
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
        allCodes(p).some((c) => stripZeros(c) === normStripped),
    );
  },

  findProductAndUnitByBarcode: (barcode) => {
    const norm = barcode.trim();
    const products = get().products.filter((p) => p.isActive);
    // 1. Cek barcode kemasan dulu (lebih spesifik)
    for (const p of products) {
      for (const u of p.units ?? []) {
        if (u.barcode?.trim() === norm) return { product: p, unit: u };
      }
    }
    // 2. Fallback ke lookup biasa (barcode utama/alias → satuan dasar)
    const product = get().findProductByBarcode(barcode);
    if (product) return { product, unit: null };
    return undefined;
  },

  getLowStockProducts: () =>
    get().products.filter((p) => p.isActive && p.stock <= p.minStock),

  getFavoriteProducts: () => {
    return get().products
      .filter((p) => p.isActive && p.is_favorite === true)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  addProduct: async (data) => {
    const id = await pouchAdd("products", {
      ...data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    await createAuditLog({
      action: "create",
      entity: "product",
      entityId: id,
      description: `Menambahkan produk "${data.name}"`,
    });

    // Katalog global: kalau barcode belum dikenal (tidak di seed & tidak di
    // katalog), daftarkan agar HP lain yang scan ikut kenal namanya.
    // Harga & stok TIDAK ikut — tetap lokal per HP.
    try {
      const barcodes = [data.barcode, ...(data.barcodes ?? [])].filter(Boolean) as string[];
      if (barcodes.length > 0) {
        const { findInSeed } = await import("@/lib/seed-lookup");
        const { findInCatalog, upsertCatalogEntry } = await import("@/lib/catalog-sync");
        for (const bc of barcodes) {
          if (await findInSeed(bc)) continue;
          if (await findInCatalog(bc)) continue;
          const img = data.image_url ?? "";
          await upsertCatalogEntry({
            barcode: bc,
            name: data.name,
            brand: data.brand ?? "",
            category: data.category,
            image_url: img.startsWith("/") ? "" : img,
          });
        }
      }
    } catch {
      /* katalog gagal — produk lokal tetap kesimpen */
    }

    return id;
  },

  updateProduct: async (id, data) => {
    const before = get().products.find((p) => p.id === id);
    await pouchUpdate("products", id, {
      ...data,
      updatedAt: nowISO(),
    });

    const product = get().products.find((p) => p.id === id);
    await createAuditLog({
      action: "update",
      entity: "product",
      entityId: id,
      description: `Mengubah produk "${product?.name || id}"`,
    });

    // Katalog global: kalau nama/gambar berubah, ikut update katalog agar
    // HP lain dapat foto terbaru. Foto dikompres saat diambil (800px JPEG),
    // ditulis ke lokal dulu lalu sync otomatis saat online.
    try {
      const merged = { ...before, ...data } as typeof before & typeof data;
      const imageChanged = data.image_url !== undefined && data.image_url !== before?.image_url;
      const nameChanged = data.name !== undefined && data.name !== before?.name;
      if ((imageChanged || nameChanged) && merged) {
        const barcodes = [merged.barcode, ...((merged as any).barcodes ?? [])].filter(Boolean) as string[];
        if (barcodes.length > 0) {
          const { findInCatalog, upsertCatalogEntry } = await import("@/lib/catalog-sync");
          for (const bc of barcodes) {
            const existing = await findInCatalog(bc);
            const img = (merged as any).image_url ?? "";
            const realPhoto = img && !img.startsWith("/");
            // Update kalau: belum ada entri, atau ada foto baru, atau nama berubah
            if (!existing || realPhoto || nameChanged) {
              await upsertCatalogEntry({
                barcode: bc,
                name: (merged as any).name,
                brand: (merged as any).brand ?? existing?.brand ?? "",
                category: (merged as any).category ?? existing?.category ?? "",
                // Pertahankan gambar lama kalau yang baru bukan foto asli
                image_url: realPhoto ? img : (existing?.image_url ?? ""),
              });
            }
          }
        }
      }
    } catch {
      /* katalog gagal — produk lokal tetap kesimpen */
    }
  },

  deleteProduct: async (id) => {
    const product = get().products.find((p) => p.id === id);
    await pouchRemove("products", id);

    await createAuditLog({
      action: "delete",
      entity: "product",
      entityId: id,
      description: `Menghapus produk "${product?.name || id}"`,
    });
  },

  quickAddStock: async (id, qty) => {
    await pouchMutate("products", id, (doc) => ({
      stock: (Number(doc.stock) ?? 0) + qty,
      updatedAt: nowISO(),
    }));
  },

  reduceStock: async (id, qty) => {
    try {
      await pouchMutate("products", id, (doc) => {
        const current = Number(doc.stock) ?? 0;
        if (current < qty) throw new Error("Stok tidak mencukupi");
        return { stock: current - qty, updatedAt: nowISO() };
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

    await pouchUpdate("products", id, {
      is_favorite: !product.is_favorite,
      updatedAt: nowISO(),
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
