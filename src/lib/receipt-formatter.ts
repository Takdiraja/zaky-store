import type { CartItem, PaymentMethod, PaperWidth } from "@/types";
import { formatCurrency, formatCurrencyInline } from "@/lib/formatters";
import { STORE_ADDRESS, STORE_PHONE } from "@/lib/constants";

/**
 * Receipt layout engine — pure text rendering shared by the thermal
 * (ESC/POS) and WhatsApp receipts. All alignment is computed by character
 * width (no tabs), and long names are wrapped to the column width so the
 * layout never breaks on 58mm or 80mm paper.
 */

export const LINE_58 = 32;
export const LINE_80 = 48;

export function lineWidth(width: PaperWidth): number {
  return width === 58 ? LINE_58 : LINE_80;
}

export interface ReceiptParams {
  items: CartItem[];
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  date: string;
  customerName?: string;
  paperWidth: PaperWidth;
  mode?: "thermal" | "whatsapp";
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  cashierName?: string;
  /** Teks footer custom (default "Terima kasih"). */
  footerText?: string;
}

/* ── Alignment primitives ── */

export function padLeft(text: string, w: number): string {
  if (text.length >= w) return text;
  return text + " ".repeat(w - text.length);
}

export function padRight(text: string, w: number): string {
  if (text.length >= w) return text;
  return " ".repeat(w - text.length) + text;
}

/** Centers text within `w` chars, balancing padding on both sides. */
export function centerText(text: string, w: number, padChar = " "): string {
  if (text.length >= w) return text;
  const total = w - text.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return padChar.repeat(left) + text + padChar.repeat(right);
}

export function separatorLine(w: number, char = "-"): string {
  return char.repeat(Math.max(1, w));
}

/** Splits a long name into lines that fit `w` chars, keeping whole words. */
export function wrapText(text: string, w: number): string[] {
  if (w <= 0) return [];
  const words = text.split(/\s+/).filter((x) => x.length > 0);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    // A single word longer than the line width must be hard-broken.
    if (word.length > w) {
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      for (let i = 0; i < word.length; i += w) {
        lines.push(word.slice(i, i + w));
      }
      continue;
    }
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length <= w) {
      cur = candidate;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [""];
}

/** Renders "label" left-aligned and "value" right-aligned on one line. */
export function pairLine(label: string, value: string, w: number): string {
  const labelT = label.trim();
  const valueT = value.trim();
  if (labelT.length + valueT.length >= w) {
    // Not enough room on one line — stack them.
    return `${labelT}\n${padRight(valueT, w)}`;
  }
  const pad = w - labelT.length - valueT.length;
  return `${labelT}${" ".repeat(pad)}${valueT}`;
}

/* ── Section builders ── */

function addSep(lines: string[], w: number, char = "-") {
  lines.push(separatorLine(w, char));
}

function addBlank(lines: string[], n = 1) {
  for (let i = 0; i < n; i++) lines.push("");
}

function addMeta(lines: string[], label: string, value: string, w: number) {
  const full = `${label}: ${value}`;
  if (full.length <= w) {
    lines.push(full);
    return;
  }
  // Long metadata (e.g. Tanggal + time) wraps onto a continuation line.
  const head = `${label}:`;
  wrapText(value, w - head.length - 1).forEach((l, idx) =>
    lines.push(idx === 0 ? `${head} ${l}` : `  ${l}`),
  );
}

function addItems(lines: string[], items: CartItem[], w: number) {
  for (const item of items) {
    // Item name wraps to a slightly narrower column so a long name never
    // runs edge-to-edge; continuation lines are indented for readability.
    const nameLines = wrapText(item.name, w - 2);
    nameLines.forEach((l, idx) => lines.push(idx === 0 ? l : `  ${l}`));
    // Compact qty × price on the left, subtotal right-aligned.
    const qtyPrice = `${item.quantity} x ${formatCurrencyInline(item.sellPrice)}`;
    lines.push(pairLine(" " + qtyPrice, formatCurrencyInline(item.subtotal), w));
  }
}

function addTotal(lines: string[], label: string, value: string, w: number, big = false) {
  if (!big) {
    lines.push(pairLine(label, value, w));
    return;
  }
  // Grand total: emphasize the label (uppercase) but keep the currency
  // value as-is ("Rp 39.000", not "RP 39.000").
  const pair = pairLine(label, value, w);
  const split = pair.split("\n");
  if (split.length > 1) {
    lines.push(split[0].toUpperCase(), split[1]);
  } else {
    lines.push(pairLine(label.toUpperCase(), value, w));
  }
}

