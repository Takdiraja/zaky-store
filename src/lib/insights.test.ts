import { describe, it, expect } from "vitest";
import { generateInsights, computeBusinessScore } from "./insights";
import type { Transaction, Product, Customer, Expense } from "@/types";

const today = "2026-08-04";

const baseProduct = (id: string, overrides: Partial<Product> = {}): Product => ({
  id,
  name: `Produk ${id}`,
  brand: null,
  category: "Makanan",
  barcode: null,
  image_url: null,
  buyPrice: 1000,
  sellPrice: 2000,
  stock: 10,
  minStock: 2,
  isActive: true,
  createdAt: today,
  updatedAt: today,
  ...overrides,
});

const baseTxn = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "t1",
  date: `${today}T08:00:00.000Z`,
  items: [
    { productId: "p1", name: "Produk p1", quantity: 2, buyPrice: 1000, sellPrice: 2000, subtotal: 4000, profit: 2000 },
  ],
  totalAmount: 4000,
  totalProfit: 2000,
  paymentMethod: "cash",
  status: "paid",
  customerId: null,
  createdAt: today,
  receiptNumber: "TRX-1",
  amountPaid: 4000,
  change: 0,
  ...overrides,
});

describe("generateInsights", () => {
  it("returns empty when there is no data", () => {
    const insights = generateInsights({ transactions: [], products: [], customers: [], expenses: [], todayISO: today });
    expect(insights).toEqual([]);
  });

  it("reports low stock", () => {
    const products = [baseProduct("p1", { stock: 1, minStock: 2 })];
    const insights = generateInsights({ transactions: [], products, customers: [], expenses: [], todayISO: today });
    const stock = insights.find((i) => i.title === "Stok perlu diisi");
    expect(stock).toBeDefined();
    expect(stock!.tone).toBe("warning");
  });

  it("flags dead stock for products unsold in 30 days", () => {
    const products = [baseProduct("p1", { stock: 5 })];
    const insights = generateInsights({ transactions: [], products, customers: [], expenses: [], todayISO: today });
    expect(insights.some((i) => i.title === "Produk tidak laku")).toBe(false); // < 3 dead products
  });

  it("detects a top product by profit", () => {
    const products = [baseProduct("p1")];
    const transactions = [baseTxn()];
    const insights = generateInsights({ transactions, products, customers: [], expenses: [], todayISO: today });
    expect(insights.some((i) => i.title === "Penyumbang laba terbesar")).toBe(true);
  });

  it("reports outstanding debt", () => {
    const customers: Customer[] = [
      { id: "c1", name: "Budi", phone: "", currentDebt: 50000, createdAt: today, updatedAt: today },
    ];
    const insights = generateInsights({ transactions: [], products: [], customers, expenses: [], todayISO: today });
    expect(insights.some((i) => i.title === "Kasbon belum ditagih")).toBe(true);
  });

  it("caps insights at 5", () => {
    const products = Array.from({ length: 8 }, (_, i) => baseProduct(`p${i}`, { stock: 0, minStock: 2 }));
    const customers: Customer[] = Array.from({ length: 5 }, (_, i) => ({
      id: `c${i}`, name: `C${i}`, phone: "", currentDebt: 200000, createdAt: today, updatedAt: today,
    }));
    const transactions = Array.from({ length: 6 }, (_, i) => baseTxn({ id: `t${i}`, date: `${today}T0${i}:00:00.000Z` }));
    const insights = generateInsights({ transactions, products, customers, expenses: [], todayISO: today });
    expect(insights.length).toBeLessThanOrEqual(5);
  });
});

describe("computeBusinessScore", () => {
  it("gives a low score for an empty business", () => {
    const score = computeBusinessScore({ transactions: [], products: [], customers: [], expenses: [], todayISO: today });
    expect(score.score).toBeLessThanOrEqual(20);
  });

  it("scores healthy business higher than empty", () => {
    const products = [baseProduct("p1", { stock: 10, minStock: 2 })];
    const transactions = [baseTxn()];
    const healthy = computeBusinessScore({ transactions, products, customers: [], expenses: [], todayISO: today });
    const empty = computeBusinessScore({ transactions: [], products: [], customers: [], expenses: [], todayISO: today });
    expect(healthy.score).toBeGreaterThan(empty.score);
  });
});
