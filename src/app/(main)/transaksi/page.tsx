"use client";

import { useState, useMemo, useRef } from "react";
import { History, MessageCircle, QrCode, User } from "lucide-react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import { useToast } from "@/components/shared/toast-provider";
import ReprintButton from "@/components/kasbon/reprint-button";
import PinDialog from "@/components/transaksi/pin-dialog";
import EditTransactionDialog from "@/components/transaksi/edit-transaction-dialog";
import QrisImageDialog from "@/components/transaksi/qris-image-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import EmptyState from "@/components/shared/empty-state";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import StatusBadge from "@/components/shared/status-badge";
import SwipeableRow from "@/components/shared/swipeable-row";
import ScanReceiptButton from "@/components/transaksi/scan-receipt-button";
import type { Transaction, PaymentMethod, TransactionStatus } from "@/types";

export default function TransaksiPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransactionStatus = useTransactionStore((s) => s.updateTransactionStatus);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const { getCustomerById } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [qrisImageOpen, setQrisImageOpen] = useState(false);
  const [qrisImageTarget, setQrisImageTarget] = useState<Transaction | null>(null);
  const [statusTarget, setStatusTarget] = useState<Transaction | null>(null);
  const [statusAction, setStatusAction] = useState<TransactionStatus>("paid");
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { toast } = useToast();

  /** Expands + scrolls to a transaction found via the receipt QR scan. */
  const handleScanFound = (transactionId: string) => {
    const txn = transactions.find((t) => t.id === transactionId);
    if (!txn) return;
    setExpandedId(transactionId);
    setSwipedId(null);
    // Scroll the row into view after it expands.
    setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-txn-id="${transactionId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  /** Focuses the search box from the not-found sheet's "Cari Manual". */
  const handleSearchManually = () => {
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const handleStatusChange = async () => {
    if (!statusTarget || statusBusy) return;
    setStatusBusy(true);
    try {
      await updateTransactionStatus(statusTarget.id, statusAction);
      toast(
        statusAction === "paid"
          ? "Transaksi ditandai Sudah Dibayar."
          : "Transaksi ditandai Belum Dibayar.",
        "success"
      );
    } catch {
      toast("Gagal mengubah status transaksi.", "error");
    } finally {
      setStatusBusy(false);
      setStatusTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      toast("Transaksi berhasil dihapus.", "success");
      if (expandedId === deleteTarget.id) setExpandedId(null);
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus transaksi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const openQrisImage = (t: Transaction) => {
    setQrisImageTarget(t);
    setQrisImageOpen(true);
  };

  const filtered = useMemo(() => {
    let result = transactions;

    if (filterMethod !== "all") {
      result = result.filter((t) => t.paymentMethod === filterMethod);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const customer = t.customerId ? getCustomerById(t.customerId) : null;
        return (
          t.receiptNumber?.toLowerCase().includes(q) ||
          t.items.some((i) => i.name.toLowerCase().includes(q)) ||
          customer?.name.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [transactions, filterMethod, search, getCustomerById]);

  const paymentMethods: { label: string; value: PaymentMethod | "all"; icon: string }[] = [
    { label: "Semua", value: "all", icon: "receipt_long" },
    { label: "Tunai", value: "cash", icon: "payments" },
    { label: "Kasbon", value: "kasbon", icon: "menu_book" },
    { label: "QRIS", value: "qris", icon: "qr_code_2" },
  ];

  const paymentBadge = (method: PaymentMethod) =>
    method === "cash"
      ? { label: "Tunai", variant: "success" as const }
      : method === "kasbon"
      ? { label: "Kasbon", variant: "warning" as const }
      : { label: "QRIS", variant: "info" as const };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title="Transaksi" subtitle={`${filtered.length} transaksi`} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput
              ref={searchRef}
              value={search}
              onChange={setSearch}
              placeholder="Cari No. nota, produk, atau pelanggan…"
            />
          </div>
          <ScanReceiptButton
            onFound={handleScanFound}
            onSearchManually={handleSearchManually}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {paymentMethods.map((pm) => (
            <button
              key={pm.value}
              onClick={() => setFilterMethod(pm.value)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-label-md font-medium transition-all active:scale-[0.98] ${
                filterMethod === pm.value
                  ? "bg-secondary text-white"
                  : "border border-border-standard bg-card text-on-surface-variant"
              }`}
            >
              <Icon name={pm.icon} size={16} />
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div ref={listRef} className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Tidak ada transaksi"
            description="Transaksi yang disimpan akan muncul di sini."
          />
        ) : (
          filtered.map((t) => {
            const customer = t.customerId ? getCustomerById(t.customerId) : null;
            const isExpanded = expandedId === t.id;
            const badge = paymentBadge(t.paymentMethod);

            return (
              <div key={t.id} data-txn-id={t.id}>
                <SwipeableRow
                  id={t.id}
                  isSwiped={swipedId === t.id}
                  onSwipedChange={(id) => {
                    setSwipedId(id);
                    if (id && expandedId) setExpandedId(null);
                  }}
                  onEdit={() => {
                    setSwipedId(null);
                    setEditTarget(t);
                    setPinOpen(true);
                  }}
                  onDelete={() => {
                    setSwipedId(null);
                    setDeleteTarget(t);
                  }}
                >
                  <div
                    onClick={() => {
                      if (swipedId === t.id) {
                        setSwipedId(null);
                        return;
                      }
                      setExpandedId(isExpanded ? null : t.id);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 pr-10">
                        <p className="font-mono text-label-md font-bold text-secondary">
                          {t.receiptNumber || "—"}
                        </p>
                        <p className="mt-0.5 text-caption text-on-surface-variant">{formatDateTime(t.date)}</p>
                        {customer && (
                          <p className="mt-0.5 text-caption text-on-surface-variant">{customer.name}</p>
                        )}
                        {t.items.length > 0 && (
                          <p className="mt-0.5 truncate text-caption text-on-surface-variant">
                            {t.items.map((i) => i.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="font-bold text-on-surface">{formatCurrency(t.totalAmount)}</p>
                        <div className="mt-1 flex flex-wrap justify-end gap-1">
                          <StatusBadge label={badge.label} variant={badge.variant} />
                          <StatusBadge
                            label={t.status === "paid" ? "Lunas" : "Belum Lunas"}
                            variant={t.status === "paid" ? "success" : "warning"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </SwipeableRow>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mx-2 mt-1 space-y-3 rounded-md border border-border-standard bg-surface-container-low p-4 text-body-sm">
                    {/* Customer info */}
                    {customer && (
                      <div className="space-y-1.5 rounded-md bg-card p-3 shadow-card">
                        <div className="flex items-center gap-2">
                          <User className="size-4 shrink-0 text-on-surface-variant" />
                          <span className="font-medium text-on-surface">{customer.name}</span>
                        </div>
                        {customer.phone && (
                          <a
                            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-secondary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="size-4 shrink-0" />
                            <span>{customer.phone}</span>
                          </a>
                        )}
                        {t.paymentMethod === "kasbon" && customer.currentDebt > 0 && (
                          <div className="flex items-center gap-2 text-warning">
                            <Icon name="menu_book" size={16} className="shrink-0" />
                            <span>Utang: {formatCurrency(customer.currentDebt)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {t.items.map((item, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-on-surface">{item.name}</p>
                          <p className="text-caption text-on-surface-variant">
                            {item.quantity} x {formatCurrency(item.sellPrice)}
                          </p>
                        </div>
                        <p className="ml-3 shrink-0 font-medium text-on-surface">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}

                    {t.notes && (
                      <div className="rounded-md bg-card p-3 shadow-card">
                        <div className="flex items-start gap-2">
                          <Icon name="lightbulb" size={16} className="mt-0.5 shrink-0 text-on-surface-variant" />
                          <p className="whitespace-pre-wrap text-on-surface-variant">{t.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 border-t border-border-standard pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Laba</span>
                        <span className="font-medium text-success">{formatCurrency(t.totalProfit)}</span>
                      </div>
                      {t.amountPaid > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant">Bayar</span>
                            <span className="text-on-surface">{formatCurrency(t.amountPaid)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant">Kembali</span>
                            <span className="font-medium text-success">{formatCurrency(t.change)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between border-t border-border-standard pt-1">
                        <span className="font-bold text-on-surface">Total</span>
                        <span className="font-bold text-secondary">{formatCurrency(t.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-standard pt-2">
                      <span className="font-mono text-caption text-on-surface-variant">
                        {t.receiptNumber || "—"}
                      </span>
                      <div className="flex items-center gap-3">
                        {t.paymentMethod === "qris" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openQrisImage(t);
                            }}
                            className="flex items-center gap-1 text-label-md font-semibold text-secondary transition-transform active:scale-95"
                          >
                            <QrCode className="size-4" />
                            Tampilkan QRIS
                          </button>
                        )}
                        <ReprintButton transaction={t} />
                      </div>
                    </div>

                    {/* QRIS status actions — only for unpaid QRIS */}
                    {t.paymentMethod === "qris" && t.status === "debt" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusTarget(t);
                            setStatusAction("paid");
                          }}
                          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-success text-label-md font-semibold text-white transition-transform active:scale-[0.98]"
                        >
                          <History className="size-4" />
                          Sudah Dibayar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PIN dialog — gates the edit flow */}
      <PinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onSuccess={() => {
          setEditOpen(true);
        }}
      />

      {/* Edit Transaction dialog — remounted per transaction so form state
          is initialized fresh from the transaction being edited. */}
      <EditTransactionDialog
        key={editTarget?.id ?? "none"}
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={editTarget}
      />

      {/* Show QRIS (re-scan) dialog */}
      <QrisImageDialog
        open={qrisImageOpen}
        onClose={() => setQrisImageOpen(false)}
        amount={qrisImageTarget?.totalAmount}
        receiptNumber={qrisImageTarget?.receiptNumber}
      />

      {/* QRIS status change confirmation */}
      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(o) => {
          if (!o) setStatusTarget(null);
        }}
        title={statusAction === "paid" ? "Tandai Sudah Dibayar?" : "Tandai Belum Dibayar?"}
        description={
          statusTarget
            ? `Transaksi ${statusTarget.receiptNumber || statusTarget.id} sebesar ${formatCurrency(
                statusTarget.totalAmount
              )} akan ditandai ${
                statusAction === "paid" ? "Sudah Dibayar" : "Belum Dibayar"
              }.`
            : ""
        }
        confirmLabel={statusBusy ? "Menyimpan..." : "Ya"}
        confirmDisabled={statusBusy}
        onConfirm={handleStatusChange}
      />

      {/* Delete Transaction confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Hapus Transaksi"
        description={
          deleteTarget
            ? `Yakin ingin menghapus transaksi ${deleteTarget.receiptNumber || deleteTarget.id} sebesar ${formatCurrency(
                deleteTarget.totalAmount
              )}? Stok produk akan dikembalikan. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        variant="danger"
        confirmDisabled={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
