import type { Transaction, Expense, PeriodFilter } from "@/types";
import { getTodayISO } from "./formatters";

/**
 * Shared date-range logic for the Dashboard quick filter and the Reports
 * period filter. Both surfaces use the same local-time YYYY-MM-DD rules so
 * they always agree with each other and with the rest of the app.
 */

/** Local-time YYYY-MM-DD for a date offset from today. */
export function getDateOffsetISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Local-time YYYY-MM-DD key for a transaction `date` string. Handles both
 * the normalized "YYYY-MM-DD" form and legacy full ISO timestamps
 * (e.g. "2026-08-05T10:32:00.000Z") by converting in local time.
 */
export function toDateKey(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local-time YYYY-MM-DD for a date stepping `offsetDays` from `base`. */
export function getDateOffsetFromISO(base: string, offsetDays: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface DateRange {
  start: string;
  end: string;
}

export function getDateRange(
  period: PeriodFilter,
  customStart?: string | null,
  customEnd?: string | null,
): DateRange {
  const today = getTodayISO();
  switch (period) {
    case "today":
      return { start: today, end: today };
    case "yesterday":
      return { start: getDateOffsetISO(1), end: getDateOffsetISO(1) };
    case "week": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { start: fmt(start), end: today };
    }
    case "month": {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "custom":
      return { start: customStart || today, end: customEnd || today };
    default:
      return { start: today, end: today };
  }
}

/** True when a transaction counts as revenue (unpaid QRIS is not revenue yet). */
export function isReportedTransaction(t: Transaction): boolean {
  return !(t.paymentMethod === "qris" && t.status === "debt");
}

/**
 * Builds a daily sales series over the last `days` days (local time).
 * Unpaid QRIS transactions are excluded from revenue, matching every other
 * surface in the app.
 */
export function buildSalesSeries(
  transactions: Transaction[],
  days: number,
): { date: string; value: number }[] {
  const dates = Array.from({ length: days }, (_, i) => getDateOffsetISO(days - 1 - i));
  const byDate = new Map<string, number>();
  for (const t of transactions) {
    if (!isReportedTransaction(t)) continue;
    const key = toDateKey(t.date);
    byDate.set(key, (byDate.get(key) ?? 0) + t.totalAmount);
  }
  return dates.map((date) => ({ date, value: byDate.get(date) ?? 0 }));
}

/** Aggregates top products across a date range: qty + revenue + profit. */
export interface TopProductRow {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
  profit: number;
}

export function buildTopProducts(
  transactions: Transaction[],
): TopProductRow[] {
  const map = new Map<string, TopProductRow>();
  for (const t of transactions) {
    if (!isReportedTransaction(t)) continue;
    for (const item of t.items) {
      const row = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
      row.qty += item.quantity;
      row.revenue += item.subtotal;
      row.profit += item.profit;
      map.set(item.productId, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
}

/** Sum of expenses within an inclusive date range. */
export function sumExpensesInRange(expenses: Expense[], start: string, end: string): number {
  return expenses
    .filter((e) => e.expenseDate >= start && e.expenseDate <= end)
    .reduce((s, e) => s + e.totalAmount, 0);
}

/** Growth % of the current range vs the immediately preceding range. */
export function growthPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
