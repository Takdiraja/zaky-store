"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

interface Props {
  /** Period income (reported sales). */
  income: number;
  /** Period expenses. */
  expense: number;
  /** Net profit = gross profit − expenses. */
  netProfit: number;
  /** Net margin % (0–100). */
  margin: number;
}

/**
 * Compact single-card financial summary (income / expense / net / margin)
 * for the Dashboard — replaces four separate stat cards.
 */
export default function FinancialSummaryCard({ income, expense, netProfit, margin }: Props) {
  return (
    <section className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
            <Icon name="account_balance_wallet" size={20} />
          </span>
          <h4 className="text-label-xl font-bold text-on-surface">Ringkasan Keuangan</h4>
        </div>
        <Link
          href="/laporan"
          className="text-label-md font-semibold text-secondary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Pemasukan</p>
          <p className="mt-0.5 text-numeric-display font-bold tracking-tight text-on-surface">
            {formatCurrency(income)}
          </p>
        </div>
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Pengeluaran</p>
          <p className="mt-0.5 text-numeric-display font-bold tracking-tight text-danger">
            {formatCurrency(expense)}
          </p>
        </div>
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Laba Bersih</p>
          <p
            className={cn(
              "mt-0.5 text-numeric-display font-bold tracking-tight",
              netProfit < 0 ? "text-danger" : "text-success"
            )}
          >
            {formatCurrency(netProfit)}
          </p>
        </div>
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Margin</p>
          <p className="mt-0.5 text-numeric-display font-bold tracking-tight text-secondary">
            {margin}%
          </p>
        </div>
      </div>
    </section>
  );
}
