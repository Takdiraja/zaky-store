"use client";

import { useEffect, useState } from "react";
import { useStockInStore } from "@/stores/use-stockin-store";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import SearchInput from "@/components/shared/search-input";
import EmptyState from "@/components/shared/empty-state";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StockInForm from "@/components/stock-in/stockin-form";
import type { StockInReceipt } from "@/types";
import {
  PrintProgressDialog,
  printStockInReceiptJob,
  type PrintJobState,
  type PrintPhase,
} from "@/components/shared/print-progress-dialog";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useSettingsStore } from "@/stores/use-settings-store";

export default function BarangMasukPage() {
  const receipts = useStockInStore((s) => s.receipts);
  const loading = useStockInStore((s) => s.loading);
  const loadReceipts = useStockInStore((s) => s.loadReceipts);
  const deleteReceipt = useStockInStore((s) => s.deleteReceipt);
  const { toast } = useToast();
  const { paperWidth } = usePrinterStore();
  const storeName = useSettingsStore((s) => s.storeName);
  const storeAddress = useSettingsStore((s) => s.storeAddress);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<StockInReceipt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockInReceipt | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [printState, setPrintState] = useState<PrintJobState>({ phase: "idle" as PrintPhase, error: null });
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    const unsub = loadReceipts();
    return unsub;
  }, [loadReceipts]);

  const filtered = search.trim()
    ? receipts.filter(
        (r) =>
          r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
          (r.supplier ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : receipts;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReceipt(deleteTarget.id);
      toast("Nota dihapus.", "success");
      setDeleteTarget(null);
      setDetail(null);
    } catch {
      toast("Gagal menghapus nota.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrintReceipt = async (r: StockInReceipt) => {
    setPrintOpen(true);
    setPrintState({ phase: "connecting", error: null });
    try {
      await printStockInReceiptJob(
        {
          receiptNumber: r.receiptNumber,
          receiptDate: r.receiptDate,
          supplier: r.supplier,
          notes: r.notes,
          items: r.items,
          totalAmount: r.totalAmount,
          paperWidth,
          storeName,
          storeAddress,
        },
        (phase) => setPrintState((prev) => ({ ...prev, phase })),
      );
      toast("Nota barang masuk berhasil dicetak.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mencetak nota.";
      setPrintState({ phase: "error", error: msg });
      toast(msg, "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold">Barang Masuk</h1>
          <p className="text-caption text-on-surface-variant">
            Nota belanja grosir — otomatis update stok & modal
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="h-11 px-5 rounded-xl bg-secondary text-white font-semibold flex items-center gap-2 active:scale-[0.98]"
        >
          <Icon name="add" size={20} />
          Nota Baru
        </button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cari nomor nota / supplier..."
      />

      {loading ? (
        <p className="text-center text-label-md text-on-surface-variant py-10">
          Memuat...
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="Belum ada nota barang masuk"
          description="Buat nota baru setiap belanja ke grosir."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setDetail(r)}
              className="w-full text-left rounded-xl border border-border-standard bg-card p-4 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-semibold text-body-md">
                    {r.receiptNumber}
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    {formatDate(r.receiptDate)}
                    {r.supplier ? ` • ${r.supplier}` : ""} • {r.items.length} item
                  </p>
                </div>
                <p className="font-extrabold text-secondary whitespace-nowrap">
                  {formatCurrency(r.totalAmount)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail nota */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-[480px] max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{detail?.receiptNumber}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <p className="text-caption text-on-surface-variant">
                {formatDate(detail.receiptDate)}
                {detail.supplier ? ` • ${detail.supplier}` : ""}
              </p>
              <div className="space-y-1.5">
                {detail.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between gap-2 rounded-lg bg-surface-container px-3 py-2"
                  >
                    <div>
                      <p className="text-body-md font-medium">{it.productName}</p>
                      <p className="text-caption text-on-surface-variant">
                        {it.qty} {it.unitName} × {formatCurrency(it.buyPricePerUnit)}
                        {" "}(+{it.stockAdded} pcs)
                      </p>
                    </div>
                    <p className="font-semibold text-body-md whitespace-nowrap">
                      {formatCurrency(it.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border-standard pt-3">
                <span className="font-semibold">Total</span>
                <span className="font-extrabold text-secondary text-headline-sm">
                  {formatCurrency(detail.totalAmount)}
                </span>
              </div>
              {detail.notes && (
                <p className="text-caption text-on-surface-variant">
                  Catatan: {detail.notes}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => detail && handlePrintReceipt(detail)}
                  className="flex-1 h-11 rounded-xl bg-secondary text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Icon name="print" size={18} />
                  Cetak Struk
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(detail)}
                  className="h-11 px-4 rounded-xl border border-danger-alert text-danger-alert font-semibold active:scale-[0.98]"
                >
                  Hapus
                </button>
              </div>
              <p className="text-caption text-on-surface-variant text-center">
                Menghapus nota tidak mengembalikan stok & modal otomatis.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus nota?"
        description={`"${deleteTarget?.receiptNumber}" akan dihapus permanen.`}
        confirmLabel="Hapus"
      />

      <StockInForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {}}
      />

      <PrintProgressDialog
        open={printOpen}
        state={printState}
        onRetry={() => detail && handlePrintReceipt(detail)}
        onClose={() => setPrintOpen(false)}
      />
    </div>
  );
}
