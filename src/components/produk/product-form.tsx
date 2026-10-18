"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductStore } from "@/stores/use-product-store";
import { PRODUCT_CATEGORIES } from "@/types";
import type { ProductUnit } from "@/types";
import ProductCameraModal from "./product-camera-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string;
  initialBarcode?: string;
  initialName?: string;
  initialBrand?: string;
  initialCategory?: string;
  initialImageUrl?: string;
}

export default function ProductForm({
  open,
  onOpenChange,
  editId,
  initialBarcode,
  initialName,
  initialBrand,
  initialCategory,
  initialImageUrl,
}: Props) {
  const { addProduct, updateProduct } = useProductStore();

  // Initialized from props; the parent remounts this dialog (via `key`)
  // every time it opens, so state is always fresh for the edit/scan target.
  const existing = editId
    ? useProductStore.getState().products.find((p) => p.id === editId)
    : undefined;

  const [name, setName] = useState(existing?.name ?? initialName ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? initialBrand ?? "");
  const [category, setCategory] = useState(
    existing?.category ?? initialCategory ?? "Makanan",
  );
  const [barcode, setBarcode] = useState(existing?.barcode ?? initialBarcode ?? "");
  const [aliasBarcodes, setAliasBarcodes] = useState<string[]>(
    existing?.barcodes ?? [],
  );
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [units, setUnits] = useState<ProductUnit[]>(existing?.units ?? []);
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? initialImageUrl ?? "");
  const [processingImage, setProcessingImage] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);

  /** Kompres gambar ke max 800px JPEG via canvas, kembalikan data-URL. */
  const processImageFile = (fileOrBlob: File | Blob) => {
    setProcessingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setImageUrl(reader.result as string);
          setProcessingImage(false);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageUrl(canvas.toDataURL("image/jpeg", 0.8));
        setProcessingImage(false);
      };
      img.onerror = () => {
        setImageUrl(reader.result as string);
        setProcessingImage(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = "";
  };

  const handleOpenCamera = () => {
    if (typeof navigator !== "undefined" && Boolean(navigator.mediaDevices)) {
      setCameraModalOpen(true);
    } else {
      cameraFileRef.current?.click();
    }
  };
  const [buyPrice, setBuyPrice] = useState(existing ? String(existing.buyPrice) : "");
  const [sellPrice, setSellPrice] = useState(existing ? String(existing.sellPrice) : "");
  const [stock, setStock] = useState(existing ? String(existing.stock) : "");
  const [minStock, setMinStock] = useState(existing ? String(existing.minStock) : "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primary = barcode.trim();
    const aliases = aliasBarcodes.map((b) => b.trim()).filter(Boolean);

    // Validasi: tidak boleh ada duplikat di dalam produk ini
    const seen = new Set<string>();
    if (primary) seen.add(primary);
    for (const b of aliases) {
      if (seen.has(b)) {
        setBarcodeError("Ada barcode yang duplikat di produk ini.");
        return;
      }
      seen.add(b);
    }
    // Validasi: barcode tidak boleh dipakai produk lain
    const others = useProductStore
      .getState()
      .products.filter((p) => p.id !== editId && p.isActive);
    const usedByOther = (code: string) =>
      others.some(
        (p) =>
          p.barcode?.trim() === code ||
          (p.barcodes ?? []).some((b) => b.trim() === code) ||
          (p.units ?? []).some((u) => u.barcode?.trim() === code),
      );
    const unitBarcodes = units.map((u) => u.barcode?.trim()).filter(Boolean) as string[];
    // Validasi: barcode kemasan tidak duplikat di dalam produk ini
    for (const b of unitBarcodes) {
      if (seen.has(b)) {
        setBarcodeError(`Barcode kemasan ${b} duplikat di produk ini.`);
        return;
      }
      seen.add(b);
    }
    const clash = [primary, ...aliases, ...unitBarcodes].find((c) => c && usedByOther(c));
    if (clash) {
      setBarcodeError(`Barcode ${clash} sudah dipakai produk lain.`);
      return;
    }
    // Validasi: isi kemasan harus > 0
    if (units.some((u) => !u.name.trim() || !(u.contains > 0))) {
      setBarcodeError("Nama kemasan dan isi per kemasan wajib diisi (isi > 0).");
      return;
    }
    setBarcodeError(null);

    const data = {
      name,
      brand: brand.trim() || null,
      category,
      barcode: primary || null,
      barcodes: aliases,
      units: units.map((u) => ({
        ...u,
        name: u.name.trim(),
        barcode: u.barcode?.trim() || null,
      })),
      image_url: imageUrl.trim() || null,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      stock: Number(stock),
      minStock: Number(minStock),
      isActive: true,
    };

    try {
      if (editId) {
        await updateProduct(editId, data);
      } else {
        await addProduct(data);
      }
      onOpenChange(false);
    } catch {
      // Silently fail — Firestore will retry via offline persistence
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-xl max-w-[400px] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline-md font-bold">
            {editId ? "Edit Produk" : "Tambah Produk"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">
              Nama Produk <span className="text-danger-alert">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              placeholder="Nama produk"
              required
            />
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">Merek</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              placeholder="Contoh: Indomie, Aqua, ..."
            />
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">Barcode</label>
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              placeholder="Kosongkan jika tidak ada barcode"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-label-md text-on-surface-variant">
                Barcode Tambahan (Alias)
              </label>
              <button
                type="button"
                onClick={() => setAliasBarcodes([...aliasBarcodes, ""])}
                className="text-label-md font-semibold text-secondary"
              >
                + Tambah
              </button>
            </div>
            <p className="text-label-sm text-on-surface-variant mb-2">
              Untuk kemasan/varian lain dari produk yang sama.
            </p>
            <div className="space-y-2">
              {aliasBarcodes.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={b}
                    onChange={(e) => {
                      const next = [...aliasBarcodes];
                      next[i] = e.target.value;
                      setAliasBarcodes(next);
                    }}
                    className="flex-1 h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                    placeholder={`Barcode alias ${i + 1}`}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    aria-label="Hapus barcode alias"
                    onClick={() =>
                      setAliasBarcodes(aliasBarcodes.filter((_, j) => j !== i))
                    }
                    className="w-12 h-12 shrink-0 rounded-xl border border-border-standard text-danger-alert font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {barcodeError && (
              <p className="text-label-md text-danger-alert mt-2">{barcodeError}</p>
            )}
          </div>
          {/* Satuan Kemasan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-label-md text-on-surface-variant">
                Satuan Kemasan
              </label>
              <button
                type="button"
                onClick={() =>
                  setUnits([
                    ...units,
                    {
                      id: `unit-${Date.now()}-${units.length}`,
                      name: "",
                      barcode: null,
                      contains: 0,
                      buyPrice: null,
                    },
                  ])
                }
                className="text-label-md font-semibold text-secondary"
              >
                + Tambah
              </button>
            </div>
            <p className="text-label-sm text-on-surface-variant mb-2">
              Mis. 1 Dus = 12 pcs. Dipakai di Barang Masuk: scan barcode kardus
              → stok nambah otomatis.
            </p>
            <div className="space-y-3">
              {units.map((u, i) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-border-standard p-3 space-y-2"
                >
                  <div className="flex gap-2">
                    <input
                      value={u.name}
                      onChange={(e) => {
                        const next = [...units];
                        next[i] = { ...u, name: e.target.value };
                        setUnits(next);
                      }}
                      className="flex-1 h-11 px-3 border border-border-standard rounded-lg focus:border-secondary outline-none bg-surface transition-all"
                      placeholder="Nama kemasan (Dus/Pack)"
                    />
                    <button
                      type="button"
                      aria-label="Hapus kemasan"
                      onClick={() => setUnits(units.filter((_, j) => j !== i))}
                      className="w-11 h-11 shrink-0 rounded-lg border border-border-standard text-danger-alert font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    value={u.barcode ?? ""}
                    onChange={(e) => {
                      const next = [...units];
                      next[i] = { ...u, barcode: e.target.value || null };
                      setUnits(next);
                    }}
                    className="w-full h-11 px-3 border border-border-standard rounded-lg focus:border-secondary outline-none bg-surface transition-all"
                    placeholder="Barcode kardus (opsional)"
                    inputMode="numeric"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-label-sm text-on-surface-variant block mb-1">
                        Isi per kemasan (pcs)
                      </label>
                      <input
                        value={u.contains || ""}
                        onChange={(e) => {
                          const next = [...units];
                          next[i] = { ...u, contains: Number(e.target.value) || 0 };
                          setUnits(next);
                        }}
                        type="number"
                        min="1"
                        className="w-full h-11 px-3 border border-border-standard rounded-lg focus:border-secondary outline-none bg-surface transition-all"
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <label className="text-label-sm text-on-surface-variant block mb-1">
                        Harga beli/kemasan
                      </label>
                      <input
                        value={u.buyPrice ?? ""}
                        onChange={(e) => {
                          const next = [...units];
                          next[i] = {
                            ...u,
                            buyPrice: e.target.value ? Number(e.target.value) : null,
                          };
                          setUnits(next);
                        }}
                        type="number"
                        min="0"
                        className="w-full h-11 px-3 border border-border-standard rounded-lg focus:border-secondary outline-none bg-surface transition-all"
                        placeholder="120000"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">Gambar Produk</label>
            <div className="flex items-start gap-3">
              <div className="w-24 h-24 rounded-xl border border-border-standard overflow-hidden bg-surface-container shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs text-center px-2">
                    Belum ada gambar
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    disabled={processingImage}
                    className="h-11 px-3.5 rounded-xl border border-border-standard bg-surface hover:bg-surface-container active:scale-98 text-sm font-semibold text-on-surface inline-flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Camera className="size-4 text-secondary" />
                    Ambil Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryFileRef.current?.click()}
                    disabled={processingImage}
                    className="h-11 px-3.5 rounded-xl border border-border-standard bg-surface hover:bg-surface-container active:scale-98 text-sm font-semibold text-on-surface-variant inline-flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <ImageIcon className="size-4" />
                    Pilih Galeri
                  </button>
                </div>
                {processingImage && (
                  <p className="text-label-sm text-secondary animate-pulse">
                    Memproses & mengompres foto...
                  </p>
                )}
                {imageUrl && !processingImage && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="h-9 px-3 w-fit rounded-lg border border-danger/30 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
            <ProductCameraModal
              open={cameraModalOpen}
              onClose={() => setCameraModalOpen(false)}
              onCapture={(blobOrFile) => processImageFile(blobOrFile)}
            />
            <input
              ref={cameraFileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Harga Beli <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                required
                min="0"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Harga Jual <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                required
                min="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Stok Awal <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                required
                min="0"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Minimum Stok
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold text-body-lg active:scale-[0.98] transition-transform"
          >
            Simpan
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
