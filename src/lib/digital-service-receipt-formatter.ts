import type { PaperWidth } from "@/types";
import {
  lineWidth,
  centerText,
  separatorLine,
  wrapText,
  pairLine,
} from "@/lib/receipt-formatter";
import { formatCurrencyInline } from "@/lib/formatters";
import { STORE_ADDRESS, STORE_PHONE } from "@/lib/constants";
import { getServiceConfig } from "@/lib/digital-services";

/**
 * Digital-services receipt layout engine.
 *
 * Mirrors the product-sales receipt template (header, metadata, totals,
 * footer) while rendering service-specific fields: service name, customer
 * identifier, nominal amount, and service fee. The same layout is used for
 * the thermal (ESC/POS) and WhatsApp receipts so every transaction type
 * prints consistently.
 */

export interface DigitalServiceReceiptParams {
  serviceType: string;
  customerIdentifier: string;
  subService?: string | null;
  tokenCode?: string | null;
  customerName?: string | null;
  nominalAmount: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: "cash" | "qris";
  receiptNumber: string;
  transactionNumber: string;
  date: string;
  paperWidth: PaperWidth;
  mode?: "thermal" | "whatsapp";
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  operatorName?: string;
  notes?: string | null;
}

/* ── Meta line: "label: value" with wrapping ── */
function addMeta(lines: string[], label: string, value: string, w: number) {
  const full = `${label}: ${value}`;
  if (full.length <= w) {
    lines.push(full);
    return;
  }
  const head = `${label}:`;
  wrapText(value, w - head.length - 1).forEach((l, idx) =>
    lines.push(idx === 0 ? `${head} ${l}` : `  ${l}`),
  );
}

function addBlank(lines: string[], n = 1) {
  for (let i = 0; i < n; i++) lines.push("");
}

function addSep(lines: string[], w: number, char = "-") {
  lines.push(separatorLine(w, char));
}

function addTotal(
  lines: string[],
  label: string,
  value: string,
  w: number,
  big = false,
) {
  if (!big) {
    lines.push(pairLine(label, value, w));
    return;
  }
  const pair = pairLine(label, value, w);
  const split = pair.split("\n");
  if (split.length > 1) {
    lines.push(split[0].toUpperCase(), split[1]);
  } else {
    lines.push(pairLine(label.toUpperCase(), value, w));
  }
}

function formatDateParts(dateStr: string): { dateStr: string; timeStr: string } {
  // Date-only strings parse as UTC midnight — pin them to local midnight so
  // the day (and 07:00 WIB) never shifts. Full timestamps pass through.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T00:00:00`)
    : new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { dateStr: "", timeStr: "" };
  const dateStr2 = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr2 = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return { dateStr: dateStr2, timeStr: timeStr2 };
}

export function buildDigitalServiceThermalReceiptText(
  params: DigitalServiceReceiptParams,
): string {
  const {
    serviceType,
    customerIdentifier,
    subService,
    tokenCode,
    customerName,
    nominalAmount,
    serviceFee,
    totalAmount,
    paymentMethod,
    receiptNumber,
    transactionNumber,
    date,
    paperWidth,
    storeName = "ZAKY STORE",
    storeAddress = STORE_ADDRESS,
    storePhone = STORE_PHONE,
    operatorName,
    notes,
  } = params;
  const w = lineWidth(paperWidth);
  const service = getServiceConfig(serviceType);
  const isCash = paymentMethod === "cash";
  const { dateStr, timeStr } = formatDateParts(date);

  const lines: string[] = [];

  // ── Header (centered by the ESC/POS renderer) ──
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

  // ── Metadata ──
  addMeta(lines, "No Nota", receiptNumber || "—", w);
  addMeta(lines, "Transaksi", transactionNumber || "—", w);
  if (dateStr) addMeta(lines, "Tanggal", `${dateStr} ${timeStr} WIB`.trim(), w);
  if (operatorName) addMeta(lines, "Kasir", operatorName, w);

  addSep(lines, w);
  addBlank(lines);

  // ── Service info ──
  lines.push(service.label.toUpperCase());
  if (subService) {
    addMeta(lines, service.optionsLabel ?? "Opsi", subService, w);
  }
  addMeta(lines, service.identifierReceiptLabel, customerIdentifier || "—", w);
  if (customerName) addMeta(lines, "Pelanggan", customerName, w);
  if (notes) addMeta(lines, "Catatan", notes, w);

  // ── Token code below the note ──
  // The title prints at the same size as the other titles (left-aligned),
  // right after the "Catatan" line; the code itself sits below it on its own
  // left-aligned line with breathing room, marked with "@@" so the ESC/POS
  // renderer prints it tall and bold for the customer to read.
  if (tokenCode) {
    addBlank(lines);
    lines.push((service.tokenLabel ?? "Kode Token").toUpperCase());
    addBlank(lines);
    lines.push(`@@${tokenCode}`);
  }

  addBlank(lines);
  addSep(lines, w);

  // ── Totals ──
  addTotal(lines, "NOMINAL", formatCurrencyInline(nominalAmount), w);
  if (serviceFee > 0) {
    addTotal(lines, "BIAYA ADMIN", formatCurrencyInline(serviceFee), w);
  }
  addTotal(lines, "TOTAL", formatCurrencyInline(totalAmount), w, true);
  if (isCash) {
    lines.push(centerText("Tunai", w));
  } else {
    lines.push(centerText("QRIS", w));
    lines.push(centerText("Pembayaran Non-Tunai", w));
  }
  addBlank(lines);
  addSep(lines, w, "=");
  addBlank(lines);
  lines.push(centerText("Terima kasih", w));
  lines.push(centerText("🙏", w));

  // ── Footer ──
  addBlank(lines);
  lines.push(centerText(storeName, w));
  addBlank(lines);
  lines.push(separatorLine(w, "="));

  return lines.join("\n");
}