/* ── Date helpers ── */

function formatDateParts(dateStr: string): { dateStr: string; timeStr: string } {
  // Date-only strings parse as UTC midnight — pin them to local midnight so
  // the day (and 07:00 WIB) never shifts. Full timestamps pass through.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T00:00:00`)
    : new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { dateStr: "", timeStr: "" };
  const date = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return { dateStr: date, timeStr: time };
}

/* ── Thermal receipt ── */

export function buildThermalReceiptText(params: ReceiptParams): string {
  const {
    items,
    totalAmount,
    amountPaid,
    change,
    paymentMethod,
    receiptNumber,
    date,
    customerName,
    paperWidth,
    storeName = "KEDAI ZAKY 93",
    storeAddress = STORE_ADDRESS,
    storePhone = STORE_PHONE,
    cashierName,
    footerText = "Terima kasih",
  } = params;
  const w = lineWidth(paperWidth);
  const isKasbon = paymentMethod === "kasbon";
  const isCash = paymentMethod === "cash";
  const { dateStr, timeStr } = formatDateParts(date);

  const lines: string[] = [];

  // ── Header ──
  addBlank(lines);
  // Header lines are emitted unpadded; the ESC/POS renderer centers them
  // with ESC a 1 so they're never double-padded (which would push the text
  // toward the middle of the line).
  lines.push(storeName);
  if (storeAddress) {
    wrapText(storeAddress, w).forEach((l) => lines.push(l));
  }
  if (storePhone) {
    lines.push(`Telp: ${storePhone}`);
  }
  addBlank(lines);
  addSep(lines, w, "=");

  // ── Metadata ──
  addMeta(lines, "No Nota", receiptNumber || "—", w);
  if (dateStr) addMeta(lines, "Tanggal", `${dateStr} ${timeStr} WIB`.trim(), w);
  if (cashierName) addMeta(lines, "Kasir", cashierName, w);
  if (customerName) addMeta(lines, "Pelanggan", customerName, w);

  if (isKasbon) {
    lines.push("");
    lines.push(centerText("STATUS: KASBON", w));
  }

  addSep(lines, w);
  addBlank(lines);

  // ── Items ──
  addItems(lines, items, w);
  addBlank(lines);
  addSep(lines, w);

  // ── Totals ──
  if (isKasbon) {
    addTotal(lines, "TOTAL HUTANG", formatCurrency(totalAmount), w, true);
    addBlank(lines);
    addSep(lines, w, "=");
    addBlank(lines);
    wrapText("Mohon dilunasi sesuai kesepakatan bersama.", w).forEach((l) =>
      lines.push(centerText(l, w)),
    );
    addBlank(lines);
    lines.push(centerText("Terima Kasih", w));
  } else {
    addTotal(lines, "TOTAL", formatCurrency(totalAmount), w, true);
    if (isCash && amountPaid > 0) {
      addTotal(lines, "TUNAI", formatCurrency(amountPaid), w);
      addTotal(lines, "KEMBALI", formatCurrency(change), w);
    }
    addBlank(lines);
    addSep(lines, w, "=");
    addBlank(lines);
    if (paymentMethod === "qris") {
      lines.push(centerText("QRIS", w));
      lines.push(centerText("Pembayaran Non-Tunai", w));
      addBlank(lines);
    }
    lines.push(centerText(footerText, w));
    lines.push(centerText("🙏", w));
  }

  // ── Footer ──
  addBlank(lines);
  lines.push(centerText(storeName, w));
  addBlank(lines);
  lines.push(separatorLine(w, "="));

  return lines.join("\n");
}

/* ── WhatsApp receipt ── */

