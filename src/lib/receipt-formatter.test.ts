import { describe, it, expect } from "vitest";
import {
  buildReceiptText,
  buildThermalReceiptText,
  buildWhatsAppReceiptText,
  centerText,
  lineWidth,
  pairLine,
  padLeft,
  padRight,
  wrapText,
} from "./receipt-formatter";
import type { CartItem, PaperWidth } from "@/types";

const items: CartItem[] = [
  {
    productId: "p1",
    name: "Kopi Susu Gula Aren",
    quantity: 2,
    buyPrice: 5000,
    sellPrice: 12000,
    subtotal: 24000,
    profit: 14000,
  },
  {
    productId: "p2",
    name: "Teh",
    quantity: 1,
    buyPrice: 1000,
    sellPrice: 3000,
    subtotal: 3000,
    profit: 2000,
  },
];

const base = {
  items,
  totalAmount: 27000,
  amountPaid: 50000,
  change: 23000,
  paymentMethod: "cash" as const,
  receiptNumber: "TRX-0001",
  date: "2026-08-05T10:32:00.000Z",
  paperWidth: 58 as PaperWidth,
};

describe("receipt formatter", () => {
  it("lineWidth maps 58→32 and 80→48", () => {
    expect(lineWidth(58)).toBe(32);
    expect(lineWidth(80)).toBe(48);
  });

  it("pads left and right to the column width", () => {
    expect(padLeft("abc", 6)).toBe("abc   ");
    expect(padRight("abc", 6)).toBe("   abc");
    expect(padLeft("abcdef", 4)).toBe("abcdef"); // never truncates
  });

  it("centers text", () => {
    expect(centerText("x", 5)).toBe("  x  ");
  });

  it("wraps long names without breaking layout", () => {
    const wrapped = wrapText("Kopi Susu Gula Aren", 20);
    expect(wrapped.join(" ").replace(/\s+/g, " ").trim()).toBe("Kopi Susu Gula Aren");
    expect(wrapped.every((l) => l.length <= 20)).toBe(true);
  });

  it("hard-breaks a single word longer than the width", () => {
    const wrapped = wrapText("abcdefghijklmnopqrstuvwxyz", 10);
    expect(wrapped.every((l) => l.length <= 10)).toBe(true);
    expect(wrapped.join("")).toBe("abcdefghijklmnopqrstuvwxyz");
  });

  it("pairLine aligns label left and value right", () => {
    const line = pairLine("TOTAL", "Rp 27.000", 20);
    expect(line.startsWith("TOTAL")).toBe(true);
    expect(line.endsWith("Rp 27.000")).toBe(true);
    expect(line.length).toBe(20);
  });

  it("pairLine stacks label and value when they don't fit", () => {
    const line = pairLine("TOTAL HUTANG", "Rp 27.000.000.000", 20);
    const [label, value] = line.split("\n");
    expect(label.trim()).toBe("TOTAL HUTANG");
    expect(value.trim()).toBe("Rp 27.000.000.000");
  });

  it("builds a cash thermal receipt with store header, items, totals", () => {
    const text = buildThermalReceiptText(base);
    expect(text).toContain("ZAKY STORE");
    expect(text).toContain("No Nota: TRX-0001");
    expect(text).toContain("Kopi Susu Gula Aren");
    expect(text).toMatch(/2 x Rp\s*12\.000/);
    expect(text).toContain("TOTAL");
    expect(text).toContain("TUNAI");
    expect(text).toContain("KEMBALI");
    expect(text).toContain("Terima kasih");
    expect(text).not.toContain("Catat. Kelola. Tumbuh.");
    // No QR section on the receipt — it wasted paper.
    expect(text).not.toContain("[[QR]]");
    expect(text).not.toContain("Scan QR");
    // No stray tabs — alignment is width-based.
    expect(text).not.toContain("\t");
  });

  it("builds a kasbon thermal receipt with TOTAL HUTANG", () => {
    const text = buildThermalReceiptText({ ...base, paymentMethod: "kasbon" });
    expect(text).toContain("STATUS: KASBON");
    expect(text).toContain("TOTAL HUTANG");
    expect(text).toContain("Mohon dilunasi");
    expect(text).not.toContain("TUNAI");
  });

  it("builds a QRIS thermal receipt", () => {
    const text = buildThermalReceiptText({ ...base, paymentMethod: "qris" });
    expect(text).toContain("QRIS");
    expect(text).toContain("Pembayaran Non-Tunai");
  });

  it("renders 80mm receipts with the wider column count", () => {
    const text = buildThermalReceiptText({ ...base, paperWidth: 80 });
    const widths = text.split("\n").map((l) => l.length);
    expect(Math.max(...widths)).toBeLessThanOrEqual(48);
  });

  it("never emits a line wider than the column width", () => {
    const text = buildThermalReceiptText({ ...base, items: [...items, { ...items[0], name: "Es Teh Manis Jumbo Besar Extra Large" }] });
    const widths = text.split("\n").map((l) => l.length);
    expect(Math.max(...widths)).toBeLessThanOrEqual(32);
  });

  it("renders WhatsApp receipts without emoji and with the same structure", () => {
    const text = buildWhatsAppReceiptText(base);
    expect(text).not.toContain("\t");
    expect(text).toContain("ZAKY STORE");
    expect(text).toContain("TOTAL");
    expect(text).toContain("Bayar");
    expect(text).toContain("Kembalian");
  });

  it("buildReceiptText dispatches by mode", () => {
    const thermal = buildReceiptText(base);
    const wa = buildReceiptText({ ...base, mode: "whatsapp" });
    expect(thermal).toContain("KEMBALI");
    expect(wa).toContain("Kembalian");
  });

  it("includes store address and phone when provided", () => {
    const text = buildThermalReceiptText({
      ...base,
      storeAddress: "Jl. Resoyudan No. 12, Yogyakarta",
      storePhone: "0812-3456-7890",
    });
    expect(text).toContain("Resoyudan");
    expect(text).toContain("0812-3456-7890");
  });
});
