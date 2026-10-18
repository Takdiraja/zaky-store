"use client";

import Link from "next/link";
import {
  Wallet,
  QrCode,
  TrendingUp,
  BookOpen,
  ShoppingBag,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface SimpleReportViewProps {
  totalSales: number;
  totalProfit: number;
  totalCash: number;
  totalQris: number;
  totalKasbon: number;
  kasbonIn: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  periodLabel: string;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  lowStockCount: number;
  criticalStockCount: number;
  totalOutstandingKasbon: number;
  cumulativeCashInDrawer?: number;
}

export default function SimpleReportView({
  totalSales,
  totalProfit,
  totalCash,
  totalQris,
  totalKasbon,
  kasbonIn,
  totalExpenses,
  netProfit,
  profitMargin,
  periodLabel,
  topProducts,
  lowStockCount,
  criticalStockCount,
  totalOutstandingKasbon,
  cumulativeCashInDrawer,
}: SimpleReportViewProps) {
  // Mutasi uang tunai khusus periode terpilih (hari ini / dsb)
  const periodCashDelta = totalCash + kasbonIn - totalExpenses;
  // Total saldo fisik riil di laci kasir (akumulasi)
  const actualDrawerCash =
    cumulativeCashInDrawer !== undefined ? cumulativeCashInDrawer : periodCashDelta;
  const hpp = totalSales - totalProfit;
  const topThree = topProducts.slice(0, 3);

  return (
    <div className="space-y-4 pt-2">
      {/* KARTU 1: REKONSILIASI UANG LACI KASIR */}
      <section className="rounded-2xl border border-border-standard bg-card p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Wallet className="size-5" />
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">
                Uang Fisik Kasir (Laci)
              </h2>
              <p className="text-caption text-on-surface-variant">
                Total uang tunai fisik yang wajib ada di laci kasir saat ini
              </p>
            </div>
          </div>
          <span className="text-caption font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary shrink-0">
            {periodLabel}
          </span>
        </div>

        {/* Kotak Utama: Total Sisa Uang Fisik di Laci */}
        <div className="rounded-xl border border-border-standard/60 bg-surface-container-low p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-caption font-medium text-on-surface-variant">
              Total Sisa Fisik di Laci Kasir
            </span>
            <span className="text-[11px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
              Saldo Fisik Nyata
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl font-extrabold ${
                actualDrawerCash < 0 ? "text-danger-alert" : "text-on-surface"
              }`}
            >
              {formatCurrency(actualDrawerCash)}
            </span>
            <span className="text-caption text-on-surface-variant">
              (Akumulasi seluruh sisa uang laci)
            </span>
          </div>
          {actualDrawerCash < 0 && (
            <div className="mt-2 text-caption text-danger-alert bg-danger-alert/10 p-2.5 rounded-lg flex items-center justify-between gap-2">
              <span>
                Saldo fisik minus karena ada pengeluaran/beli barang lebih besar dari uang masuk. Jika ada modal kasir, silakan catat di menu Modal.
              </span>
              <Link
                href="/capital"
                className="font-bold underline shrink-0 hover:opacity-80"
              >
                Catat Modal
              </Link>
            </div>
          )}
        </div>

        {/* Rincian Alur Uang Tunai Periode Ini */}
        <div className="space-y-2.5 text-body-md pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-border-standard/40 text-caption text-on-surface-variant font-medium">
            <span>Aliran Kas Tunai ({periodLabel})</span>
            <span>Nilai</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Penjualan Tunai</span>
            <span className="font-semibold text-success">
              + {formatCurrency(totalCash)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">
              Pelunasan Kasbon Masuk
            </span>
            <span className="font-semibold text-info">
              + {formatCurrency(kasbonIn)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Pengeluaran Kasir</span>
            <span className="font-semibold text-warning">
              − {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border-standard/40 text-body-sm">
            <span className="text-on-surface-variant font-medium">
              Mutasi Kas Tunai ({periodLabel})
            </span>
            <span
              className={`font-bold ${
                periodCashDelta < 0 ? "text-danger-alert" : "text-success"
              }`}
            >
              {periodCashDelta > 0 ? "+ " : ""}
              {formatCurrency(periodCashDelta)}
            </span>
          </div>
        </div>

        {/* Kotak Pemisah: Masuk Rekening (QRIS / Non-Tunai) */}
        <div className="rounded-xl border border-border-standard/50 bg-surface p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QrCode className="size-4 text-on-surface-variant shrink-0" />
            <div>
              <span className="text-label-md font-semibold text-on-surface block">
                Masuk Rekening (QRIS)
              </span>
              <span className="text-caption text-on-surface-variant">
                Uang digital langsung masuk ke rekening bank/e-wallet ({periodLabel})
              </span>
            </div>
          </div>
          <span className="text-headline-sm font-bold text-on-surface shrink-0">
            {formatCurrency(totalQris)}
          </span>
        </div>
      </section>

      {/* KARTU 2: HASIL USAHA & LABA BERSIH */}
      <section className="rounded-2xl border border-border-standard bg-card p-5 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">
                Hasil Usaha & Untung Bersih
              </h2>
              <p className="text-caption text-on-surface-variant">
                Laba bersih murni setelah dikurangi modal dan biaya operasional
              </p>
            </div>
          </div>
          <span className="text-caption font-bold px-2.5 py-1 rounded-full bg-success/10 text-success shrink-0">
            Margin {profitMargin}%
          </span>
        </div>

        {/* Kotak Utama: Laba Bersih */}
        <div className="rounded-xl border border-border-standard/60 bg-surface-container-low p-4">
          <span className="text-caption font-medium text-on-surface-variant block mb-1">
            Untung Bersih (Hak Pemilik)
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl font-extrabold ${
                netProfit < 0 ? "text-danger-alert" : "text-secondary"
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
            <span className="text-caption text-on-surface-variant">
              (Laba Kotor − Biaya Toko)
            </span>
          </div>
        </div>

        {/* Rincian Omzet dan Biaya */}
        <div className="space-y-2 text-body-md pt-1">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">
              Total Penjualan (Omzet)
            </span>
            <span className="font-bold text-on-surface">
              {formatCurrency(totalSales)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">
              Modal Barang Terjual (HPP)
            </span>
            <span className="text-on-surface-variant font-medium">
              − {formatCurrency(hpp)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border-standard/40 pt-2">
            <span className="text-on-surface font-medium">Laba Kotor</span>
            <span className="font-semibold text-success">
              {formatCurrency(totalProfit)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">
              Biaya Operasional Toko
            </span>
            <span className="font-medium text-warning">
              − {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        <p className="text-caption text-on-surface-variant bg-surface p-3 rounded-lg border border-border-standard/40 leading-relaxed">
          {netProfit >= 0
            ? `Alhamdulillah, toko menghasilkan untung bersih ${formatCurrency(
                netProfit
              )} pada periode ${periodLabel}.`
            : `Periode ${periodLabel} tercatat rugi ${formatCurrency(
                -netProfit
              )}. Periksa kembali pengeluaran operasional toko Anda.`}
        </p>
      </section>

      {/* KARTU 3: KASBON & BAHAN KULAKAN */}
      <section className="rounded-2xl border border-border-standard bg-card p-5 space-y-5 shadow-sm">
        {/* Sub-bagian A: Kasbon Pelanggan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-warning" />
              <h3 className="text-label-lg font-bold text-on-surface">
                Kasbon Pelanggan
              </h3>
            </div>
            <Link
              href="/kasbon"
              className="text-caption font-semibold text-secondary hover:underline inline-flex items-center gap-0.5"
            >
              Buka Buku Kasbon
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-body-md">
            <div className="rounded-xl border border-border-standard/50 bg-surface p-3">
              <span className="text-caption text-on-surface-variant block mb-0.5">
                Kasbon Baru ({periodLabel})
              </span>
              <span className="text-label-lg font-bold text-warning">
                {formatCurrency(totalKasbon)}
              </span>
            </div>
            <div className="rounded-xl border border-border-standard/50 bg-surface p-3">
              <span className="text-caption text-on-surface-variant block mb-0.5">
                Kasbon Terbayar ({periodLabel})
              </span>
              <span className="text-label-lg font-bold text-success">
                {formatCurrency(kasbonIn)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low text-caption">
            <span className="text-on-surface-variant">
              Total kasbon belum lunas semua pelanggan:
            </span>
            <span className="font-bold text-on-surface">
              {formatCurrency(totalOutstandingKasbon)}
            </span>
          </div>
        </div>

        <div className="border-t border-border-standard" />

        {/* Sub-bagian B: Bahan Kulakan & Stok */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-secondary" />
              <h3 className="text-label-lg font-bold text-on-surface">
                Bahan Kulakan & Stok
              </h3>
            </div>
            <Link
              href="/produk"
              className="text-caption font-semibold text-secondary hover:underline inline-flex items-center gap-0.5"
            >
              Kelola Produk
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* Status Stok Menipis */}
          {lowStockCount > 0 ? (
            <Link
              href="/produk"
              className="flex items-center justify-between p-3 rounded-xl border border-warning/30 bg-warning/10 hover:bg-warning/15 transition-colors text-on-surface"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5 text-warning shrink-0" />
                <div>
                  <span className="text-label-md font-bold text-on-surface block">
                    {lowStockCount} produk stok menipis
                  </span>
                  <span className="text-caption text-on-surface-variant">
                    {criticalStockCount > 0
                      ? `${criticalStockCount} produk sudah habis (stok 0)`
                      : "Stok di bawah batas minimum, perlu segera kulakan"}
                  </span>
                </div>
              </div>
              <span className="text-caption font-semibold text-secondary shrink-0">
                Lihat Stok
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-success/30 bg-success/10 text-success text-caption font-medium">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Semua stok produk saat ini dalam kondisi aman.</span>
            </div>
          )}

          {/* Top 3 Produk Terlaris */}
          <div className="space-y-2 pt-1">
            <span className="text-caption font-semibold text-on-surface-variant uppercase tracking-wider block">
              Top 3 Produk Terlaris ({periodLabel})
            </span>

            {topThree.length > 0 ? (
              <div className="space-y-2">
                {topThree.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border-standard/50 bg-surface text-body-md"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="size-6 rounded-full bg-secondary/10 text-secondary text-caption font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-on-surface truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-caption font-bold text-on-surface block">
                        {item.qty} terjual
                      </span>
                      <span className="text-caption text-on-surface-variant">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-caption text-on-surface-variant/80 border border-dashed border-border-standard rounded-xl">
                <Package className="size-6 mx-auto mb-1 text-on-surface-variant/40" />
                Belum ada data produk terjual pada periode ini
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