export function buildDigitalServiceWhatsAppReceiptText(
  params: DigitalServiceReceiptParams,
): string {
  const {
    serviceType,
    customerIdentifier,
    subService,
    tokenCode,
    customerName,
    nominalAmount,
    serviceFee,
    totalAmount,
    paymentMethod,
    receiptNumber,
    transactionNumber,
    date,
    paperWidth,
    storeName = "ZAKY STORE",
    storeAddress = STORE_ADDRESS,
    storePhone = STORE_PHONE,
    notes,
  } = params;
  const w = lineWidth(paperWidth);
  const service = getServiceConfig(serviceType);
  const isCash = paymentMethod === "cash";
  const { dateStr, timeStr } = formatDateParts(date);

  const lines: string[] = [];

  lines.push(storeName);
  lines.push(storeAddress);
  if (storePhone) lines.push(`Telp: ${storePhone}`);
  addBlank(lines);
  addSep(lines, w);

  addMeta(lines, "No Nota", receiptNumber || "—", w);
  addMeta(lines, "Transaksi", transactionNumber || "—", w);
  if (dateStr) addMeta(lines, "Tanggal", `${dateStr} ${timeStr} WIB`.trim(), w);
  addBlank(lines);
  addSep(lines, w);
  addBlank(lines);

  lines.push(service.label.toUpperCase());
  if (subService) {
    addMeta(lines, service.optionsLabel ?? "Opsi", subService, w);
  }
  addMeta(lines, service.identifierReceiptLabel, customerIdentifier || "—", w);
  if (customerName) addMeta(lines, "Pelanggan", customerName, w);
  if (notes) addMeta(lines, "Catatan", notes, w);

  // ── Token code below the note ──
  // Mirrors the thermal receipt: title at the normal size, code below it on
  // its own line — both left-aligned.
  if (tokenCode) {
    addBlank(lines);
    lines.push((service.tokenLabel ?? "Kode Token").toUpperCase());
    addBlank(lines);
    lines.push(tokenCode);
  }

  addBlank(lines);
  addSep(lines, w);

  addTotal(lines, "NOMINAL", formatCurrencyInline(nominalAmount), w);
  if (serviceFee > 0) {
    addTotal(lines, "BIAYA ADMIN", formatCurrencyInline(serviceFee), w);
  }
  addTotal(lines, "TOTAL", formatCurrencyInline(totalAmount), w, true);
  addBlank(lines);
  lines.push(isCash ? "Pembayaran Tunai" : "Pembayaran QRIS");
  addBlank(lines);
  lines.push("Terima kasih telah menggunakan layanan kami.");

  addBlank(lines);
  lines.push(storeName);

  return lines.join("\n");
}

export function buildDigitalServiceReceiptText(
  params: DigitalServiceReceiptParams,
): string {
  if (params.mode === "whatsapp") {
    return buildDigitalServiceWhatsAppReceiptText(params);
  }
  return buildDigitalServiceThermalReceiptText(params);
}
