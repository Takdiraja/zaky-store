"use client";

import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface CashFlowData {
  /** Cash sales received in the period. */
  cashIn: number;
  /** Expenses paid out in the period. */
  cashOut: number;
  /** Kasbon (credit) sales issued in the period. */
  kasbonOut: number;
  /** Debt payments collected in the period. */
  kasbonIn: number;
}

export interface CapitalCategorySummary {
  initial: number;
  addition: number;
  withdrawal: number;
  current: number;
}

export interface FinancialDetailsData {
  /** Warung Capital lifecycle (goods business line). */
  warungCapital: CapitalCategorySummary;
  /** Digital Services Capital lifecycle (services business line). */
  digitalCapital: CapitalCategorySummary;
  /** Modal Awal (initial capital, combined). */
  initialCapital: number;
  /** Penambahan Modal (additions, combined). */
  additionCapital: number;
  /** Penarikan Modal (withdrawals, combined). */
  withdrawalCapital: number;
  /** Total Modal Aktif (current capital, combined). */
  currentCapital: number;
  /** Cumulative net profit (lifetime). */
  lifetimeNetProfit: number;
  /** Break-even progress % (0-100+). */
  breakEvenPercent: number;
  /** Remaining capital until break-even. */
  remainingCapital: number;
  cashFlow: CashFlowData;
}

interface Props {
  data: FinancialDetailsData;
}

/**
 * Reports "Financial Details" block: capital history, break-even progress,
 * remaining capital, and a period cash-flow summary.
 */
export default function FinancialDetailsCard({ data }: Props) {
  const isBreakEven = data.breakEvenPercent >= 100;

  const capitalCells = [
    { label: "Modal Awal", value: data.initialCapital },
    { label: "Penambahan", value: data.additionCapital, valueClass: "text-success" },
    { label: "Penarikan", value: data.withdrawalCapital, valueClass: "text-danger" },
    { label: "Modal Aktif", value: data.currentCapital, valueClass: "text-secondary" },
  ];

  const cashFlowRows = [
    { label: "Kas Masuk (Tunai)", value: data.cashFlow.cashIn, valueClass: "text-success" },
    { label: "Kas Keluar (Pengeluaran)", value: data.cashFlow.cashOut, valueClass: "text-danger" },
    { label: "Kasbon Keluar (Kredit)", value: data.cashFlow.kasbonOut, valueClass: "text-warning" },
    { label: "Kasbon Masuk (Pelunasan)", value: data.cashFlow.kasbonIn, valueClass: "text-success" },
  ];

  const categoryRows = [
    {
      label: "Warung Capital",
      sub: "Untuk dagang barang",
      value: data.warungCapital.current,
      valueClass: "text-on-surface",
    },
    {
      label: "Digital Services Capital",
      sub: "Untuk layanan digital",
      value: data.digitalCapital.current,
      valueClass: "text-secondary",
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-border-standard bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border-standard px-5 py-4">
        <h4 className="text-label-xl font-bold text-on-surface">Detail Keuangan</h4>
        <span className="text-caption text-on-surface-variant">Modal: seumur hidup</span>
      </div>

      {/* Capital */}
      <div className="grid grid-cols-2 gap-px bg-border-standard md:grid-cols-4">
        {capitalCells.map((cell) => (
          <div key={cell.label} className="bg-card p-5">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              {cell.label}
            </p>
            <p className={cn("mt-1 text-numeric-display font-bold text-on-surface", cell.valueClass)}>
              {formatCurrency(cell.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Capital categories */}
      <div className="grid grid-cols-1 gap-px bg-border-standard md:grid-cols-2">
        {categoryRows.map((row) => (
          <div key={row.label} className="bg-surface-container-low p-5">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              {row.label}
            </p>
            <p className={cn("mt-1 text-numeric-display font-bold text-on-surface", row.valueClass)}>
              {formatCurrency(row.value)}
            </p>
            <p className="mt-0.5 text-caption text-on-surface-variant">{row.sub}</p>
          </div>
        ))}
      </div>

      {/* Break-even */}
      <div className="grid grid-cols-1 gap-6 border-t border-border-standard px-5 py-5 md:grid-cols-3">
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
            Laba Bersih (Kumulatif)
          </p>
          <p className={cn("mt-1 text-numeric-display font-bold", data.lifetimeNetProfit < 0 ? "text-danger" : "text-secondary")}>
            {formatCurrency(data.lifetimeNetProfit)}
          </p>
        </div>
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
            Progres Balik Modal
          </p>
          <p className="mt-1 text-numeric-display font-bold text-on-surface">
            {Math.round(data.breakEvenPercent)}%
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className={cn("h-full rounded-full", isBreakEven ? "bg-success" : "bg-secondary")}
              style={{ width: `${Math.min(data.breakEvenPercent, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
            Sisa Modal
          </p>
          <p className={cn("mt-1 text-numeric-display font-bold", data.remainingCapital < 0 ? "text-danger" : "text-on-surface")}>
            {formatCurrency(data.remainingCapital)}
          </p>
          {isBreakEven ? (
            <p className="mt-1 text-caption font-bold text-success">✅ Sudah Balik Modal</p>
          ) : (
            <p className="mt-1 text-caption text-on-surface-variant">
              Perlu {formatCurrency(data.remainingCapital)} lagi untuk balik modal
            </p>
          )}
        </div>
      </div>

      {/* Cash flow */}
      <div className="border-t border-border-standard px-5 py-5">
        <p className="mb-3 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
          Arus Kas Periode Ini
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
          {cashFlowRows.map((row) => (
            <div key={row.label}>
              <p className="text-caption text-on-surface-variant">{row.label}</p>
              <p className={cn("mt-0.5 text-label-md font-bold text-on-surface", row.valueClass)}>
                {formatCurrency(row.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
