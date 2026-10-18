import { getLocalDBAsync, fromPouch } from "./pouchdb";
import { formatCurrency, formatDate, formatDateShort, formatTime } from "./formatters";
import { saveOrShareFile } from "./file-saver";
import type { PaymentMethod } from "@/types";
// NOTE: jspdf, jspdf-autotable, xlsx dimuat dinamis di dalam fungsi export
// agar tidak masuk ke bundle awal (hemat ~1,5MB parse saat startup).

const COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
  "expenses",
  "capital",
  "stock_in_receipts",
] as const;

// ── Excel ──

export async function exportToExcel(): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  for (const name of COLLECTIONS) {
    const db = await getLocalDBAsync(name);
    const res = await db.allDocs({ include_docs: true });
    const rows = res.rows
      .filter((r) => r.doc && typeof r.doc === "object")
      .map((r) =>
        fromPouch<Record<string, unknown>>(r.doc as unknown as { _id: string } & Record<string, unknown>),
      );

    // Ratakan nested object/array (seperti items) agar tidak merusak cell worksheet
    const sanitizedRows = rows.map((row) => {
      const clean: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(row)) {
        if (val !== null && typeof val === "object") {
          clean[key] = JSON.stringify(val);
        } else {
          clean[key] = val;
        }
      }
      return clean;
    });

    const ws = XLSX.utils.json_to_sheet(sanitizedRows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const filename = `zaky-store-data-${new Date().toISOString().slice(0, 10)}.xlsx`;

  await saveOrShareFile({
    filename,
    data: buf,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    title: "Export Data Excel",
  });
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

export interface PDFCapitalCategorySummary {
  initial: number;
  addition: number;
  withdrawal: number;
  current: number;
}

export interface PDFCapitalSummary {
  warungCapital?: PDFCapitalCategorySummary;
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
  transactions: PDFTransactionRow[];
  expenses: PDFExpenseRow[];
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Tunai",
  kasbon: "Kasbon",
  qris: "QRIS",
};

export async function exportToPDF(data: PDFReportData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
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

  const filename = `laporan-${data.startDate}.pdf`;
  const pdfBytes = doc.output("arraybuffer");
  await saveOrShareFile({
    filename,
    data: pdfBytes,
    mimeType: "application/pdf",
    title: `Laporan Penjualan ${data.periodLabel}`,
  });
}

