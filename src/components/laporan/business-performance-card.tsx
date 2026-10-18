"use client";

import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface BusinessPerformanceData {
  /** Net profit margin % (0–100). */
  margin: number;
  /** Growth % vs the previous period — null when no prior baseline. */
  growth: number | null;
  /** Average transaction value in the period. */
  averageTransaction: number;
  /** Inventory value = Σ buyPrice × stock across active products. */
  inventoryValue: number;
}

interface Props {
  data: BusinessPerformanceData;
}

/**
 * Reports "Business Performance" block: margin, growth, average
 * transaction, and inventory value in a single compact grid.
 */
export default function BusinessPerformanceCard({ data }: Props) {
  const items = [
    {
      label: "Margin",
      value: `${data.margin}%`,
      sub: "Laba bersih ÷ penjualan",
    },
    {
      label: "Pertumbuhan",
      value:
        data.growth === null
          ? "—"
          : `${data.growth >= 0 ? "▲" : "▼"} ${Math.abs(data.growth)}%`,
      valueClass: data.growth === null ? "" : data.growth >= 0 ? "text-success" : "text-danger",
      sub: "vs periode sebelumnya",
    },
    {
      label: "Rata-rata Transaksi",
      value: formatCurrency(data.averageTransaction),
      sub: "per transaksi lunas",
    },
    {
      label: "Nilai Inventori",
      value: formatCurrency(data.inventoryValue),
      sub: "harga beli × stok",
    },
  ];

  return (
    <section className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
      <div className="mb-4">
        <h4 className="text-label-xl font-bold text-on-surface">Kinerja Bisnis</h4>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              {item.label}
            </p>
            <p className={cn("mt-0.5 text-numeric-display font-bold tracking-tight text-on-surface", item.valueClass)}>
              {item.value}
            </p>
            <p className="mt-0.5 text-caption text-on-surface-variant">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
