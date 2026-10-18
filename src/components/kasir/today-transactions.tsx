"use client";

import { useState, useMemo } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { Search } from "lucide-react";
import ReprintButton from "@/components/kasbon/reprint-button";
import { useToast } from "@/components/shared/toast-provider";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import StatusBadge from "@/components/shared/status-badge";
import type { Transaction } from "@/types";

interface Props {
  variant?: "inline" | "sheet";
}

const MAX_DISPLAY = 10;

export default function TodayTransactions({ variant = "inline" }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [payConfirm, setPayConfirm] = useState<Transaction | null>(null);
  const [paying, setPaying] = useState(false);
  const { getTodayTransactions } = useTransactionStore();
  const { getCustomerById, updateDebt } = useCustomerStore();
  const { addPayment } = useDebtPaymentStore();
  const { toast } = useToast();

  const rows = useMemo(() => {
    let list = getTodayTransactions()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_DISPLAY);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const customer = t.customerId ? getCustomerById(t.customerId) : null;
        return (
          t.receiptNumber?.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q) ||
          t.items.some((i) => i.name.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [getTodayTransactions, search, getCustomerById]);

  const handlePayDebt = async () => {
    if (!payConfirm) return;
    setPaying(true);
    try {
      const customerId = payConfirm.customerId!;
      await addPayment({
        customerId,
        amount: payConfirm.totalAmount,
        paymentDate: new Date().toISOString(),
        notes: "Pelunasan via Riwayat Hari Ini",
      });
      await updateDebt(customerId, -payConfirm.totalAmount);

      // Jika hutang lunas, tandai semua transaksi kasbon yang belum lunas
      const updatedCustomer = useCustomerStore.getState().getCustomerById(customerId);
      const remainingDebt = Math.max(0, (updatedCustomer?.currentDebt ?? 0) - payConfirm.totalAmount);
      if (remainingDebt <= 0) {
        const debtTxns = useTransactionStore
          .getState()
          .getTransactionsByCustomer(customerId)
          .filter((t) => t.paymentMethod === "kasbon" && t.status === "debt");
        for (const txn of debtTxns) {
          await useTransactionStore.getState().updateTransactionStatus(txn.id, "paid");
        }
      }

      toast("Kasbon berhasil dilunasi.", "success");
      setPayConfirm(null);
    } catch {
      toast("Gagal melunasi kasbon.", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={variant === "sheet" ? "p-4" : ""}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-label-xl font-bold text-on-surface">Riwayat Hari Ini</h3>
        <span className="text-caption text-on-surface-variant">{rows.length} transaksi</span>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-md border border-border-standard bg-card pl-10 pr-4 text-body-sm outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-4 focus:ring-secondary/15"
          placeholder="Cari No. nota atau pelanggan..."
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-label-md text-on-surface-variant/60">
          {search ? "Tidak ditemukan" : "Belum ada transaksi hari ini"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((t) => {
            const customer = t.customerId ? getCustomerById(t.customerId) : null;
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id}>
                <div
                  onClick={() => setExpandedId(isOpen ? null : t.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-container active:bg-surface-container-high"
                >
                  <span className="min-w-[44px] text-caption text-on-surface-variant">
                    {formatTime(t.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-bold text-on-surface">
                      {t.receiptNumber || "—"}
                    </p>
                    {customer && (
                      <p className="truncate text-caption text-on-surface-variant">{customer.name}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-body-sm font-bold text-on-surface">{formatCurrency(t.totalAmount)}</p>
                    <StatusBadge
                      label={t.paymentMethod === "cash" ? "Tunai" : t.paymentMethod === "kasbon" ? "Kasbon" : "QRIS"}
                      variant={t.paymentMethod === "cash" ? "success" : t.paymentMethod === "kasbon" ? "warning" : "info"}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="mx-2 mb-1.5 space-y-2 rounded-md bg-surface-container-low p-3 text-body-sm">
                    {t.items.map((item, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <span className="min-w-0 flex-1 truncate text-on-surface">{item.name}</span>
                        <span className="ml-2 shrink-0 text-on-surface-variant">
                          {item.quantity}x {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border-standard pt-2 font-bold text-on-surface">
                      <span>Total</span>
                      <span>{formatCurrency(t.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-standard pt-2">
                      <ReprintButton transaction={t} />
                      {t.paymentMethod === "kasbon" && t.status === "debt" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayConfirm(t);
                          }}
                          className="h-10 rounded-md bg-success px-4 text-label-md font-semibold text-white transition-all active:scale-[0.98]"
                        >
                          Lunasi
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={payConfirm !== null}
        onOpenChange={(o) => !o && setPayConfirm(null)}
        title="Lunasi Kasbon"
        description={
          payConfirm
            ? `Lunasi kasbon sebesar ${formatCurrency(payConfirm.totalAmount)}?`
            : ""
        }
        confirmLabel={paying ? "Memproses..." : "Lunasi"}
        variant="default"
        onConfirm={handlePayDebt}
      />
    </div>
  );
}
