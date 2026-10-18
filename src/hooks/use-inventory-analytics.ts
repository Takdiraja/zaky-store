"use client";

import { useMemo } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import type { Product } from "@/types";

export type SalesVelocity = "fast" | "normal" | "slow" | "dead";

export interface ProductAnalytics {
  product: Product;
  /** Units sold in the last 30 days */
  sold30d: number;
  velocity: SalesVelocity;
  /** Suggested reorder qty = max(minStock, avgDaily×leadDays) − stock */
  reorderQty: number;
  /** Days of stock left at current velocity (Infinity if no sales) */
  daysOfStock: number;
}

const LOOKBACK_DAYS = 30;
const LEAD_DAYS = 7; // typical restock lead time for a warung

function dateOffsetISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Derived inventory analytics for every active product: 30-day sales velocity
 * (fast/normal/slow/dead), days of stock left, and a suggested reorder qty.
 */
export function useInventoryAnalytics(products: Product[]) {
  const transactions = useTransactionStore((s) => s.transactions);

  return useMemo(() => {
    const cutoff = dateOffsetISO(LOOKBACK_DAYS);
    const soldByProduct = new Map<string, number>();

    transactions
      .filter((t) => t.date >= cutoff && !(t.paymentMethod === "qris" && t.status === "debt"))
      .forEach((t) =>
        t.items.forEach((i) => {
          soldByProduct.set(i.productId, (soldByProduct.get(i.productId) ?? 0) + i.quantity);
        }),
      );

    const analytics: ProductAnalytics[] = products
      .filter((p) => p.isActive)
      .map((p) => {
        const sold30d = soldByProduct.get(p.id) ?? 0;
        const avgDaily = sold30d / LOOKBACK_DAYS;

        let velocity: SalesVelocity;
        if (sold30d === 0) velocity = "dead";
        // ≥1 unit/day (30+/bulan) = laris; ≥1/3 unit/day (10+/bulan) = normal
        else if (avgDaily >= 1) velocity = "fast";
        else if (avgDaily >= 1 / 3) velocity = "normal";
        else velocity = "slow";

        const daysOfStock = avgDaily > 0 ? Math.round(p.stock / avgDaily) : Infinity;

        const suggested = Math.max(p.minStock, Math.ceil(avgDaily * LEAD_DAYS));
        const reorderQty = Math.max(0, suggested - p.stock);

        return { product: p, sold30d, velocity, reorderQty, daysOfStock };
      })
      .sort((a, b) => {
        // Fast movers first, then normal, slow, dead.
        const order: Record<SalesVelocity, number> = { fast: 0, normal: 1, slow: 2, dead: 3 };
        return order[a.velocity] - order[b.velocity];
      });

    return analytics;
  }, [transactions, products]);
}

export const VELOCITY_META: Record<
  SalesVelocity,
  { label: string; badge: "success" | "info" | "warning" | "danger"; short: string }
> = {
  fast: { label: "Laris", badge: "success", short: "Laris" },
  normal: { label: "Normal", badge: "info", short: "Normal" },
  slow: { label: "Lambat", badge: "warning", short: "Lambat" },
  dead: { label: "Tidak Laku", badge: "danger", short: "Tidak Laku" },
};
