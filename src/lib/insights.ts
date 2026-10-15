import { formatCurrency, formatCurrencyCompact } from "./formatters";
import type { Transaction, Product, Customer, Expense } from "@/types";

export interface Insight {
  icon: string;
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  text: string;
}

export interface InsightInput {
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  todayISO: string;
}

/** Local-time YYYY-MM-DD for a date offset from today. */
function dateOffsetISO(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const isReported = (t: Transaction) => !(t.paymentMethod === "qris" && t.status === "debt");

/**
 * Pure client-side business insights generator. Produces Indonesian sentences
 * that answer "what action should the owner take?". No schema changes.
 */
export function generateInsights({
  transactions,
  products,
  customers,
  expenses,
  todayISO,
}: InsightInput): Insight[] {
  const insights: Insight[] = [];

  const salesToday = transactions.filter((t) => t.date.startsWith(todayISO) && isReported(t));
  const yesterdayISO = dateOffsetISO(todayISO, -1);
  const salesYesterday = transactions.filter((t) => t.date.startsWith(yesterdayISO) && isReported(t));

  const totalToday = salesToday.reduce((s, t) => s + t.totalAmount, 0);
  const totalYesterday = salesYesterday.reduce((s, t) => s + t.totalAmount, 0);

  // 1. Sales delta vs yesterday
  if (totalYesterday > 0) {
    const pct = Math.round(((totalToday - totalYesterday) / totalYesterday) * 100);
    if (pct >= 5) {
      insights.push({
        icon: "trending_up",
        tone: "success",
        title: "Penjualan naik",
        text: `Penjualan hari ini naik ${pct}% dibanding kemarin (${formatCurrencyCompact(totalToday)} vs ${formatCurrencyCompact(totalYesterday)}).`,
      });
    } else if (pct <= -5) {
      insights.push({
        icon: "trending_down",
        tone: "warning",
        title: "Penjualan turun",
        text: `Penjualan hari ini turun ${Math.abs(pct)}% dibanding kemarin. Pertimbangkan promosi untuk produk terlaris.`,
      });
    }
  } else if (totalToday > 0) {
    insights.push({
      icon: "trending_up",
      tone: "success",
      title: "Mulai hari dengan baik",
      text: `Penjualan hari ini mencapai ${formatCurrencyCompact(totalToday)}.`,
    });
  }

  // 2. Low stock
  const lowStock = products.filter((p) => p.isActive && p.stock <= p.minStock);
  if (lowStock.length > 0) {
    const critical = lowStock.filter((p) => p.stock === 0);
    insights.push({
      icon: "warning",
      tone: critical.length > 0 ? "danger" : "warning",
      title: "Stok perlu diisi",
      text: `${lowStock.length} produk di bawah stok minimum (${critical.length} habis). Segera lakukan pembelian kembali.`,
    });
  }

  // 3. Dead stock (no sales in 30 days)
  const cutoff = dateOffsetISO(todayISO, -30);
  const soldIn30d = new Set<string>();
  transactions
    .filter((t) => t.date >= cutoff && isReported(t))
    .forEach((t) => t.items.forEach((i) => soldIn30d.add(i.productId)));
  const deadStock = products.filter((p) => p.isActive && p.stock > 0 && !soldIn30d.has(p.id));
  if (deadStock.length >= 3) {
    insights.push({
      icon: "package_x",
      tone: "info",
      title: "Produk tidak laku",
      text: `${deadStock.length} produk tidak terjual dalam 30 hari terakhir. Tinjau ulang stok atau beri diskon.`,
    });
  }

  // 4. Top product by profit
  const profitByProduct = new Map<string, { name: string; profit: number }>();
  transactions
    .filter((t) => isReported(t))
    .forEach((t) =>
      t.items.forEach((i) => {
        const cur = profitByProduct.get(i.productId);
        if (cur) cur.profit += i.profit;
        else profitByProduct.set(i.productId, { name: i.name, profit: i.profit });
      }),
    );
  const topProfit = [...profitByProduct.values()].sort((a, b) => b.profit - a.profit)[0];
  if (topProfit && topProfit.profit > 0) {
    insights.push({
      icon: "trending_up",
      tone: "success",
      title: "Penyumbang laba terbesar",
      text: `"${topProfit.name}" memberi laba ${formatCurrencyCompact(topProfit.profit)} — jaga stoknya agar tidak kosong.`,
    });
  }

  // 5. Outstanding debt
  const totalDebt = customers.reduce((s, c) => s + c.currentDebt, 0);
  const overdue = customers.filter((c) => c.currentDebt > 100000);
  if (totalDebt > 0) {
    insights.push({
      icon: "menu_book",
      tone: overdue.length > 0 ? "warning" : "info",
      title: "Kasbon belum ditagih",
      text: `Total piutang ${formatCurrency(totalDebt)} dari ${customers.filter((c) => c.currentDebt > 0).length} pelanggan${
        overdue.length > 0 ? `, ${overdue.length} di antaranya besar (Overdue).` : "."
      }`,
    });
  }

  // 6. Expenses vs profit today
  const expensesToday = expenses
    .filter((e) => e.expenseDate.startsWith(todayISO))
    .reduce((s, e) => s + e.totalAmount, 0);
  const profitToday = salesToday.reduce((s, t) => s + t.totalProfit, 0);
  if (expensesToday > 0 && profitToday > 0) {
    const ratio = Math.round((expensesToday / profitToday) * 100);
    if (ratio >= 70) {
      insights.push({
        icon: "receipt_long",
        tone: "warning",
        title: "Pengeluaran tinggi",
        text: `Pengeluaran hari ini ${formatCurrency(expensesToday)} — setara ${ratio}% laba. Pantau pengeluaran agar laba bersih terjaga.`,
      });
    }
  }

  // 7. Avg transaction value
  if (salesToday.length >= 3) {
    const avg = totalToday / salesToday.length;
    insights.push({
      icon: "payments",
      tone: "info",
      title: "Rata-rata transaksi",
      text: `Rata-rata transaksi hari ini ${formatCurrency(Math.round(avg))} dari ${salesToday.length} transaksi.`,
    });
  }

  // Cap at 5 to avoid overwhelming the owner.
  return insights.slice(0, 5);
}

export interface BusinessScore {
  score: number; // 0-100
  label: string;
  breakdown: { label: string; value: number }[];
}

/**
 * Lightweight business-health score (0-100) from the same data.
 */
export function computeBusinessScore({
  transactions,
  products,
  customers,
  todayISO,
}: InsightInput): BusinessScore {
  const reported = transactions.filter(isReported);
  const last30 = reported.filter((t) => t.date >= dateOffsetISO(todayISO, -30));
  const total30 = last30.reduce((s, t) => s + t.totalAmount, 0);
  const profit30 = last30.reduce((s, t) => s + t.totalProfit, 0);
  const totalDebt = customers.reduce((s, c) => s + c.currentDebt, 0);
  const lowStock = products.filter((p) => p.isActive && p.stock <= p.minStock).length;
  const activeProducts = products.filter((p) => p.isActive).length;

  // Profitability: profit margin of the last 30 days (0-40)
  const margin = total30 > 0 ? profit30 / total30 : 0;
  const profitability = Math.max(0, Math.min(40, Math.round(margin * 100 * 2)));

  // Sales momentum: has sales in last 30 days (0-20)
  const momentum = total30 > 0 ? 20 : 0;

  // Inventory health: share of products not low-stock (0-20)
  const inventory =
    activeProducts === 0
      ? 0
      : Math.max(0, Math.min(20, Math.round(((activeProducts - lowStock) / activeProducts) * 20)));

  // Debt ratio: debt vs 30-day sales (0-20, lower debt = higher score)
  const debtRatio = total30 > 0 ? totalDebt / total30 : totalDebt > 0 ? 1 : 0;
  const debtScore = Math.max(0, Math.min(20, Math.round((1 - Math.min(debtRatio, 1)) * 20)));

  const score = profitability + momentum + inventory + debtScore;
  const label =
    score >= 75 ? "Sehat" : score >= 50 ? "Cukup" : score >= 25 ? "Perlu Perhatian" : "Kritis";

  return {
    score,
    label,
    breakdown: [
      { label: "Profitabilitas", value: profitability },
      { label: "Momentum penjualan", value: momentum },
      { label: "Kesehatan stok", value: inventory },
      { label: "Rasio piutang", value: debtScore },
    ],
  };
}
