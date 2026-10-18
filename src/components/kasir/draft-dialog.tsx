"use client";

import { useState, useMemo } from "react";
import { useDraftStore } from "@/stores/use-draft-store";
import { useCartStore } from "@/stores/use-cart-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import { useToast } from "@/components/shared/toast-provider";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import StatusBadge from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Draft } from "@/stores/use-draft-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DraftDialog({ open, onOpenChange }: Props) {
  const [mode, setMode] = useState<"list" | "save">("save");
  const [search, setSearch] = useState("");
  const [draftName, setDraftName] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState<Draft | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const { drafts, saveDraft, deleteDraft } = useDraftStore();
  const { items, paymentMethod, selectedCustomerId, setCustomer } = useCartStore();
  const { getCustomerById } = useCustomerStore();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!search.trim()) return drafts;
    const q = search.toLowerCase();
    return drafts.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.draftNumber.toLowerCase().includes(q),
    );
  }, [drafts, search]);

  // Pre-fill name from selected customer
  const customerName = selectedCustomerId
    ? getCustomerById(selectedCustomerId)?.name
    : "";

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDraft(
        draftName || customerName || "",
        items,
        paymentMethod,
        selectedCustomerId,
      );
      toast("Draft berhasil disimpan.", "success");
      setMode("list");
      setDraftName("");
    } catch {
      toast("Gagal menyimpan draft.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (draft: Draft) => {
    if (items.length > 0) {
      setRestoreConfirm(draft);
    } else {
      doRestore(draft);
    }
  };

  const doRestore = async (draft: Draft) => {
    useCartStore.setState({
      items: draft.items,
      paymentMethod: draft.paymentMethod,
      selectedCustomerId: draft.selectedCustomerId,
    });
    setCustomer(draft.selectedCustomerId);
    // The draft has been resumed — remove it immediately so it can't be
    // resumed twice or linger after the transaction is completed.
    try {
      await deleteDraft(draft.id);
    } catch {
      // Deleting the draft is best-effort; the cart restore still succeeded.
    }
    toast("Draft berhasil dimuat.", "success");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteDraft(deleteConfirm.id);
    toast("Draft berhasil dihapus.", "success");
    setDeleteConfirm(null);
  };

  const hasItems = items.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] max-w-[480px] overflow-y-auto">
          {mode === "save" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-headline-md font-bold">
                  Simpan Draft
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-label-md text-on-surface-variant">
                    Nama Draft <span className="text-on-surface-variant/60">(opsional)</span>
                  </label>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                    placeholder={customerName || "Misal: Pesanan Pak Joko"}
                    autoFocus
                  />
                  {!draftName && customerName && (
                    <p className="mt-1 text-caption text-on-surface-variant">
                      Akan menggunakan &ldquo;{customerName}&rdquo;
                    </p>
                  )}
                </div>

                {/* Cart summary */}
                <div className="space-y-1 rounded-md bg-surface-container p-3 text-body-sm">
                  <p className="font-bold text-on-surface">{items.length} produk</p>
                  <p className="text-on-surface-variant">
                    {formatCurrency(items.reduce((s, i) => s + i.subtotal, 0))}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge
                      label={paymentMethod === "cash" ? "Tunai" : paymentMethod === "kasbon" ? "Kasbon" : "QRIS"}
                      variant={paymentMethod === "cash" ? "success" : paymentMethod === "kasbon" ? "warning" : "info"}
                    />
                    {customerName && (
                      <span className="text-caption text-on-surface-variant">{customerName}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setMode("list")}
                    className="h-12 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
                  >
                    Lihat Draft
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasItems}
                    className="h-12 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-headline-md font-bold">
                  Draft Transaksi
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-md border border-border-standard bg-card pl-10 pr-3 text-body-sm outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                    placeholder="Cari draft..."
                  />
                </div>

                {hasItems && (
                  <button
                    onClick={() => {
                      setMode("save");
                      setDraftName(customerName || "");
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-standard text-label-md font-semibold text-secondary transition-transform active:scale-[0.98]"
                  >
                    <Icon name="add" size={16} />
                    Simpan Draft Baru
                  </button>
                )}

                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-label-md text-on-surface-variant/60">
                    {search ? "Tidak ditemukan" : "Belum ada draft"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((d) => {
                      const customer = d.selectedCustomerId
                        ? getCustomerById(d.selectedCustomerId)
                        : null;
                      return (
                        <div
                          key={d.id}
                          className="space-y-2 rounded-md border border-border-standard bg-card p-3 shadow-card"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-body-sm font-bold text-on-surface">{d.name}</p>
                              <p className="mt-0.5 font-mono text-caption text-on-surface-variant">
                                {d.draftNumber}
                              </p>
                            </div>
                            <StatusBadge
                              label={d.paymentMethod === "cash" ? "Tunai" : d.paymentMethod === "kasbon" ? "Kasbon" : "QRIS"}
                              variant={d.paymentMethod === "cash" ? "success" : d.paymentMethod === "kasbon" ? "warning" : "info"}
                            />
                          </div>
                          <div className="flex items-center justify-between text-body-sm">
                            <span className="text-on-surface-variant">
                              {d.items.length} produk · {formatCurrency(d.totalAmount)}
                            </span>
                            <span className="text-caption text-on-surface-variant">
                              {formatTime(d.createdAt)}
                            </span>
                          </div>
                          {customer && (
                            <p className="text-caption text-on-surface-variant">{customer.name}</p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleRestore(d)}
                              className="h-10 flex-1 rounded-md bg-secondary text-label-md font-semibold text-white transition-all active:scale-[0.98]"
                            >
                              Lanjutkan
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(d)}
                              className="h-10 rounded-md border border-border-standard bg-card px-4 text-label-md font-semibold text-danger transition-colors active:bg-surface-container"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={restoreConfirm !== null}
        onOpenChange={(o) => !o && setRestoreConfirm(null)}
        title="Ganti Keranjang"
        description="Keranjang saat ini akan diganti dengan draft ini. Lanjutkan?"
        confirmLabel="Lanjutkan"
        onConfirm={() => {
          if (restoreConfirm) doRestore(restoreConfirm);
          setRestoreConfirm(null);
        }}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title="Hapus Draft"
        description="Yakin ingin menghapus draft ini?"
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}
