"use client";

import { useMemo } from "react";
import { useDigitalServiceStore } from "@/stores/use-digital-service-store";
import { getServiceConfig, getSubServiceLabel } from "@/lib/digital-services";
import { formatCurrency, formatDateShort } from "@/lib/formatters";
import { getDateOffsetFromISO, toDateKey } from "@/lib/period-metrics";
import { Icon } from "@/lib/icon-map";
import ChartCard from "@/components/shared/chart-card";
import LineChart from "@/components/laporan/line-chart";
import EmptyState from "@/components/shared/empty-state";
import type { DigitalServiceTransaction } from "@/types";

interface Props {
  start: string;
  end: string;
}

interface ServiceRow {
  serviceType: string;
  label: string;
  icon: string;
  revenue: number;
  nominal: number;
  profit: number;
  count: number;
}

/**
 * Digital Services report — fully separated from goods sales. Metrics:
 * revenue (total paid), nominal (face value), profit (= service fee
 * income), and transaction count, plus a daily revenue trend and a
 * per-service breakdown. Never touches inventory/profit figures.
 */
export default function DigitalServicesReport({ start, end }: Props) {
  const transactions = useDigitalServiceStore((s) => s.transactions);

  const periodTx = useMemo(() => {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    endDate.setHours(23, 59, 59, 999);
    return transactions.filter((t) => {
      const d = new Date(`${toDateKey(t.transactionDate)}T00:00:00`);
      return d >= startDate && d <= endDate;
    });
  }, [transactions, start, end]);

  const totalRevenue = periodTx.reduce((s, t) => s + t.totalAmount, 0);
  const totalNominal = periodTx.reduce((s, t) => s + t.nominalAmount, 0);
  const totalProfit = periodTx.reduce((s, t) => s + t.serviceFee, 0);
  const count = periodTx.length;
  const avgTransaction = count > 0 ? Math.round(totalRevenue / count) : 0;

  // Per-service aggregation (profit = service fee income).
  const byService = useMemo(() => {
    const map = new Map<string, ServiceRow>();
    for (const t of periodTx) {
      const cfg = getServiceConfig(t.serviceType);
      const row = map.get(t.serviceType) ?? {
        serviceType: t.serviceType,
        label: cfg.label,
        icon: cfg.icon,
        revenue: 0,
        nominal: 0,
        profit: 0,
        count: 0,
      };
      row.revenue += t.totalAmount;
      row.nominal += t.nominalAmount;
      row.profit += t.serviceFee;
      row.count += 1;
      map.set(t.serviceType, row);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [periodTx]);

  // Daily revenue trend.
  const trend = useMemo(() => {
    const days = Math.ceil(
      (new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) /
        86400000,
    );
    const numPoints = Math.min(days + 1, 30);
    return Array.from({ length: numPoints }, (_, i) => {
      const day = getDateOffsetFromISO(start, i);
      const value = periodTx
        .filter((t) => toDateKey(t.transactionDate) === day)
        .reduce((sum, t) => sum + t.totalAmount, 0);
      return { label: formatDateShort(day), value };
    });
  }, [periodTx, start, end]);

  return (
    <div className="space-y-5">
      {/* KPI grid — services only, profit = service fee */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiStat
          label="Pendapatan Layanan"
          value={formatCurrency(totalRevenue)}
          icon="payments"
          tone="info"
        />
        <KpiStat
          label="Laba Layanan"
          value={formatCurrency(totalProfit)}
          icon="trending_up"
          tone="success"
          footer="Dari biaya layanan"
        />
        <KpiStat
          label="Nominal"
          value={formatCurrency(totalNominal)}
          icon="account_balance_wallet"
          tone="default"
        />
        <KpiStat
          label="Transaksi"
          value={String(count)}
          icon="receipt_long"
          tone="warning"
          footer={count > 0 ? `Rata-rata ${formatCurrency(avgTransaction)}` : undefined}
        />
      </div>

      {count === 0 ? (
        <EmptyState
          icon="smartphone"
          title="Belum ada transaksi layanan digital"
          description="Transaksi layanan pada periode ini akan muncul di sini."
        />
      ) : (
        <>
          {/* Trend chart */}
          <ChartCard title="Tren Pendapatan Layanan" legend={<LegendLabel label="Pendapatan" />}>
            <LineChart
              data={trend}
              formatValue={(v) => formatCurrency(v)}
            />
            {trend.some((d) => d.value > 0) && (
              <div className="mt-2 flex justify-between overflow-hidden">
                {trend.map((point, i) => (
                  <span key={i} className="truncate text-caption text-on-surface-variant">
                    {point.label}
                  </span>
                ))}
              </div>
            )}
          </ChartCard>

          {/* Per-service breakdown with profit */}
          <ChartCard title="Rincian per Layanan">
            <div className="space-y-2">
              {byService.map((s) => (
                <div
                  key={s.serviceType}
                  className="flex items-center justify-between rounded-md border border-border-standard bg-card px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                      <Icon name={s.icon} size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-on-surface">
                        {s.label}
                      </p>
                      <p className="text-caption text-on-surface-variant">
                        {s.count}x · Nominal {formatCurrency(s.nominal)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-body-sm font-bold text-on-surface">
                      {formatCurrency(s.revenue)}
                    </p>
                    <p className="text-caption font-semibold text-success">
                      Laba {formatCurrency(s.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Transaction list */}
          <ServiceTransactionList transactions={periodTx} />
        </>
      )}
    </div>
  );
}

/** Recent digital-service transactions in the period. */
function ServiceTransactionList({
  transactions,
}: {
  transactions: DigitalServiceTransaction[];
}) {
  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) =>
        b.transactionDate.localeCompare(a.transactionDate),
      ),
    [transactions],
  );

  return (
    <ChartCard title={`Transaksi Layanan (${sorted.length})`}>
      {sorted.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-body-md text-on-surface-variant/60">
          Belum ada transaksi
        </div>
      ) : (
        <ul className="divide-y divide-border-standard">
          {sorted.slice(0, 10).map((t) => {
            const cfg = getServiceConfig(t.serviceType);
            const subServiceLabel = getSubServiceLabel(t.serviceType, t.subService);
            return (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                  <Icon name={cfg.icon} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-semibold text-on-surface">
                    {cfg.label}
                    {subServiceLabel ? ` · ${subServiceLabel}` : ""}
                  </p>
                  <p className="truncate font-mono text-caption text-on-surface-variant">
                    {t.transactionNumber} · {t.customerIdentifier}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-body-sm font-semibold text-on-surface">
                    {formatCurrency(t.totalAmount)}
                  </p>
                  <p className="text-caption font-semibold text-success">
                    Laba {formatCurrency(t.serviceFee)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}

function KpiStat({
  label,
  value,
  icon,
  tone,
  footer,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "default" | "success" | "warning" | "danger" | "info";
  footer?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-surface-container text-on-surface-variant",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
  };
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-standard bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
          {label}
        </span>
        <span className={`flex size-9 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="text-xl font-bold tracking-tight tabular-nums text-on-surface">
        {value}
      </div>
      {footer && <div className="text-caption text-on-surface-variant">{footer}</div>}
    </div>
  );
}

function LegendLabel({ label, color = "var(--color-secondary)" }: { label: string; color?: string }) {
  return (
    <span className="flex items-center gap-2 text-caption text-on-surface-variant">
      <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
