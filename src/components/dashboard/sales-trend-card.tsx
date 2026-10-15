"use client";

import { useMemo, useState } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useShallow } from "zustand/react/shallow";
import { formatCurrencyCompact, formatDateShort } from "@/lib/formatters";
import { buildSalesSeries, growthPercent } from "@/lib/period-metrics";
import ChartCard from "@/components/shared/chart-card";
import LineChart from "@/components/laporan/line-chart";
import { SkeletonText } from "@/components/shared/skeleton";
import { Icon } from "@/lib/icon-map";

const DAY_OPTIONS = [
  { label: "7 Hari", days: 7 },
  { label: "30 Hari", days: 30 },
  { label: "90 Hari", days: 90 },
] as const;

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function SalesTrendCard() {
  const transactions = useTransactionStore(useShallow((s) => s.transactions));
  const loading = useTransactionStore((s) => s.loading);
  const [days, setDays] = useState<number>(7);

  const series = useMemo(
    () => buildSalesSeries(transactions, days),
    [transactions, days]
  );

  const chartData = useMemo(
    () =>
      series.map((p) => {
        const d = new Date(`${p.date}T00:00:00`);
        return {
          label: `${formatDateShort(p.date)} (${DAY_LABELS[d.getDay()]})`,
          value: p.value,
        };
      }),
    [series]
  );

  const stats = useMemo(() => {
    const values = series.map((p) => p.value);
    const total = values.reduce((s, v) => s + v, 0);
    const nonZero = values.filter((v) => v > 0);
    const highest = nonZero.length > 0 ? Math.max(...nonZero) : 0;
    const avg = nonZero.length > 0 ? Math.round(total / nonZero.length) : 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2)).reduce((s, v) => s + v, 0);
    const secondHalf = values.slice(Math.floor(values.length / 2)).reduce((s, v) => s + v, 0);
    const growth = growthPercent(secondHalf, firstHalf);
    const bestIndex = values.indexOf(highest);
    return { highest, avg, growth, bestDate: bestIndex >= 0 ? series[bestIndex].date : null };
  }, [series]);

  const hasData = chartData.some((d) => d.value > 0);

  return (
    <ChartCard
      title="Tren Penjualan"
      subtitle="Pendapatan harian yang dihitung dari transaksi lunas"
      actions={
        <div className="flex gap-1 rounded-md bg-surface-container p-1">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`rounded-md px-3 py-1.5 text-label-md font-semibold transition-all active:scale-95 ${
                days === opt.days
                  ? "bg-card text-secondary shadow-card"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              aria-pressed={days === opt.days}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <SkeletonText lines={5} />
      ) : !hasData ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-on-surface-variant/60">
          <Icon name="trending_up" size={40} />
          <p className="text-body-md">Belum ada penjualan {days} hari terakhir</p>
        </div>
      ) : (
        <>
          <LineChart data={chartData} />
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border-standard pt-4">
            <div>
              <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Hari Tertinggi</p>
              <p className="mt-0.5 text-label-md font-bold text-on-surface">
                {stats.bestDate ? formatDateShort(stats.bestDate) : "—"}
              </p>
              <p className="text-caption text-on-surface-variant">{formatCurrencyCompact(stats.highest)}</p>
            </div>
            <div>
              <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Rata-rata / Hari</p>
              <p className="mt-0.5 text-label-md font-bold text-on-surface">
                {formatCurrencyCompact(stats.avg)}
              </p>
            </div>
            <div>
              <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Pertumbuhan</p>
              <p
                className={`mt-0.5 text-label-md font-bold ${
                  stats.growth === null
                    ? "text-on-surface-variant"
                    : stats.growth >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {stats.growth === null ? "—" : `${stats.growth >= 0 ? "▲" : "▼"} ${Math.abs(stats.growth)}%`}
              </p>
              <p className="text-caption text-on-surface-variant">paruh 1 vs paruh 2</p>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}
