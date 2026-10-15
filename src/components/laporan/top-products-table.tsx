"use client";

import { useMemo } from "react";
import { useProductStore } from "@/stores/use-product-store";
import { useShallow } from "zustand/react/shallow";
import { formatCurrency } from "@/lib/formatters";
import { buildTopProducts } from "@/lib/period-metrics";
import type { Transaction } from "@/types";
import EmptyState from "@/components/shared/empty-state";

interface Props {
  transactions: Transaction[];
}

/**
 * Best-selling products table for the Reports page. Modern rows: product
 * thumbnail, name, qty sold, revenue, and profit. Card-list on mobile,
 * table on desktop.
 */
export default function TopProductsTable({ transactions }: Props) {
  const products = useProductStore(useShallow((s) => s.products));

  const rows = useMemo(() => {
    const aggregated = buildTopProducts(transactions);
    return aggregated.slice(0, 8).map((row) => {
      const product = products.find((p) => p.id === row.productId);
      return { ...row, imageUrl: product?.image_url ?? null };
    });
  }, [transactions, products]);

  if (rows.length === 0) {
    return (
      <section className="rounded-lg border border-border-standard bg-card shadow-card">
        <div className="border-b border-border-standard px-5 py-4">
          <h4 className="text-label-xl font-bold text-on-surface">Produk Terlaris</h4>
        </div>
        <EmptyState
          icon="inventory_2"
          title="Belum ada produk terjual"
          description="Produk yang terjual pada periode ini akan muncul di sini."
        />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border-standard bg-card shadow-card">
      <div className="border-b border-border-standard px-5 py-4">
        <h4 className="text-label-xl font-bold text-on-surface">Produk Terlaris</h4>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-b border-border-standard bg-surface-muted">
            <tr>
              <th className="px-5 py-3 text-label-md text-on-surface-variant">Produk</th>
              <th className="px-5 py-3 text-label-md text-on-surface-variant">Terjual</th>
              <th className="px-5 py-3 text-right text-label-md text-on-surface-variant">Pendapatan</th>
              <th className="px-5 py-3 text-right text-label-md text-on-surface-variant">Laba</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-standard">
            {rows.map((row) => (
              <tr key={row.productId} className="transition-colors hover:bg-surface-container-low">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Thumb name={row.name} imageUrl={row.imageUrl} />
                    <p className="font-semibold text-on-surface">{row.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-body-sm text-on-surface">{row.qty} Unit</td>
                <td className="px-5 py-4 text-right text-body-sm font-semibold text-on-surface">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="px-5 py-4 text-right text-body-sm font-semibold text-success">
                  {formatCurrency(row.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-border-standard md:hidden">
        {rows.map((row) => (
          <li key={row.productId} className="flex items-center gap-3 px-5 py-4">
            <Thumb name={row.name} imageUrl={row.imageUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-on-surface">{row.name}</p>
              <p className="text-caption text-on-surface-variant">{row.qty} unit terjual</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-body-sm font-semibold text-on-surface">{formatCurrency(row.revenue)}</p>
              <p className="text-caption font-semibold text-success">{formatCurrency(row.profit)} laba</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Thumb({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-label-md font-bold text-secondary"
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
