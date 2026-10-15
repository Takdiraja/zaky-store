import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { formatCurrency, formatDate, formatDateShort, formatTime } from "./formatters";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { PaymentMethod } from "@/types";

const COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
  "expenses",
  "capital",
  "digital_services",
] as const;

// ── Excel ──

export async function exportToExcel(): Promise<void> {
  const wb = XLSX.utils.book_new();

  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zaky-store-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF ──

export interface PDFTransactionRow {
  receiptNumber: string | null;
  date: string;
  customerName: string | null;
  paymentMethod: PaymentMethod;
  status: string;
  totalAmount: number;
}

export interface PDFExpenseRow {
  expenseNumber: string;
  expenseDate: string;
  title: string;
  totalAmount: number;
}

export interface PDFCashAdvanceSummary {
  activeCount: number;
  activeTotal: number;
  paidCount: number;
  paidTotal: number;
}

export interface PDFDigitalServiceSummary {
  totalRevenue: number;
  totalFees: number;
  totalProfit: number;
  transactionCount: number;
  byService: { label: string; revenue: number; profit: number; count: number }[];
}

export interface PDFCapitalCategorySummary {
  initial: number;
  addition: number;
  withdrawal: number;
  current: number;
}

export interface PDFCapitalSummary {
  warungCapital?: PDFCapitalCategorySummary;
  digitalCapital?: PDFCapitalCategorySummary;
  initialCapital: number;
  additionCapital: number;
  withdrawalCapital: number;
  currentCapital: number;
  netProfit: number;
  breakEvenPercent: number;
  remainingCapital: number;
}

export interface PDFReportData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  totalCash: number;
  totalKasbon: number;
  transactionCount: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  cashAdvanceSummary: PDFCashAdvanceSummary;
  capitalSummary: PDFCapitalSummary;
  digitalServiceSummary?: PDFDigitalServiceSummary;
  transactions: PDFTransactionRow[];
  expenses: PDFExpenseRow[];
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Tunai",
  kasbon: "Kasbon",
  qris: "QRIS",
};

