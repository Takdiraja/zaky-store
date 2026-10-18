"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";
import { useProductStore } from "@/stores/use-product-store";
import { useToast } from "@/components/shared/toast-provider";
import ScannerDialog from "@/components/shared/scanner-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveStockInReceipt,
  summarizeStockIn,
  type StockInDraftItem,
} from "@/lib/stock-in";
import { PRODUCT_CATEGORIES } from "@/types";
import type { Product, ProductUnit } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function StockInForm({ open, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const products = useProductStore((s) => s.products);
  const addProduct = useProductStore((s) => s.addProduct);
  const findProductAndUnitByBarcode = useProductStore((s) => s.findProductAndUnitByBarcode);

  const [items, setItems] = useState<StockInDraftItem[]>([]);
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  // State untuk pendaftaran produk baru dari scan / cari
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newBarcode, setNewBarcode] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("Makanan");
  const [newBuyPrice, setNewBuyPrice] = useState<number | "">("");
  const [newSellPrice, setNewSellPrice] = useState<number | "">("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const summary = useMemo(() => summarizeStockIn(items), [items]);

  const addItem = (product: Product, unit: ProductUnit | null, initialBuyPrice?: number) => {
    const unitId = unit?.id ?? null;
    // Kalau produk+kemasan sama sudah ada, tambah qty-nya
    const existing = items.find(
      (it) => it.productId === product.id && it.unitId === unitId,
    );
    if (existing) {
      setItems(
        items.map((it) =>
          it === existing ? { ...it, qty: it.qty + 1 } : it,
        ),
      );
      return;
    }
    const defaultBuyPrice = initialBuyPrice !== undefined
      ? initialBuyPrice
      : (unit?.buyPrice ?? Math.round(product.buyPrice * (unit?.contains ?? 1)));

    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        unitId,
        unitName: unit ? unit.name : "Pcs",
        contains: unit ? unit.contains : 1,
        qty: 1,
        buyPricePerUnit: defaultBuyPrice,
      },
    ]);
  };

  const handleScan = async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;

    const found = findProductAndUnitByBarcode(code);
    if (found) {
      addItem(found.product, found.unit);
      toast(
        found.unit
          ? `${found.product.name} (${found.unit.name}) ditambahkan.`
          : `${found.product.name} ditambahkan.`,
        "success",
      );
      return;
    }

    // Barcode belum ada di produk — cari di katalog & seed & Open Food Facts
    setScannerOpen(false);
    toast("Mencari info barcode...", "info");

    let prefillName = "";
    let prefillBrand = "";
    let prefillCategory = "Makanan";
    let prefillSellPrice = 0;
    let prefillImageUrl = "";

    try {
      const { findInCatalog } = await import("@/lib/catalog-sync");
      const catalogHit = await findInCatalog(code);
      if (catalogHit) {
        prefillName = catalogHit.name;
        prefillBrand = catalogHit.brand ?? "";
        prefillCategory = catalogHit.category || "Makanan";
        prefillImageUrl = catalogHit.image_url ?? "";
        if (!prefillImageUrl) {
          const { findInSeed } = await import("@/lib/seed-lookup");
          const seedFallback = await findInSeed(code);
          if (seedFallback?.image_url) prefillImageUrl = seedFallback.image_url;
        }
      } else {
        const { findInSeed } = await import("@/lib/seed-lookup");
        const seed = await findInSeed(code);
        if (seed) {
          prefillName = seed.name;
          prefillCategory = seed.category;
          prefillSellPrice = seed.sellPrice ?? 0;
          prefillImageUrl = seed.image_url ?? "";
        } else {
          const { lookupBarcode } = await import("@/lib/barcode-lookup");
          const result = await lookupBarcode(code);
          if (result) {
            prefillName = result.name;
            prefillBrand = result.brand;
            prefillCategory = result.category;
            prefillImageUrl = result.image_url;
          }
        }
      }
    } catch {
      // Lookup gagal, buka dialog dengan isian kosong
    }

    setNewBarcode(code);
    setNewName(prefillName);
    setNewBrand(prefillBrand);
    setNewCategory(prefillCategory);
    setNewBuyPrice("");
    setNewSellPrice(prefillSellPrice || "");
    setNewImageUrl(prefillImageUrl);
    setNewProductOpen(true);
  };

  const handleSaveNewProduct = async () => {
    if (!newName.trim()) {
      toast("Nama produk wajib diisi.", "error");
      return;
    }
    setIsRegistering(true);
    try {
      const bCode = newBarcode.trim() || null;
      const buyPrice = Number(newBuyPrice) || 0;
      const sellPrice = Number(newSellPrice) || 0;

      const newId = await addProduct({
        name: newName.trim(),
        brand: newBrand.trim() || null,
        barcode: bCode,
        barcodes: bCode ? [bCode] : [],
        category: newCategory,
        buyPrice,
        sellPrice,
        stock: 0, // Bertambah otomatis saat nota disimpan
        minStock: 5,
        image_url: newImageUrl || null,
        isActive: true,
        trackStock: true,
      });

      // Langsung masukkan ke draft nota barang masuk
      setItems((prev) => [
        ...prev,
        {
          productId: newId,
          productName: newName.trim(),
          unitId: null,
          unitName: "Pcs",
          contains: 1,
          qty: 1,
          buyPricePerUnit: buyPrice,
        },
      ]);

      toast(`${newName.trim()} didaftarkan ke produk & ditambahkan ke nota.`, "success");
      setNewProductOpen(false);
    } catch {
      toast("Gagal mendaftarkan produk baru.", "error");
    } finally {
      setIsRegistering(false);
    }
  };


  const filteredProducts = search.trim()
    ? products
        .filter((p) => p.isActive)
        .filter((p) =>
          `${p.name} ${p.brand ?? ""}`.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 20)
    : [];

  const updateItem = (index: number, patch: Partial<StockInDraftItem>) => {
    setItems(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast("Belum ada item.", "error");
      return;
    }
    if (items.some((it) => !(it.qty > 0) || !(it.buyPricePerUnit >= 0))) {
      toast("Jumlah dan harga harus valid.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveStockInReceipt(items, supplier.trim() || null, notes.trim());
      toast("Nota barang masuk tersimpan. Stok & modal terupdate.", "success");
      setItems([]);
      setSupplier("");
      setNotes("");
      onSaved();
      onClose();
    } catch (e) {
      toast("Gagal menyimpan nota.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92dvh] max-w-[520px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nota Barang Masuk Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Supplier */}
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Supplier / Grosir
              </label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface"
                placeholder="Nama grosir (opsional)"
              />
            </div>

            {/* Tambah item */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex-1 h-12 rounded-xl bg-secondary text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Icon name="qr_code_scanner" size={20} />
                Scan Barcode
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex-1 h-12 rounded-xl border border-border-standard font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Icon name="search" size={20} />
                Cari Produk
              </button>
            </div>

            {/* Daftar item */}
            {items.length === 0 ? (
              <p className="text-center text-label-md text-on-surface-variant py-6">
                Belum ada item. Scan barcode kardus atau cari produk.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div
                    key={`${it.productId}-${it.unitId}-${i}`}
                    className="rounded-xl border border-border-standard p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-body-md">{it.productName}</p>
                        <p className="text-caption text-on-surface-variant">
                          {it.unitName} • isi {it.contains} pcs
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Hapus item"
                        onClick={() => setItems(items.filter((_, j) => j !== i))}
                        className="text-danger-alert font-bold text-xl leading-none px-2"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-label-sm text-on-surface-variant block mb-1">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={it.qty || ""}
                          onChange={(e) =>
                            updateItem(i, { qty: Number(e.target.value) || 0 })
                          }
                          className="w-full h-11 px-3 border border-border-standard rounded-lg outline-none focus:border-secondary bg-surface"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-label-sm text-on-surface-variant block mb-1">
                          Harga / {it.unitName}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={it.buyPricePerUnit || ""}
                          onChange={(e) =>
                            updateItem(i, { buyPricePerUnit: Number(e.target.value) || 0 })
                          }
                          className="w-full h-11 px-3 border border-border-standard rounded-lg outline-none focus:border-secondary bg-surface"
                        />
                      </div>
                    </div>
                    <p className="text-right text-label-md font-semibold text-secondary">
                      {formatCurrency(it.qty * it.buyPricePerUnit)}
                      <span className="font-normal text-on-surface-variant">
                        {" "}• +{it.qty * it.contains} pcs
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Catatan */}
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Catatan
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface"
                placeholder="Opsional"
              />
            </div>

            {/* Total */}
            {items.length > 0 && (
              <div className="rounded-xl bg-surface-container p-4 space-y-1">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Total belanja</span>
                  <span className="font-extrabold text-secondary">
                    {formatCurrency(summary.totalAmount)}
                  </span>
                </div>
                <p className="text-caption text-on-surface-variant">
                  Tercatat sebagai modal “Belanja Stok” • Stok +{summary.totalStockAdded} pcs
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="w-full h-13 py-3.5 rounded-xl bg-success text-white font-bold disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? "Menyimpan..." : "Simpan Nota"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cari produk manual */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Cari Produk</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface"
            placeholder="Ketik nama produk..."
          />
          <div className="max-h-80 overflow-y-auto space-y-1 mt-2">
            {filteredProducts.map((p) => (
              <div key={p.id} className="rounded-lg border border-border-standard p-2">
                <p className="font-semibold text-body-md">{p.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      addItem(p, null);
                      setSearchOpen(false);
                      setSearch("");
                    }}
                    className="px-3 h-9 rounded-lg bg-surface-container text-label-md font-semibold active:scale-95"
                  >
                    Pcs
                  </button>
                  {(p.units ?? []).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        addItem(p, u);
                        setSearchOpen(false);
                        setSearch("");
                      }}
                      className="px-3 h-9 rounded-lg bg-secondary/10 text-secondary text-label-md font-semibold active:scale-95"
                    >
                      {u.name} ({u.contains})
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {search.trim() && filteredProducts.length === 0 && (
              <div className="text-center py-5 space-y-3">
                <p className="text-label-md text-on-surface-variant">
                  Produk &quot;{search}&quot; belum terdaftar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setNewBarcode("");
                    setNewName(search.trim());
                    setNewBrand("");
                    setNewCategory("Makanan");
                    setNewBuyPrice("");
                    setNewSellPrice("");
                    setNewImageUrl("");
                    setNewProductOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white text-label-md font-semibold active:scale-[0.98]"
                >
                  <Icon name="add" size={18} />
                  Daftarkan &quot;{search}&quot;
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Pendaftaran Produk Baru Otomatis dari Scan/Cari */}
      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent className="max-w-[460px] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produk Baru Terdeteksi</DialogTitle>
          </DialogHeader>

          <p className="text-body-sm text-on-surface-variant -mt-2">
            Produk ini belum ada di katalog. Lengkapi data di bawah untuk otomatis menyimpannya ke produk dan memasukkannya ke nota ini.
          </p>

          <div className="space-y-3.5 pt-1">
            {newBarcode && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container font-mono text-label-md text-secondary border border-border-standard">
                <Icon name="qr_code" size={18} />
                <span>Barcode: <strong className="text-ink">{newBarcode}</strong></span>
              </div>
            )}

            <div>
              <label className="text-label-sm text-on-surface-variant block mb-1">
                Nama Produk *
              </label>
              <input
                autoFocus={!newBarcode}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Indomie Goreng 85g"
                className="w-full h-11 px-3.5 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface text-body-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">
                  Merk / Brand
                </label>
                <input
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Opsional"
                  className="w-full h-11 px-3.5 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface text-body-md"
                />
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">
                  Kategori
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-11 px-3 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface text-body-md"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">
                  Harga Beli (Modal) *
                </label>
                <input
                  type="number"
                  min="0"
                  autoFocus={Boolean(newBarcode)}
                  value={newBuyPrice}
                  onChange={(e) =>
                    setNewBuyPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Rp 0"
                  className="w-full h-11 px-3.5 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface text-body-md"
                />
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">
                  Harga Jual
                </label>
                <input
                  type="number"
                  min="0"
                  value={newSellPrice}
                  onChange={(e) =>
                    setNewSellPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Rp 0"
                  className="w-full h-11 px-3.5 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface text-body-md"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewProductOpen(false)}
                className="flex-1 h-12 rounded-xl border border-border-standard font-semibold text-on-surface-variant active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewProduct}
                disabled={isRegistering || !newName.trim()}
                className="flex-1 h-12 rounded-xl bg-secondary text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                <Icon name="check" size={18} />
                {isRegistering ? "Menyimpan..." : "Simpan ke Nota"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        mode="product"
      />
    </>
  );
}
