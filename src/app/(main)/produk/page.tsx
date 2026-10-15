"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";
import { lookupBarcode } from "@/lib/barcode-lookup";
import { useProductStore } from "@/stores/use-product-store";
import { useShallow } from "zustand/react/shallow";
import StockBadge from "@/components/produk/stock-badge";
import ProductForm from "@/components/produk/product-form";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import ScannerDialog from "@/components/shared/scanner-dialog";
import { useToast } from "@/components/shared/toast-provider";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import KpiCard from "@/components/shared/kpi-card";
import EmptyState from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeleton";
import { useInventoryAnalytics, VELOCITY_META, type SalesVelocity } from "@/hooks/use-inventory-analytics";

type Filter = "semua" | "stok-tipis" | "favorit" | SalesVelocity;

const VELOCITY_TEXT: Record<SalesVelocity, string> = {
  fast: "text-success",
  normal: "text-info",
  slow: "text-warning",
  dead: "text-danger",
};

export default function ProdukPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scannedName, setScannedName] = useState<string>("");
  const [scannedBrand, setScannedBrand] = useState<string>("");
  const [scannedCategory, setScannedCategory] = useState<string>("");
  const [scannedImageUrl, setScannedImageUrl] = useState<string>("");

  const { products, loading: productsLoading, quickAddStock, deleteProduct, toggleFavorite } = useProductStore(
    useShallow((s) => ({
      products: s.products,
      loading: s.loading,
      quickAddStock: s.quickAddStock,
      deleteProduct: s.deleteProduct,
      toggleFavorite: s.toggleFavorite,
    }))
  );
  const { toast } = useToast();

  const allActive = useMemo(() => products.filter((p) => p.isActive), [products]);
  const lowStockCount = allActive.filter((p) => p.stock <= p.minStock).length;
  const totalStockValue = allActive.reduce((s, p) => s + p.buyPrice * p.stock, 0);

  // Inventory analytics: velocity + reorder suggestion per active product.
  const analytics = useInventoryAnalytics(allActive);
  const analyticsByProduct = useMemo(
    () => new Map(analytics.map((a) => [a.product.id, a])),
    [analytics],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allActive.filter((p) => {
      if (filter === "stok-tipis" && p.stock > p.minStock) return false;
      if (filter === "favorit" && !p.is_favorite) return false;
      if (filter === "fast" || filter === "normal" || filter === "slow" || filter === "dead") {
        if (analyticsByProduct.get(p.id)?.velocity !== filter) return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allActive, search, filter, analyticsByProduct]);

  const handleEdit = (id: string) => {
    setEditId(id);
    setFormOpen(true);
    setMenuOpenId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
      toast("Produk berhasil dihapus.");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditId(null);
    setScannedBarcode(null);
    setScannedName("");
    setScannedCategory("");
  };

  const handleManualAdd = () => {
    setSpeedDialOpen(false);
    setEditId(null);
    setScannedBarcode(null);
    setScannedName("");
    setScannedCategory("");
    setFormOpen(true);
  };

  const handleScanProduct = () => {
    setSpeedDialOpen(false);
    setScannerOpen(true);
  };

  const handleScanResult = async (barcode: string) => {
    // Check duplicate
    const existing = useProductStore.getState().findProductByBarcode(barcode);
    if (existing) {
      toast(`Barcode sudah digunakan oleh produk "${existing.name}".`, "error");
      return;
    }

    // Try to look up product details from barcode database
    setScannedBarcode(barcode);

    let name = "";
    let brand = "";
    let category = "Makanan";
    let imageUrl = "";
    try {
      const result = await lookupBarcode(barcode);
      if (result) {
        name = result.name;
        brand = result.brand;
        category = result.category;
        imageUrl = result.image_url;
      }
    } catch {
      // Lookup failed, leave fields empty for manual input
    }

    setScannedName(name);
    setScannedBrand(brand);
    setScannedCategory(category);
    setScannedImageUrl(imageUrl);
    setScannerOpen(false);
    setEditId(null);
    setFormOpen(true);
  };

  const filterChips: { id: Filter; label: string }[] = [
    { id: "semua", label: "Semua" },
    { id: "stok-tipis", label: "Stok Menipis" },
    { id: "favorit", label: "Favorit" },
    { id: "fast", label: "Laris" },
    { id: "slow", label: "Lambat" },
    { id: "dead", label: "Tidak Laku" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Produk"
        subtitle={`${allActive.length} produk aktif`}
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={handleScanProduct}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border-standard bg-card px-4 font-semibold text-on-surface transition-colors hover:bg-surface-container active:scale-[0.98]"
            >
              <Icon name="scan_barcode" size={18} />
              Scan Produk
            </button>
            <button
              onClick={() => { setEditId(null); setFormOpen(true); }}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-secondary px-5 font-semibold text-white shadow-fab transition-all active:scale-[0.98]"
            >
              <Plus className="size-5" />
              Tambah Produk
            </button>
          </div>
        }
      />

      {/* Search + filters */}
      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama produk atau barcode…"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-label-md font-medium transition-all active:scale-95 ${
                filter === chip.id
                  ? "bg-secondary text-white"
                  : "border border-border-standard bg-card text-on-surface"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Produk"
          value={String(allActive.length)}
          icon="inventory_2"
          tone="info"
          footer="Produk aktif"
        />
        <KpiCard
          label="Stok Menipis"
          value={`${lowStockCount} item`}
          icon="warning"
          tone="warning"
          onClick={() => setFilter(filter === "stok-tipis" ? "semua" : "stok-tipis")}
          footer="Ketuk untuk melihat daftar"
        />
        <KpiCard
          label="Nilai Stok"
          value={formatCurrency(totalStockValue)}
          icon="receipt"
          tone="default"
          footer="Total nilai inventaris"
        />
      </div>

      {/* Product Table (tablet) */}
      <div className="hidden overflow-hidden rounded-lg border border-border-standard bg-card shadow-card md:block">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-border-standard bg-surface-container-low">
            <tr>
              <th className="px-5 py-3 text-label-md text-on-surface-variant">Info Produk</th>
              <th className="px-5 py-3 text-center text-label-md text-on-surface-variant">Harga Beli</th>
              <th className="px-5 py-3 text-center text-label-md text-on-surface-variant">Harga Jual</th>
              <th className="px-5 py-3 text-center text-label-md text-on-surface-variant">Stok</th>
              <th className="px-5 py-3 text-right text-label-md text-on-surface-variant">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-standard">
            {productsLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6">
                  <SkeletonList count={5} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <EmptyState
                    icon="inventory_2"
                    title="Tidak ada produk"
                    description="Coba ubah kata kunci atau filter."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-surface-container-low/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-container-high">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <Icon name="package" size={24} className="opacity-40" />
                        )}
                      </div>
                      <div>
                        <div className="text-body-lg font-bold text-on-surface">{product.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {product.brand && <span className="text-caption text-on-surface-variant">{product.brand}</span>}
                          <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-caption uppercase text-on-surface-variant">{product.category}</span>
                          {product.barcode && <span className="text-caption text-on-surface-variant">• {product.barcode}</span>}
                          <StockBadge stock={product.stock} minStock={product.minStock} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-on-surface-variant">{formatCurrency(product.buyPrice)}</td>
                  <td className="px-5 py-4 text-center font-bold text-on-surface">{formatCurrency(product.sellPrice)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`font-bold ${product.stock <= product.minStock ? "text-danger" : "text-on-surface"}`}>
                      {product.stock} <span className="text-body-sm font-normal text-on-surface-variant">pcs</span>
                    </span>
                    {(() => {
                      const a = analyticsByProduct.get(product.id);
                      if (!a) return null;
                      if (a.reorderQty > 0) {
                        return (
                          <span className="mt-0.5 block text-caption font-semibold text-warning">
                            +{a.reorderQty} pcs untuk restok
                          </span>
                        );
                      }
                      if (a.velocity === "slow" || a.velocity === "dead") {
                        return (
                          <span className={`mt-0.5 block text-caption font-medium ${VELOCITY_TEXT[a.velocity]}`}>
                            {VELOCITY_META[a.velocity].label}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={async () => {
                          const r = await toggleFavorite(product.id);
                          if (!r.success) toast(r.message!, "error");
                        }}
                        className={`flex size-11 items-center justify-center rounded-md border border-border-standard bg-card transition-all active:scale-95 ${
                          product.is_favorite
                            ? "text-warning border-warning/30 bg-warning/10"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                        title={product.is_favorite ? "Hapus dari favorit" : "Tandai favorit"}
                        aria-label="Favorit"
                      >
                        <Icon name="star" size={18} fill={product.is_favorite ? "currentColor" : undefined} />
                      </button>
                      <button
                        onClick={() => handleEdit(product.id)}
                        className="flex size-11 items-center justify-center rounded-md border border-border-standard bg-card text-secondary transition-all active:scale-95"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex size-11 items-center justify-center rounded-md border border-border-standard bg-card text-danger transition-all active:scale-95"
                        title="Hapus"
                        aria-label="Hapus"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                      <button
                        onClick={() => quickAddStock(product.id, 1)}
                        className="flex size-11 items-center justify-center rounded-md border border-border-standard bg-card text-secondary transition-all active:scale-95"
                        title="Tambah stok +1"
                        aria-label="Tambah stok"
                      >
                        <Plus className="size-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: product rows */}
      <div className="space-y-3 md:hidden">
        {productsLoading ? (
          <SkeletonList count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="Tidak ada produk"
            description="Coba ubah kata kunci atau filter."
          />
        ) : (
          filtered.map((product) => (
            <div key={product.id} className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-container-high">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <Icon name="package" size={20} className="opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-wrap wrap-break-word text-label-xl font-bold text-on-surface">{product.name}</span>
                    {product.brand && <span className="text-caption text-on-surface-variant">{product.brand}</span>}
                    <span className="block text-caption text-on-surface-variant">{product.category}</span>
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-1">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const r = await toggleFavorite(product.id);
                      if (!r.success) toast(r.message!, "error");
                    }}
                    className={`flex size-11 items-center justify-center ${product.is_favorite ? "text-warning" : "text-on-surface-variant"}`}
                    aria-label="Favorit"
                  >
                    <Icon name="star" size={20} fill={product.is_favorite ? "currentColor" : undefined} />
                  </button>
                  <StockBadge stock={product.stock} minStock={product.minStock} />
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === product.id ? null : product.id)}
                      className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container"
                      aria-label="Aksi"
                    >
                      <Icon name="more_vert" size={18} className="text-on-surface-variant" />
                    </button>
                    {menuOpenId === product.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-md border border-border-standard bg-card py-1 shadow-dialog">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-body-sm hover:bg-surface-container"
                          >
                            <Icon name="edit" size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-body-sm text-danger hover:bg-danger/5"
                          >
                            <Icon name="delete" size={14} /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-y border-border-standard/60 py-2">
                <div>
                  <span className="text-caption text-on-surface-variant">Beli</span>
                  <span className="block font-semibold text-on-surface-variant">{formatCurrency(product.buyPrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-caption text-on-surface-variant">Jual</span>
                  <span className="block font-bold text-secondary">{formatCurrency(product.sellPrice)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex min-w-0 flex-col">
                  <span className={`font-bold ${product.stock <= product.minStock ? "text-danger" : "text-on-surface"}`}>
                    {product.stock} <span className="text-body-sm font-normal text-on-surface-variant">pcs</span>
                  </span>
                  {(() => {
                    const a = analyticsByProduct.get(product.id);
                    if (!a) return null;
                    if (a.reorderQty > 0) {
                      return (
                        <span className="text-caption font-semibold text-warning">
                          +{a.reorderQty} pcs untuk restok
                        </span>
                      );
                    }
                    if (a.velocity === "slow" || a.velocity === "dead") {
                      return (
                        <span className={`text-caption font-medium ${VELOCITY_TEXT[a.velocity]}`}>
                          {VELOCITY_META[a.velocity].label}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => quickAddStock(product.id, 1)}
                    className="flex size-11 items-center justify-center rounded-md border border-border-standard bg-card text-secondary transition-all active:scale-95"
                    aria-label="Tambah stok"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile: FAB Speed Dial */}
      <div className="fixed bottom-20 right-6 z-30 flex flex-col items-end gap-3 md:hidden md:bottom-6">
        {speedDialOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setSpeedDialOpen(false)} />
            <div className="relative z-30 flex flex-col items-end gap-3">
              <button
                onClick={handleScanProduct}
                className="flex items-center gap-2 rounded-md border border-border-standard bg-card px-4 py-3 text-body-md font-semibold shadow-dialog transition-transform active:scale-95"
              >
                <Icon name="scan_barcode" size={20} className="text-secondary" />
                Scan Produk
              </button>
              <button
                onClick={handleManualAdd}
                className="flex items-center gap-2 rounded-md border border-border-standard bg-card px-4 py-3 text-body-md font-semibold shadow-dialog transition-transform active:scale-95"
              >
                <Icon name="edit" size={20} className="text-secondary" />
                Tambah Manual
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className={`relative z-30 flex size-14 items-center justify-center rounded-lg bg-secondary text-white shadow-fab transition-transform active:scale-90 ${
            speedDialOpen ? "rotate-45" : ""
          }`}
          aria-label="Tambah produk"
        >
          <Plus className="size-7" />
        </button>
      </div>

      {/* Scanner Dialog */}
      <ScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
        mode="product"
      />

      {/* Product Form */}
      <ProductForm
        key={`${editId ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={handleFormClose}
        editId={editId || undefined}
        initialBarcode={scannedBarcode || undefined}
        initialName={scannedName || undefined}
        initialBrand={scannedBrand || undefined}
        initialCategory={scannedCategory || undefined}
        initialImageUrl={scannedImageUrl || undefined}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Hapus Produk"
        description="Apakah yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
