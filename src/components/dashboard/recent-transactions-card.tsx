"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useShallow } from "zustand/react/shallow";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import StatusBadge from "@/components/shared/status-badge";
import { SkeletonList } from "@/components/shared/skeleton";

const METHOD_BADGE: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  cash: { label: "Tunai", variant: "success" },
  kasbon: { label: "Kasbon", variant: "warning" },
  qris: { label: "QRIS", variant: "info" },
};

/**
 * Latest 3 transactions — product, time, status, amount — with a
 * "View All" link to the transaction history.
 */
export default function RecentTransactionsCard() {
  const transactions = useTransactionStore(useShallow((s) => s.transactions));
  const loading = useTransactionStore((s) => s.loading);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);

  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [transactions]);

  return (
    <section className="rounded-lg border border-border-standard bg-card shadow-card">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
            <Icon name="receipt_long" size={20} />
          </span>
          <h4 className="text-label-xl font-bold text-on-surface">Transaksi Terbaru</h4>
        </div>
        <Link
          href="/transaksi"
          className="text-label-md font-semibold text-secondary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      {loading ? (
        <div className="p-5">
          <SkeletonList count={3} />
        </div>
      ) : recent.length === 0 ? (
        <p className="py-10 text-center text-body-sm text-on-surface-variant/70">
          Belum ada transaksi tercatat.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border-standard">
          {recent.map((t) => {
            const badge = METHOD_BADGE[t.paymentMethod] ?? METHOD_BADGE.cash;
            const customer = t.customerId ? getCustomerById(t.customerId) : null;
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-bold text-on-surface">
                    {t.items[0]?.name ?? "—"}
                    {t.items.length > 1 ? ` +${t.items.length - 1} lainnya` : ""}
                  </p>
                  <p className="mt-0.5 text-caption text-on-surface-variant">
                    {formatTime(t.date)}
                    {customer ? ` · ${customer.name}` : ""}
                  </p>
                </div>
                <StatusBadge
                  label={t.status === "paid" ? "Lunas" : "Belum Lunas"}
                  variant={t.status === "paid" ? "success" : "warning"}
                  className="hidden sm:inline-flex"
                />
                <div className="shrink-0 text-right">
                  <p className="font-bold text-on-surface">{formatCurrency(t.totalAmount)}</p>
                  <p className="mt-0.5 text-caption text-on-surface-variant">{badge.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
