"use client";

import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import QuickFilter from "@/components/shared/quick-filter";
import { Icon } from "@/lib/icon-map";
import { useReportStore } from "@/stores/use-report-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useProductStore } from "@/stores/use-product-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import { useDigitalServiceStore } from "@/stores/use-digital-service-store";
import { getServiceConfig } from "@/lib/digital-services";
import { formatCurrency, formatDateShort, getTodayISO } from "@/lib/formatters";
import { PERIOD_LABELS } from "@/lib/constants";
import { exportToPDF } from "@/lib/export";
import LineChart from "@/components/laporan/line-chart";
import ChartCard from "@/components/shared/chart-card";
import PageHeader from "@/components/shared/page-header";
import KpiGrid from "@/components/shared/kpi-grid";
import KpiCard from "@/components/shared/kpi-card";
import InsightCard from "@/components/shared/insight-card";
import BusinessPerformanceCard from "@/components/laporan/business-performance-card";
import FinancialDetailsCard from "@/components/laporan/financial-details-card";
import TopProductsTable from "@/components/laporan/top-products-table";
import DigitalServicesReport from "@/components/laporan/digital-services-report";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateInsights } from "@/lib/insights";
import { useToast } from "@/components/shared/toast-provider";
import type { Transaction } from "@/types";
import {
  getDateRange,
  getDateOffsetFromISO,
  growthPercent,
  isReportedTransaction,
  sumExpensesInRange,
  toDateKey,
} from "@/lib/period-metrics";

/** Local-time YYYY-MM-DD stepping forward from `start`. */
function getDateOffsetISO(base: string, offsetDays: number): string {
  return getDateOffsetFromISO(base, offsetDays);
}

