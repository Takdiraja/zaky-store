"use client";

import { useMemo } from "react";
import { formatCurrency, formatDateShort } from "@/lib/formatters";
import { toDateKey } from "@/lib/period-metrics";
import { cn } from "@/lib/utils";
import type { Transaction, Expense } from "@/types";

interface DailyCashierRow {
  date: string;
  label: string;
  masuk: number;
  keluar: number;
}

interface Props {
  transactions: Transaction[];
  expenses: Expense[];
  /** Tanggal ISO yang sudah diurutkan (dari periode laporan). */
  dates: string[];
}

/**
 * Laporan Kasir Harian — tabel per hari: total uang masuk (transaksi)
 * vs total uang keluar (pengeluaran), plus selisih.
 */
export default function DailyCashierTable({ transactions, expenses, dates }: Props) {
  const rows = useMemo<DailyCashierRow[]>(() => {
    return dates.map((d) => {
      const masuk = transactions
        .filter((t) => toDateKey(t.date) === d)
        .reduce((s, t) => s + t.totalAmount, 0);
      const keluar = expenses
        .filter((e) => toDateKey(e.expenseDate) === d)
        .reduce((s, e) => s + e.totalAmount, 0);
      return { date: d, label: formatDateShort(d), masuk, keluar };
    });
  }, [transactions, expenses, dates]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({ masuk: acc.masuk + r.masuk, keluar: acc.keluar + r.keluar }),
      { masuk: 0, keluar: 0 },
    );
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
      <h3 className="text-label-xl font-bold text-on-surface">Laporan Kasir Harian</h3>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        Total uang masuk dan keluar per hari pada periode ini.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-border-standard text-left text-caption text-on-surface-variant">
              <th className="pb-2 pr-2 font-semibold">Tanggal</th>
              <th className="pb-2 pr-2 text-right font-semibold">Masuk</th>
              <th className="pb-2 pr-2 text-right font-semibold">Keluar</th>
              <th className="pb-2 text-right font-semibold">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const selisih = r.masuk - r.keluar;
              return (
                <tr key={r.date} className="border-b border-border-standard/50 last:border-0">
                  <td className="py-2 pr-2 text-on-surface">{r.label}</td>
                  <td className="py-2 pr-2 text-right font-medium text-success">
                    {formatCurrency(r.masuk)}
                  </td>
                  <td className="py-2 pr-2 text-right font-medium text-danger">
                    {formatCurrency(r.keluar)}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-right font-bold",
                      selisih >= 0 ? "text-on-surface" : "text-danger",
                    )}
                  >
                    {formatCurrency(selisih)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-standard font-bold">
              <td className="pt-2 pr-2 text-on-surface">Total</td>
              <td className="pt-2 pr-2 text-right text-success">
                {formatCurrency(totals.masuk)}
              </td>
              <td className="pt-2 pr-2 text-right text-danger">
                {formatCurrency(totals.keluar)}
              </td>
              <td className="pt-2 text-right text-on-surface">
                {formatCurrency(totals.masuk - totals.keluar)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