export function buildWhatsAppReceiptText(params: ReceiptParams): string {
  const {
    items,
    totalAmount,
    amountPaid,
    change,
    paymentMethod,
    receiptNumber,
    date,
    customerName,
    paperWidth,
    storeName = "KEDAI ZAKY 93",
    storeAddress = STORE_ADDRESS,
    storePhone = STORE_PHONE,
  } = params;
  const w = lineWidth(paperWidth);
  const isKasbon = paymentMethod === "kasbon";
  const isCash = paymentMethod === "cash";
  const { dateStr, timeStr } = formatDateParts(date);

  const lines: string[] = [];

  // ── Header ──
  lines.push(storeName);
  lines.push(storeAddress);
  if (storePhone) lines.push(`Telp: ${storePhone}`);
  addBlank(lines);
  addSep(lines, w);

  // ── Metadata ──
  addMeta(lines, "No Nota", receiptNumber || "—", w);
  if (dateStr) addMeta(lines, "Tanggal", `${dateStr} ${timeStr} WIB`.trim(), w);
  if (customerName) addMeta(lines, "Pelanggan", customerName, w);
  if (isKasbon) {
    lines.push("");
    lines.push("*STATUS: KASBON*");
  }
  addBlank(lines);
  addSep(lines, w);
  addBlank(lines);

  // ── Items ──
  addItems(lines, items, w);
  addBlank(lines);
  addSep(lines, w);

  // ── Totals ──
  if (isKasbon) {
    addTotal(lines, "TOTAL HUTANG", formatCurrency(totalAmount), w, true);
    addBlank(lines);
    addSep(lines, w, "=");
    addBlank(lines);
    wrapText("Mohon dilunasi sesuai kesepakatan bersama.", w).forEach((l) => lines.push(l));
    addBlank(lines);
    lines.push("Terima Kasih");
  } else {
    addTotal(lines, "TOTAL", formatCurrency(totalAmount), w, true);
    if (isCash && amountPaid > 0) {
      addTotal(lines, "Bayar", formatCurrency(amountPaid), w);
      addTotal(lines, "Kembalian", formatCurrency(change), w);
    }
    addBlank(lines);
    addSep(lines, w, "=");
    addBlank(lines);
    if (paymentMethod === "qris") {
      lines.push("QRIS");
      lines.push("Pembayaran Non-Tunai");
      addBlank(lines);
    }
    lines.push("Terima kasih telah berbelanja.");
  }

  // ── Footer ──
  addBlank(lines);
  lines.push(storeName);

  return lines.join("\n");
}

export function buildReceiptText(params: ReceiptParams): string {
  if (params.mode === "whatsapp") {
    return buildWhatsAppReceiptText(params);
  }
  return buildThermalReceiptText(params);
}

export interface StockInReceiptParams {
  receiptNumber: string;
  receiptDate: string;
  supplier?: string | null;
  notes?: string;
  items: Array<{
    productName: string;
    qty: number;
    unitName: string;
    buyPricePerUnit: number;
    stockAdded: number;
    subtotal: number;
  }>;
  totalAmount: number;
  paperWidth: PaperWidth;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export function buildStockInReceiptText(params: StockInReceiptParams): string {
  const {
    receiptNumber,
    receiptDate,
    supplier,
    notes,
    items,
    totalAmount,
    paperWidth,
    storeName = "KEDAI ZAKY 93",
    storeAddress = STORE_ADDRESS,
    storePhone = STORE_PHONE,
  } = params;
  const w = lineWidth(paperWidth);
  const { dateStr, timeStr } = formatDateParts(receiptDate);
  const lines: string[] = [];

  // Header
  addBlank(lines);
  lines.push(storeName);
  if (storeAddress) {
    wrapText(storeAddress, w).forEach((l) => lines.push(l));
  }
  if (storePhone) {
    lines.push(`Telp: ${storePhone}`);
  }
  addBlank(lines);
  addSep(lines, w, "=");
  lines.push(centerText("NOTA BARANG MASUK", w));
  addSep(lines, w, "=");

  // Metadata
  addMeta(lines, "No Nota", receiptNumber || "-", w);
  if (dateStr) addMeta(lines, "Tanggal", `${dateStr} ${timeStr} WIB`.trim(), w);
  if (supplier) addMeta(lines, "Supplier", supplier, w);
  addSep(lines, w, "-");

  // Items
  for (const it of items) {
    wrapText(it.productName, w).forEach((l) => lines.push(l));
    const leftDetail = `  ${it.qty} ${it.unitName} x ${formatCurrencyInline(it.buyPricePerUnit)}`;
    const rightSub = formatCurrencyInline(it.subtotal);
    lines.push(pairLine(leftDetail, rightSub, w));
    lines.push(`  (+${it.stockAdded} pcs stok)`);
  }
  addSep(lines, w, "=");

  // Total
  lines.push(pairLine("TOTAL KULAKAN", formatCurrencyInline(totalAmount), w));
  addSep(lines, w, "=");

  if (notes) {
    wrapText(`Catatan: ${notes}`, w).forEach((l) => lines.push(l));
    addBlank(lines);
  }

  // Footer
  lines.push(centerText("Stok & Modal Tercatat Otomatis", w));
  addBlank(lines);

  return lines.join("\n");
}