function generateChartData(
  start: string,
  end: string,
  transactions: Transaction[],
) {
  const days = Math.ceil(
    (new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000,
  );
  const numPoints = Math.min(days + 1, 30);
  return Array.from({ length: numPoints }, (_, i) => {
    const day = getDateOffsetISO(start, i);
    const value = transactions
      .filter((t) => toDateKey(t.date) === day)
      .reduce((sum, t) => sum + t.totalAmount, 0);
    return {
      label: formatDateShort(day),
      value,
    };
  });
}

export default function LaporanPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"goods" | "services">("goods");
  const period = useReportStore((s) => s.period);
  const customStart = useReportStore((s) => s.customStart);
  const customEnd = useReportStore((s) => s.customEnd);
  const getTransactionsByDateRange = useTransactionStore((s) => s.getTransactionsByDateRange);
  const getTopProducts = useTransactionStore((s) => s.getTopProducts);
  const transactions = useTransactionStore((s) => s.transactions);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const allProducts = useProductStore(useShallow((s) => s.products));
  const allCustomers = useCustomerStore(useShallow((s) => s.customers));
  const expenses = useExpenseStore((s) => s.expenses);

  const { start, end } = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const filteredTransactions = useMemo(
    () => getTransactionsByDateRange(start, end),
    [start, end, getTransactionsByDateRange]
  );

  // Unpaid QRIS is not yet revenue — exclude from sales metrics & charts.
  const reportedTransactions = useMemo(
    () => filteredTransactions.filter(isReportedTransaction),
    [filteredTransactions]
  );

  const totalSales = reportedTransactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = reportedTransactions.reduce((s, t) => s + t.totalProfit, 0);
  const totalCash = reportedTransactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalKasbon = reportedTransactions
    .filter((t) => t.paymentMethod === "kasbon")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalExpenses = sumExpensesInRange(expenses, start, end);
  const netProfit = totalProfit - totalExpenses;
  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // Growth vs previous equal-length period.
  const previousRange = useMemo(() => {
    const lenMs =
      new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
    const prevStart = new Date(`${start}T00:00:00`).getTime() - lenMs - 86400000;
    const fmt = (t: number) => new Date(t).toISOString().slice(0, 10);
    return { start: fmt(prevStart), end: fmt(new Date(`${start}T00:00:00`).getTime() - 86400000) };
  }, [start, end]);

  const previousSales = useMemo(() => {
    const s = new Date(`${previousRange.start}T00:00:00`).getTime();
    const e = new Date(`${previousRange.end}T00:00:00`).setHours(23, 59, 59, 999);
    return transactions
      .filter((t) => {
        const d = new Date(t.date).getTime();
        return d >= s && d <= e && isReportedTransaction(t);
      })
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }, [transactions, previousRange]);

  const growth = growthPercent(totalSales, previousSales);

  // Average transaction value.
  const avgTransaction = reportedTransactions.length > 0
    ? Math.round(totalSales / reportedTransactions.length)
    : 0;

  // Inventory value (harga beli × stok) of active products.
  const inventoryValue = useMemo(
    () => allProducts.filter((p) => p.isActive).reduce((s, p) => s + p.buyPrice * p.stock, 0),
    [allProducts]
  );

  // ── Capital summary (lifetime values, not period-scoped) ──
  const getCapitalBreakdown = useCapitalStore((s) => s.getCapitalBreakdown);
  const warungCapital = getCapitalBreakdown("warung");
  const digitalCapital = getCapitalBreakdown("digital_service");
  const initialCapital = warungCapital.initial + digitalCapital.initial;
  const additionCapital = warungCapital.addition + digitalCapital.addition;
  const withdrawalCapital = warungCapital.withdrawal + digitalCapital.withdrawal;
  const currentCapital = warungCapital.current + digitalCapital.current;
  const lifetimeProfit = transactions
    .filter(isReportedTransaction)
    .reduce((s, t) => s + t.totalProfit, 0);
  const lifetimeExpenses = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const lifetimeNetProfit = lifetimeProfit - lifetimeExpenses;
  // Lifetime digital-service profit = Σ service fees (the warung's income
  // from the digital-services business line).
  const lifetimeDigitalProfit = useDigitalServiceStore(
    (s) => s.transactions,
  ).reduce((s, t) => s + t.serviceFee, 0);
  const combinedLifetimeProfit = lifetimeNetProfit + lifetimeDigitalProfit;
  const breakEvenPercent =
    currentCapital > 0 ? (combinedLifetimeProfit / currentCapital) * 100 : 0;
  const remainingCapital = currentCapital - combinedLifetimeProfit;

  // ── Cash flow (period-scoped) ──
  const debtPayments = useDebtPaymentStore((s) => s.payments);
  const kasbonIn = useMemo(() => {
    const s = new Date(`${start}T00:00:00`).getTime();
    const e = new Date(`${end}T00:00:00`).setHours(23, 59, 59, 999);
    return debtPayments
      .filter((p) => {
        const d = new Date(p.paymentDate).getTime();
        return d >= s && d <= e;
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }, [debtPayments, start, end]);

  // ── Charts ──
  const salesChartData = useMemo(
    () => generateChartData(start, end, reportedTransactions),
    [start, end, reportedTransactions]
  );
  const profitChartData = useMemo(
    () =>
      generateChartData(start, end, reportedTransactions).map((p, i) => {
        const day = getDateOffsetISO(start, i);
        const value = reportedTransactions
          .filter((t) => toDateKey(t.date) === day)
          .reduce((sum, t) => sum + t.totalProfit, 0);
        return { label: p.label, value };
      }),
    [start, end, reportedTransactions]
  );
  const expenseChartData = useMemo(() => {
    const days = Math.ceil(
      (new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000,
    );
    const numPoints = Math.min(days + 1, 30);
    return Array.from({ length: numPoints }, (_, i) => {
      const day = getDateOffsetISO(start, i);
      const value = expenses
        .filter((e) => e.expenseDate.startsWith(day) || toDateKey(e.expenseDate) === day)
        .reduce((sum, e) => sum + e.totalAmount, 0);
      return { label: formatDateShort(day), value };
    });
  }, [start, end, expenses]);

  const topProducts = useMemo(
    () => getTopProducts(start, end),
    [start, end, getTopProducts]
  );

  // ── Digital services summary (separate revenue stream) ──
  const getDigitalByDateRange = useDigitalServiceStore(
    (s) => s.getTransactionsByDateRange,
  );
  const digitalServiceSummary = useMemo(() => {
    const periodTx = getDigitalByDateRange(start, end);
    const byServiceMap = new Map<string, { label: string; revenue: number; profit: number; count: number }>();
    for (const t of periodTx) {
      const cfg = getServiceConfig(t.serviceType);
      const row = byServiceMap.get(t.serviceType) ?? { label: cfg.label, revenue: 0, profit: 0, count: 0 };
      row.revenue += t.totalAmount;
      row.profit += t.serviceFee;
      row.count += 1;
      byServiceMap.set(t.serviceType, row);
    }
    return {
      totalRevenue: periodTx.reduce((s, t) => s + t.totalAmount, 0),
      totalFees: periodTx.reduce((s, t) => s + t.serviceFee, 0),
      totalProfit: periodTx.reduce((s, t) => s + t.serviceFee, 0),
      transactionCount: periodTx.length,
      byService: Array.from(byServiceMap.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }, [getDigitalByDateRange, start, end]);

  // Cash advance (kasbon) summary for the PDF.
  const kasbonTxns = filteredTransactions.filter((t) => t.paymentMethod === "kasbon");
  const activeKasbonTxns = kasbonTxns.filter((t) => t.status === "debt");
  const paidKasbonTxns = kasbonTxns.filter((t) => t.status === "paid");
  const cashAdvanceSummary = {
    activeCount: activeKasbonTxns.length,
    activeTotal: activeKasbonTxns.reduce((s, t) => s + t.totalAmount, 0),
    paidCount: paidKasbonTxns.length,
    paidTotal: paidKasbonTxns.reduce((s, t) => s + t.totalAmount, 0),
  };

  const filteredExpenses = expenses
    .filter((e) => e.expenseDate >= start && e.expenseDate <= end)
    .sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));

  const insightList = useMemo(
    () =>
      generateInsights({
        transactions,
        products: allProducts,
        customers: allCustomers,
        expenses,
        todayISO: getTodayISO(),
      }),
    [transactions, allProducts, allCustomers, expenses],
  );

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportToPDF({
        periodLabel: PERIOD_LABELS[period] || period,
        startDate: start,
        endDate: end,
        totalSales,
        totalProfit,
        totalExpenses,
        totalCash,
        totalKasbon,
        transactionCount: reportedTransactions.length,
        topProducts,
        cashAdvanceSummary,
        capitalSummary: {
          warungCapital,
          digitalCapital,
          initialCapital,
          additionCapital,
          withdrawalCapital,
          currentCapital,
          netProfit: lifetimeNetProfit,
          breakEvenPercent,
          remainingCapital,
        },
        digitalServiceSummary,
        transactions: filteredTransactions.map((t) => ({
          receiptNumber: t.receiptNumber,
          date: t.date,
          customerName: t.customerId
            ? getCustomerById(t.customerId)?.name ?? null
            : null,
          paymentMethod: t.paymentMethod,
          status: t.status === "paid" ? "Lunas" : "Belum Lunas",
          totalAmount: t.totalAmount,
        })),
        expenses: filteredExpenses.map((e) => ({
          expenseNumber: e.expenseNumber,
          expenseDate: e.expenseDate,
          title: e.title,
          totalAmount: e.totalAmount,
        })),
      });
      toast("Laporan berhasil diexport.", "success");
    } catch {
      toast("Gagal mengexport laporan.", "error");
    } finally {
      setExporting(false);
    }
  };

  const chartHasData = salesChartData.some((d) => d.value > 0);

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Laporan"
        subtitle={`Periode: ${PERIOD_LABELS[period] || period}`}
        actions={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-secondary px-5 font-semibold text-white shadow-fab transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <Icon name="picture_as_pdf" size={18} />
            {exporting ? "Mengexport…" : "Export PDF"}
          </button>
        }
      />

      <QuickFilter />

      {/* Report category tabs — goods sales vs digital services */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "goods" | "services")}>
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="goods" className="h-11 flex-1 gap-2">
            <Icon name="shopping_bag" size={18} />
            Penjualan Barang
          </TabsTrigger>
          <TabsTrigger value="services" className="h-11 flex-1 gap-2">
            <Icon name="smartphone" size={18} />
            Layanan Digital
          </TabsTrigger>
        </TabsList>

        {/* ===== GOODS SALES REPORT ===== */}
        <TabsContent value="goods" className="space-y-5 pt-5">
          {/* Section 1 — Summary KPIs */}
          <KpiGrid>
            <KpiCard
              label="Pendapatan"
              value={formatCurrency(totalSales)}
              icon="payments"
              tone="info"
              footer={PERIOD_LABELS[period] || period}
            />
            <KpiCard
              label="Laba Kotor"
              value={formatCurrency(totalProfit)}
              icon="trending_up"
              tone="success"
              footer="Penjualan − HPP"
            />
            <KpiCard
              label="Pengeluaran"
              value={formatCurrency(totalExpenses)}
              icon="receipt_long"
              tone="warning"
              footer={`${filteredExpenses.length} pengeluaran`}
            />
            <KpiCard
              label="Laba Bersih"
              value={formatCurrency(netProfit)}
              icon="account_balance_wallet"
              tone={netProfit < 0 ? "danger" : "default"}
              footer="Laba Kotor − Pengeluaran"
            />
          </KpiGrid>

          {/* Section 2 — Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Tren Penjualan" legend={<LegendLabel label="Pendapatan" />}>
              <LineChart data={salesChartData} />
              {chartHasData && (
                <div className="mt-2 flex justify-between overflow-hidden">
                  {salesChartData.map((point, i) => (
                    <span key={i} className="truncate text-caption text-on-surface-variant">
                      {point.label}
                    </span>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title="Tren Laba" legend={<LegendLabel label="Laba kotor" color="var(--color-success)" />}>
              <LineChart
                data={profitChartData}
                color="var(--color-success)"
                formatValue={(v) => formatCurrency(v)}
              />
              {profitChartData.some((d) => d.value > 0) && (
                <div className="mt-2 flex justify-between overflow-hidden">
                  {profitChartData.map((point, i) => (
                    <span key={i} className="truncate text-caption text-on-surface-variant">
                      {point.label}
                    </span>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title="Tren Pengeluaran" legend={<LegendLabel label="Biaya" color="var(--color-danger)" />}>
              <LineChart
                data={expenseChartData}
                color="var(--color-danger)"
                formatValue={(v) => formatCurrency(v)}
              />
              {expenseChartData.some((d) => d.value > 0) && (
                <div className="mt-2 flex justify-between overflow-hidden">
                  {expenseChartData.map((point, i) => (
                    <span key={i} className="truncate text-caption text-on-surface-variant">
                      {point.label}
                    </span>
                  ))}
                </div>
              )}
            </ChartCard>

            {/* Margin gauge */}
            <ChartCard title="Margin Laba">
              {totalSales === 0 ? (
                <div className="flex h-64 items-center justify-center text-body-md text-on-surface-variant/60">
                  Belum ada data penjualan
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative size-44">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" fill="transparent" r="40" stroke="var(--color-border-standard)" strokeWidth="12" />
                      <circle
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="var(--color-secondary)"
                        strokeDasharray={`${profitMargin * 2.51}, 251`}
                        strokeWidth="12"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-on-surface">{profitMargin}%</span>
                      <span className="text-caption text-on-surface-variant">Margin Bersih</span>
                    </div>
                  </div>
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full bg-secondary" />
                        <span className="text-label-md text-on-surface">Laba Bersih</span>
                      </div>
                      <span className="text-label-md font-semibold text-on-surface">{profitMargin}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full bg-surface-container-high" />
                        <span className="text-label-md text-on-surface-variant">Biaya (Modal + Pengeluaran)</span>
                      </div>
                      <span className="text-label-md font-semibold text-on-surface-variant">{100 - profitMargin}%</span>
                    </div>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          {/* Section 3 — Business Performance */}
          <BusinessPerformanceCard
            data={{
              margin: profitMargin,
              growth,
              averageTransaction: avgTransaction,
              inventoryValue,
            }}
          />

          {/* Section 4 — Financial Details (capital + cash flow) */}
          <FinancialDetailsCard
            data={{
              warungCapital,
              digitalCapital,
              initialCapital,
              additionCapital,
              withdrawalCapital,
              currentCapital,
              lifetimeNetProfit,
              breakEvenPercent,
              remainingCapital,
              cashFlow: {
                cashIn: totalCash,
                cashOut: totalExpenses,
                kasbonOut: totalKasbon,
                kasbonIn,
              },
            }}
          />

          {/* Wawasan Bisnis — full analytical list */}
          <InsightCard insights={insightList} />

          {/* Section 5 — Best Selling Products */}
          <TopProductsTable transactions={reportedTransactions} />
        </TabsContent>

        {/* ===== DIGITAL SERVICES REPORT ===== */}
        <TabsContent value="services" className="pt-5">
          <DigitalServicesReport start={start} end={end} />
        </TabsContent>
      </Tabs>
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
