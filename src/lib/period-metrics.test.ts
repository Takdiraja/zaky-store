import { describe, it, expect } from "vitest";
import {
  buildSalesSeries,
  buildTopProducts,
  getDateOffsetFromISO,
  getDateOffsetISO,
  getDateRange,
  growthPercent,
  isReportedTransaction,
  sumExpensesInRange,
  toDateKey,
} from "./period-metrics";
import type { Transaction, Expense } from "@/types";

function txn(partial: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    date: "2026-08-05",
    items: [],
    totalAmount: 0,
    totalProfit: 0,
    paymentMethod: "cash",
    status: "paid",
    customerId: null,
    createdAt: "2026-08-05T10:00:00.000Z",
    receiptNumber: "TRX-001",
    amountPaid: 0,
    change: 0,
    ...partial,
  };
}

function exp(partial: Partial<Expense>): Expense {
  return {
    id: "e1",
    expenseNumber: "EXP-1",
    expenseDate: "2026-08-05",
    title: "Sewa",
    description: "",
    totalAmount: 0,
    receiptImage: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("period metrics helpers", () => {
  it("builds a 7-day series with zero-filled missing days", () => {
    const series = buildSalesSeries(
      [txn({ date: "2026-08-03", totalAmount: 1000 })],
      7,
    );
    expect(series).toHaveLength(7);
    expect(series.map((p) => p.value)).toContain(1000);
    expect(series.filter((p) => p.value === 0).length).toBe(6);
  });

  it("excludes unpaid QRIS from the sales series", () => {
    const today = getDateOffsetISO(0);
    const paid = txn({ date: today, totalAmount: 5000, paymentMethod: "qris", status: "paid" });
    const unpaid = txn({ date: today, totalAmount: 9000, paymentMethod: "qris", status: "debt" });
    const series = buildSalesSeries([paid, unpaid], 1);
    expect(series[0].value).toBe(5000);
  });

  it("isReportedTransaction excludes unpaid QRIS only", () => {
    expect(isReportedTransaction(txn({ paymentMethod: "qris", status: "debt" }))).toBe(false);
    expect(isReportedTransaction(txn({ paymentMethod: "qris", status: "paid" }))).toBe(true);
    expect(isReportedTransaction(txn({ paymentMethod: "cash" }))).toBe(true);
    expect(isReportedTransaction(txn({ paymentMethod: "kasbon" }))).toBe(true);
  });

  it("aggregates top products with qty, revenue, and profit", () => {
    const rows = buildTopProducts([
      txn({
        items: [
          { productId: "p1", name: "Kopi", quantity: 2, buyPrice: 1000, sellPrice: 3000, subtotal: 6000, profit: 4000 },
        ],
      }),
      txn({
        items: [
          { productId: "p1", name: "Kopi", quantity: 1, buyPrice: 1000, sellPrice: 3000, subtotal: 3000, profit: 2000 },
          { productId: "p2", name: "Teh", quantity: 5, buyPrice: 500, sellPrice: 1000, subtotal: 5000, profit: 2500 },
        ],
      }),
    ]);
    expect(rows[0]).toMatchObject({ name: "Teh", qty: 5, revenue: 5000, profit: 2500 });
    expect(rows[1]).toMatchObject({ name: "Kopi", qty: 3, revenue: 9000, profit: 6000 });
  });

  it("sums expenses within an inclusive range", () => {
    const expenses = [
      exp({ expenseDate: "2026-08-01", totalAmount: 100 }),
      exp({ expenseDate: "2026-08-05", totalAmount: 200 }),
      exp({ expenseDate: "2026-08-31", totalAmount: 300 }),
    ];
    expect(sumExpensesInRange(expenses, "2026-08-01", "2026-08-31")).toBe(600);
    expect(sumExpensesInRange(expenses, "2026-08-02", "2026-08-05")).toBe(200);
  });

  it("computes growth percent only when previous > 0", () => {
    expect(growthPercent(120, 100)).toBe(20);
    expect(growthPercent(80, 100)).toBe(-20);
    expect(growthPercent(50, 0)).toBeNull();
  });

  it("computes date ranges per period", () => {
    expect(getDateRange("today")).toEqual({ start: expect.any(String), end: expect.any(String) });
    expect(getDateRange("yesterday").start).toBe(getDateOffsetISO(1));
    expect(getDateRange("custom", "2026-01-01", "2026-01-10")).toEqual({
      start: "2026-01-01",
      end: "2026-01-10",
    });
  });

  it("steps ISO dates forward from a base", () => {
    expect(getDateOffsetFromISO("2026-08-05", 1)).toBe("2026-08-06");
    expect(getDateOffsetFromISO("2026-08-05", -1)).toBe("2026-08-04");
  });

  it("filters transactions by a date range in local time (UTC offset safe)", () => {
    // Reproduces the store's getTransactionsByDateRange with the local-time
    // fix. date-only strings must NOT be parsed as UTC midnight, otherwise
    // the range shifts by the UTC offset and "Hari Ini"/"Kemarin" misassign.
    const filter = (txns: { date: string }[], start: string, end: string) => {
      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T00:00:00`);
      endDate.setHours(23, 59, 59, 999);
      return txns.filter((t) => {
        const d = new Date(`${toDateKey(t.date)}T00:00:00`);
        return d >= startDate && d <= endDate;
      });
    };

    const today = getDateOffsetISO(0);
    const yesterday = getDateOffsetISO(1);

    const txns = [
      { date: today },
      { date: `${today}T09:30:00.000Z` }, // legacy ISO, same local day
      { date: yesterday },
      { date: `${yesterday}T16:00:00.000Z` }, // legacy ISO, yesterday local
    ];

    const inToday = filter(txns, today, today);
    expect(inToday.map((t) => t.date)).toEqual([today, `${today}T09:30:00.000Z`]);

    const inYesterday = filter(txns, yesterday, yesterday);
    expect(inYesterday.map((t) => t.date)).toEqual([yesterday, `${yesterday}T16:00:00.000Z`]);
  });

  it("toDateKey normalizes full ISO timestamps to local YYYY-MM-DD", () => {
    expect(toDateKey("2026-08-05")).toBe("2026-08-05");
    expect(toDateKey("2026-08-05T10:32:00.000Z")).toBe("2026-08-05");
    expect(toDateKey("2026-08-05 10:32:00")).toBe("2026-08-05");
  });

  it("buildSalesSeries buckets full ISO timestamps into the right day", () => {
    const series = buildSalesSeries(
      [txn({ date: "2026-08-05T10:32:00.000Z", totalAmount: 2500 })],
      7,
    );
    const total = series.reduce((s, p) => s + p.value, 0);
    expect(total).toBe(2500);
    expect(series.some((p) => p.date === "2026-08-05" && p.value === 2500)).toBe(true);
  });
});
