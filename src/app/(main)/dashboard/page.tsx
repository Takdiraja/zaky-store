"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { formatCurrency, getTodayISO } from "@/lib/formatters";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useProductStore } from "@/stores/use-product-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useReportStore } from "@/stores/use-report-store";
import { useDigitalServiceStore } from "@/stores/use-digital-service-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { generateInsights } from "@/lib/insights";
import { getDateRange, getDateOffsetISO, sumExpensesInRange, toDateKey } from "@/lib/period-metrics";
import { PERIOD_LABELS } from "@/lib/constants";
import DashboardGreeting from "@/components/dashboard/dashboard-greeting";
import QuickFilter from "@/components/shared/quick-filter";
import KpiGrid from "@/components/shared/kpi-grid";
import KpiCard from "@/components/shared/kpi-card";
import InsightStrip from "@/components/shared/insight-strip";
import FinancialSummaryCard from "@/components/dashboard/financial-summary-card";
import CapitalSummaryCard from "@/components/dashboard/capital-summary-card";
import SalesTrendCard from "@/components/dashboard/sales-trend-card";
import RecentTransactionsCard from "@/components/dashboard/recent-transactions-card";
import { SkeletonCard } from "@/components/shared/skeleton";

export default function DashboardPage() {
  const period = useReportStore((s) => s.period);
  const customStart = useReportStore((s) => s.customStart);
  const customEnd = useReportStore((s) => s.customEnd);

  const transactions = useTransactionStore(useShallow((s) => s.transactions));
  const txnLoading = useTransactionStore((s) => s.loading);
  const productsLoading = useProductStore((s) => s.loading);
  const expenses = useExpenseStore(useShallow((s) => s.expenses));
  const allProducts = useProductStore(useShallow((s) => s.products));
  const allCustomers = useCustomerStore(useShallow((s) => s.customers));

  const loading = txnLoading || productsLoading;

  // ── Period-scoped revenue & profit (unpaid QRIS excluded from revenue) ──
  const { start, end } = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const periodTransactions = useMemo(() => {
    const s = new Date(`${start}T00:00:00`).getTime();
    const e = new Date(`${end}T00:00:00`).setHours(23, 59, 59, 999);
    return transactions.filter((t) => {
      const d = new Date(t.date).getTime();
      return d >= s && d <= e;
    });
  }, [transactions, start, end]);

  const reported = useMemo(
    () => periodTransactions.filter((t) => !(t.paymentMethod === "qris" && t.status === "debt")),
    [periodTransactions]
  );

  const totalSales = reported.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = reported.reduce((s, t) => s + t.totalProfit, 0);
  const totalExpenses = sumExpensesInRange(expenses, start, end);

  // Digital-services period revenue & profit (service fees = profit).
  const digitalServices = useDigitalServiceStore((s) => s.transactions);
  const digitalPeriod = useMemo(() => {
    const s = new Date(`${start}T00:00:00`).getTime();
    const e = new Date(`${end}T00:00:00`).setHours(23, 59, 59, 999);
    const periodTx = digitalServices.filter((t) => {
      const d = new Date(`${toDateKey(t.transactionDate)}T00:00:00`).getTime();
      return d >= s && d <= e;
    });
    return {
      revenue: periodTx.reduce((sum, t) => sum + t.totalAmount, 0),
      profit: periodTx.reduce((sum, t) => sum + t.serviceFee, 0),
      count: periodTx.length,
    };
  }, [digitalServices, start, end]);

  const netProfit = totalProfit - totalExpenses + digitalPeriod.profit;
  const margin =
    totalSales + digitalPeriod.revenue > 0
      ? Math.round((netProfit / (totalSales + digitalPeriod.revenue)) * 100)
      : 0;
  const transactionCount = reported.length + digitalPeriod.count;

  // Capital (per category + combined, lifetime).
  const getCapitalBreakdown = useCapitalStore((s) => s.getCapitalBreakdown);
  const warungCapital = getCapitalBreakdown("warung").current;
  const digitalCapital = getCapitalBreakdown("digital_service").current;
  const currentCapital = warungCapital + digitalCapital;

  // ── Always-on overview numbers (today, local time) ──
  const todayISO = getTodayISO();
  const todayReport = useMemo(() => {
    const tx = transactions.filter(
      (t) => toDateKey(t.date) === todayISO && !(t.paymentMethod === "qris" && t.status === "debt")
    );
    return {
      totalSales: tx.reduce((s, t) => s + t.totalAmount, 0),
      transactionCount: tx.length,
    };
  }, [transactions, todayISO]);

  const yesterdayISO = getDateOffsetISO(1);

  const yesterdaySales = useMemo(
    () =>
      transactions
        .filter(
          (t) => toDateKey(t.date) === yesterdayISO && !(t.paymentMethod === "qris" && t.status === "debt")
        )
        .reduce((s, t) => s + t.totalAmount, 0),
    [transactions, yesterdayISO]
  );

  // ── Outstanding receivables & low stock (always today's view) ──
  const activeDebtTotal = useMemo(
    () => allCustomers.filter((c) => c.currentDebt > 0).reduce((s, c) => s + c.currentDebt, 0),
    [allCustomers]
  );
  const debtorCount = useMemo(() => allCustomers.filter((c) => c.currentDebt > 0).length, [allCustomers]);

  const lowStockProducts = useMemo(
    () => allProducts.filter((p) => p.isActive && p.stock <= p.minStock),
    [allProducts]
  );
  const criticalStockCount = useMemo(
    () => lowStockProducts.filter((p) => p.stock === 0).length,
    [lowStockProducts]
  );

  // ── Insights (from all data, not period-scoped) ──
  const insights = useMemo(
    () =>
      generateInsights({
        transactions,
        products: allProducts,
        customers: allCustomers,
        expenses,
        todayISO,
      }),
    [transactions, allProducts, allCustomers, expenses, todayISO]
  );

  // ── Sales delta vs yesterday (for the sales KPI pill) ──
  const salesDeltaPct = yesterdaySales > 0 ? Math.round(((todayReport.totalSales - yesterdaySales) / yesterdaySales) * 100) : null;

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Greeting + Quick Filter */}
      <DashboardGreeting />
      <QuickFilter compact />

      {/* 2. Primary KPIs — visible above the fold on phones */}
      {loading ? (
        <KpiGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </KpiGrid>
      ) : (
        <KpiGrid>
          <KpiCard
            label="Penjualan"
            value={formatCurrency(period === "today" ? todayReport.totalSales : totalSales)}
            icon="payments"
            tone="info"
            footer={
              period === "today"
                ? `${transactionCount} transaksi · ${salesDeltaPct === null ? "belum ada data kemarin" : `${salesDeltaPct >= 0 ? "▲" : "▼"} ${Math.abs(salesDeltaPct)}% vs kemarin`}`
                : `${PERIOD_LABELS[period] || period} · ${transactionCount} transaksi`
            }
          />
          <KpiCard
            label="Laba"
            value={formatCurrency(totalProfit)}
            icon="trending_up"
            tone="success"
            footer="Setelah HPP"
          />
          <KpiCard
            label="Piutang Aktif"
            value={formatCurrency(activeDebtTotal)}
            icon="menu_book"
            tone="warning"
            footer={`${debtorCount} pelanggan berhutang`}
          />
          <KpiCard
            label="Stok Menipis"
            value={`${lowStockProducts.length} produk`}
            icon="inventory_2"
            tone={criticalStockCount > 0 ? "danger" : "warning"}
            footer={criticalStockCount > 0 ? `${criticalStockCount} habis` : "Perlu diisi ulang"}
          />
        </KpiGrid>
      )}

      {/* 3. Business Insights — compact strip */}
      <InsightStrip insights={insights} max={3} />

      {/* 4. Financial Summary — one compact card */}
      <FinancialSummaryCard
        income={totalSales + digitalPeriod.revenue}
        expense={totalExpenses}
        netProfit={netProfit}
        margin={margin}
      />

      {/* 5. Capital — per category */}
      <CapitalSummaryCard warungCapital={warungCapital} digitalCapital={digitalCapital} currentCapital={currentCapital} />

      {/* 5. Sales Trend — 7/30/90 with stats */}
      <SalesTrendCard />

      {/* 6. Recent Transactions */}
      <RecentTransactionsCard />
    </div>
  );
}