export async function exportToPDF(data: PDFReportData): Promise<void> {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 14;

  // ── Report Header ──
  doc.setFontSize(18);
  doc.text("ZAKY STORE", pageW / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Laporan ${data.periodLabel}`, pageW / 2, 28, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(
    `Periode: ${formatDate(data.startDate)} – ${formatDate(data.endDate)}`,
    pageW / 2,
    35,
    { align: "center" }
  );
  doc.text(
    `Dicetak: ${formatDate(new Date().toISOString())} ${formatTime(new Date().toISOString())}`,
    pageW / 2,
    41,
    { align: "center" }
  );
  doc.setTextColor(0);

  // ── Financial Summary ──
  doc.setFontSize(12);
  doc.text("Ringkasan Keuangan", marginX, 52);
  doc.setFontSize(10);

  const netProfit = data.totalProfit - data.totalExpenses;

  const summaryRows = [
    ["Total Transaksi", String(data.transactionCount)],
    ["Total Penjualan", formatCurrency(data.totalSales)],
    ["Penjualan Tunai", formatCurrency(data.totalCash)],
    ["Penjualan Kredit (Kasbon)", formatCurrency(data.totalKasbon)],
    ["Laba Kotor", formatCurrency(data.totalProfit)],
    ["Total Pengeluaran", formatCurrency(data.totalExpenses)],
    ["Laba Bersih", formatCurrency(netProfit)],
  ];

  autoTable(doc, {
    startY: 56,
    head: [["Metrik", "Nilai"]],
    body: summaryRows,
    theme: "striped",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 81, 213] },
  });

  let finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100;

  // ── Cash Advance Summary ──
  if (data.cashAdvanceSummary) {
    const { activeCount, activeTotal, paidCount, paidTotal } = data.cashAdvanceSummary;
    const y = finalY + 12;
    doc.setFontSize(12);
    doc.text("Ringkasan Kasbon", marginX, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Metrik", "Jumlah", "Nilai"]],
      body: [
        ["Kasbon Aktif", String(activeCount), formatCurrency(activeTotal)],
        ["Kasbon Lunas", String(paidCount), formatCurrency(paidTotal)],
        ["Saldo Belum Tertagih", "—", formatCurrency(activeTotal)],
      ],
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 81, 213] },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
  }

  // ── Capital Summary ──
  if (data.capitalSummary) {
    const {
      initialCapital,
      additionCapital,
      withdrawalCapital,
      currentCapital,
      netProfit: capNetProfit,
      breakEvenPercent,
      remainingCapital,
    } = data.capitalSummary;
    const y = finalY + 12;
    doc.setFontSize(12);
    doc.text("Ringkasan Modal", marginX, y);

    const capitalRows = [
      ["Modal Awal", formatCurrency(initialCapital)],
      ["Penambahan Modal", formatCurrency(additionCapital)],
      ["Penarikan Modal", formatCurrency(withdrawalCapital)],
      ["Total Modal Aktif", formatCurrency(currentCapital)],
    ];

    // Append per-category rows when provided.
    if (data.capitalSummary.warungCapital) {
      capitalRows.push([
        "Warung Capital (Aktif)",
        formatCurrency(data.capitalSummary.warungCapital.current),
      ]);
    }
    if (data.capitalSummary.digitalCapital) {
      capitalRows.push([
        "Digital Services Capital (Aktif)",
        formatCurrency(data.capitalSummary.digitalCapital.current),
      ]);
    }

    capitalRows.push(
      ["Laba Bersih (Kumulatif)", formatCurrency(capNetProfit)],
      ["Break-even Progress", `${Math.round(breakEvenPercent)}%`],
      ["Remaining Capital", formatCurrency(remainingCapital)],
    );

    autoTable(doc, {
      startY: y + 4,
      head: [["Metrik", "Nilai"]],
      body: capitalRows,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 81, 213] },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
  }

  // ── Digital Services Summary ──
  if (data.digitalServiceSummary && data.digitalServiceSummary.transactionCount > 0) {
    const { totalRevenue, totalFees, totalProfit, transactionCount, byService } =
      data.digitalServiceSummary;
    const y = finalY + 12;
    doc.setFontSize(12);
    doc.text("Layanan Digital", marginX, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Metrik", "Nilai"]],
      body: [
        ["Total Pendapatan", formatCurrency(totalRevenue)],
        ["Total Biaya Layanan", formatCurrency(totalFees)],
        ["Laba Layanan", formatCurrency(totalProfit)],
        ["Jumlah Transaksi", String(transactionCount)],
      ],
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 81, 213] },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;

    if (byService.length > 0) {
      const y2 = finalY + 8;
      autoTable(doc, {
        startY: y2,
        head: [["Layanan", "Transaksi", "Pendapatan", "Laba"]],
        body: byService.map((s) => [
          s.label,
          String(s.count),
          formatCurrency(s.revenue),
          formatCurrency(s.profit),
        ]),
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 81, 213] },
      });

      finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
    }
  }

  // ── Expense Summary ──
  if (data.expenses.length > 0) {
    const y = finalY + 12;
    doc.setFontSize(12);
    doc.text("Detail Pengeluaran", marginX, y);

    const expenseRows = data.expenses.map((e) => [
      e.expenseNumber,
      formatDateShort(e.expenseDate),
      e.title,
      formatCurrency(e.totalAmount),
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [["No. Pengeluaran", "Tanggal", "Judul", "Biaya"]],
      body: expenseRows,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 81, 213] },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
  }

  // ── Transaction List ──
  if (data.transactions.length > 0) {
    const y = finalY + 12;
    doc.setFontSize(12);
    doc.text("Daftar Transaksi", marginX, y);

    const txnRows = data.transactions.map((t) => [
      t.receiptNumber || "—",
      formatDateShort(t.date),
      t.customerName || "—",
      PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod,
      t.status,
      formatCurrency(t.totalAmount),
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [["No. Nota", "Tanggal", "Pelanggan", "Metode", "Status", "Total"]],
      body: txnRows,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 81, 213] },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
  }

  // ── Top Products ──
  if (data.topProducts.length > 0) {
    const y = finalY + 12;
    doc.setFontSize(12);
    doc.text("Produk Terlaris", marginX, y);

    const productRows = data.topProducts.map((p) => [
      p.name,
      `${p.qty} Unit`,
      formatCurrency(p.revenue),
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [["Produk", "Terjual", "Pendapatan"]],
      body: productRows,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 81, 213] },
    });

    finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? finalY;
  }

  // ── Footer ──
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Dibuat oleh ZAKY STORE", pageW / 2, finalY + 16, { align: "center" });

  doc.save(`laporan-${data.startDate}.pdf`);
}
