import { describe, it, expect } from "vitest";
import {
  buildDigitalServiceReceiptText,
  buildDigitalServiceThermalReceiptText,
  buildDigitalServiceWhatsAppReceiptText,
} from "./digital-service-receipt-formatter";
import {
  DIGITAL_SERVICES,
  getServiceConfig,
  getSubServiceLabel,
} from "./digital-services";

const base = {
  serviceType: "pulsa",
  customerIdentifier: "081234567890",
  customerName: "Budi",
  nominalAmount: 20000,
  serviceFee: 1500,
  totalAmount: 21500,
  paymentMethod: "cash" as const,
  receiptNumber: "DSV-20260814-001",
  transactionNumber: "DSV-20260814-001",
  date: "2026-08-14T09:30:00.000Z",
  paperWidth: 58 as const,
};

describe("digital service receipt formatter", () => {
  it("builds a thermal receipt with service info and totals", () => {
    const text = buildDigitalServiceThermalReceiptText(base);
    expect(text).toContain("ZAKY STORE");
    expect(text).toContain("No Nota: DSV-20260814-001");
    expect(text).toContain("Transaksi: DSV-20260814-001");
    expect(text).toContain("PULSA");
    expect(text).toContain("No. HP: 081234567890");
    expect(text).toContain("Pelanggan: Budi");
    expect(text).toContain("NOMINAL");
    expect(text).toContain("BIAYA ADMIN");
    expect(text).toContain("TOTAL");
    expect(text).toContain("Terima kasih");
    // No stray tabs — width-based alignment.
    expect(text).not.toContain("\t");
  });

  it("never emits a line wider than the column width", () => {
    const text = buildDigitalServiceThermalReceiptText(base);
    const widths = text.split("\n").map((l) => l.length);
    expect(Math.max(...widths)).toBeLessThanOrEqual(32);
  });

  it("renders 80mm receipts with the wider column count", () => {
    const text = buildDigitalServiceThermalReceiptText({ ...base, paperWidth: 80 });
    const widths = text.split("\n").map((l) => l.length);
    expect(Math.max(...widths)).toBeLessThanOrEqual(48);
  });

  it("shows QRIS label for qris payments and Tunai for cash", () => {
    const qris = buildDigitalServiceThermalReceiptText({
      ...base,
      paymentMethod: "qris",
    });
    expect(qris).toContain("QRIS");
    expect(qris).toContain("Pembayaran Non-Tunai");

    const cash = buildDigitalServiceThermalReceiptText(base);
    expect(cash).toContain("Tunai");
    // "Tunai" must be on its own line (centered), not "Pembayaran Non-Tunai".
    const lines = cash.split("\n");
    expect(lines.some((l) => l.trim() === "Tunai")).toBe(true);
    expect(lines.some((l) => l.trim() === "QRIS")).toBe(false);
  });

  it("omits BIAYA ADMIN line when the fee is zero", () => {
    const text = buildDigitalServiceThermalReceiptText({ ...base, serviceFee: 0 });
    expect(text).not.toContain("BIAYA ADMIN");
    expect(text).toContain("TOTAL");
  });

  it("includes notes when provided", () => {
    const text = buildDigitalServiceThermalReceiptText({ ...base, notes: "Beli token tengah malam" });
    expect(text).toContain("Catatan: Beli token tengah malam");
  });

  it("builds WhatsApp receipts with the same structure and no emoji", () => {
    const text = buildDigitalServiceWhatsAppReceiptText(base);
    expect(text).not.toContain("\t");
    expect(text).toContain("ZAKY STORE");
    expect(text).toContain("PULSA");
    expect(text).toContain("TOTAL");
    expect(text).not.toContain("🙏");
  });

  it("renders the sub-service (game) line on thermal receipts", () => {
    const text = buildDigitalServiceThermalReceiptText({
      ...base,
      serviceType: "game_topup",
      subService: "Free Fire",
      customerIdentifier: "1234567890",
    });
    expect(text).toContain("TOP UP GAME");
    expect(text).toContain("Pilih Game: Free Fire");
    expect(text).toContain("User ID: 1234567890");
    // No stray tabs — width-based alignment.
    expect(text).not.toContain("\t");
  });

  it("renders the sub-service (game) line on WhatsApp receipts", () => {
    const text = buildDigitalServiceWhatsAppReceiptText({
      ...base,
      serviceType: "game_topup",
      subService: "Mobile Legends",
      customerIdentifier: "987654321",
    });
    expect(text).toContain("Pilih Game: Mobile Legends");
    expect(text).not.toContain("🙏");
  });

  it("renders provider option on pulsa thermal receipt", () => {
    const text = buildDigitalServiceThermalReceiptText({
      ...base,
      serviceType: "pulsa",
      subService: "Telkomsel",
      customerIdentifier: "081234567890",
    });
    expect(text).toContain("Pilih Provider: Telkomsel");
    expect(text).toContain("No. HP: 081234567890");
  });

  it("renders bank destination on transfer WhatsApp receipt", () => {
    const text = buildDigitalServiceWhatsAppReceiptText({
      ...base,
      serviceType: "transfer",
      subService: "BRI",
      customerIdentifier: "1234567890",
    });
    expect(text).toContain("Pilih Bank Tujuan: BRI");
    expect(text).not.toContain("🙏");
  });

  it("renders the PLN token code on thermal receipts", () => {
    const text = buildDigitalServiceThermalReceiptText({
      ...base,
      serviceType: "pln_prepaid",
      customerIdentifier: "123456789012",
      tokenCode: "1234-5678-9012-3456",
    });
    const lines = text.split("\n").map((l) => l.trim());
    expect(text).toContain("TOKEN PLN");
    expect(text).toContain("No. Meter: 123456789012");
    // The token title is a fixed, normal-size line placed after the service
    // info (below the "Catatan" note); the code sits below it on its own
    // line, marked with the "@@" large-bold prefix — both left-aligned.
    const titleIdx = lines.indexOf("KODE TOKEN");
    expect(titleIdx).toBeGreaterThan(0);
    expect(lines[titleIdx + 2]).toBe("@@1234-5678-9012-3456");
    // No stray tabs — width-based alignment.
    expect(text).not.toContain("\t");
  });

  it("renders the PLN token code on WhatsApp receipts", () => {
    const text = buildDigitalServiceWhatsAppReceiptText({
      ...base,
      serviceType: "pln_prepaid",
      customerIdentifier: "123456789012",
      tokenCode: "1234-5678-9012-3456",
    });
    const lines = text.split("\n").map((l) => l.trim());
    expect(lines).toContain("KODE TOKEN");
    expect(lines).toContain("1234-5678-9012-3456");
    const titleIdx = lines.indexOf("KODE TOKEN");
    expect(titleIdx).toBeGreaterThan(0);
    expect(lines[titleIdx + 2]).toBe("1234-5678-9012-3456");
  });

  it("buildReceiptText dispatches by mode", () => {
    const thermal = buildDigitalServiceReceiptText(base);
    const wa = buildDigitalServiceReceiptText({ ...base, mode: "whatsapp" });
    expect(thermal).toContain("Tunai");
    expect(wa).toContain("Pembayaran Tunai");
  });
});

describe("digital services catalog", () => {
  it("exposes all supported services with required fields", () => {
    const ids = DIGITAL_SERVICES.map((s) => s.id);
    expect(ids).toContain("bpjs");
    expect(ids).toContain("pdam");
    expect(ids).toContain("internet");
    expect(ids).toContain("cable_tv");
    expect(ids).toContain("pln_prepaid");
    expect(ids).toContain("pln_postpaid");
    expect(ids).toContain("pulsa");
    expect(ids).toContain("data");
    expect(ids).toContain("ewallet");
    expect(ids).toContain("transfer");
    expect(ids).toContain("tarik_tunai");
    expect(ids).toContain("game_topup");
  });

  it("tarik_tunai exposes bank/e-wallet options (BRI, BCA, Mandiri)", () => {
    const ttk = getServiceConfig("tarik_tunai");
    expect(ttk.label).toBe("Tarik Tunai");
    expect(ttk.optionsLabel).toBe("Pilih Bank / E-Wallet");
    const ids = ttk.options?.map((o) => o.id) ?? [];
    expect(ids).toContain("bri");
    expect(ids).toContain("bca");
    expect(ids).toContain("ovo");
  });

  it("game_topup service exposes game options (Free Fire, Mobile Legends)", () => {
    const cfg = getServiceConfig("game_topup");
    expect(cfg.label).toBe("Top Up Game");
    expect(cfg.options?.length).toBeGreaterThan(0);
    const ids = cfg.options?.map((o) => o.id) ?? [];
    expect(ids).toContain("free_fire");
    expect(ids).toContain("mobile_legends");
    const ff = cfg.options?.find((o) => o.id === "free_fire");
    expect(ff?.label).toBe("Free Fire");
  });

  it("getSubServiceLabel resolves a game label and falls back to the raw id", () => {
    expect(getSubServiceLabel("game_topup", "mobile_legends")).toBe("Mobile Legends");
    expect(getSubServiceLabel("game_topup", "genshin_impact")).toBe("Genshin Impact");
    expect(getSubServiceLabel("pulsa", "not-a-game")).toBe("not-a-game");
    expect(getSubServiceLabel("game_topup", null)).toBeNull();
  });

  it("pulsa and data expose provider options (Tri, Telkomsel, etc)", () => {
    const pulsa = getServiceConfig("pulsa");
    expect(pulsa.optionsLabel).toBe("Pilih Provider");
    const pulsaIds = pulsa.options?.map((o) => o.id) ?? [];
    expect(pulsaIds).toContain("tri");
    expect(pulsaIds).toContain("telkomsel");
    expect(pulsaIds).toContain("indosat");
    expect(pulsaIds).toContain("xl");

    const data = getServiceConfig("data");
    expect(data.optionsLabel).toBe("Pilih Provider");
    expect(data.options?.some((o) => o.id === "tri")).toBe(true);
  });

  it("transfer exposes bank destination options (BRI, BCA, Mandiri)", () => {
    const transfer = getServiceConfig("transfer");
    expect(transfer.optionsLabel).toBe("Pilih Bank Tujuan");
    const ids = transfer.options?.map((o) => o.id) ?? [];
    expect(ids).toContain("bri");
    expect(ids).toContain("bca");
    expect(ids).toContain("mandiri");
    expect(ids).toContain("bni");
    expect(ids).toContain("bsi");
    const bri = transfer.options?.find((o) => o.id === "bri");
    expect(bri?.label).toBe("BRI");
  });

  it("internet exposes service provider options (IndiHome, BizNet)", () => {
    const internet = getServiceConfig("internet");
    expect(internet.optionsLabel).toBe("Pilih Provider");
    const ids = internet.options?.map((o) => o.id) ?? [];
    expect(ids).toContain("indihome");
    expect(ids).toContain("biznet");
    expect(ids).toContain("firstmedia");
    const indihome = internet.options?.find((o) => o.id === "indihome");
    expect(indihome?.label).toBe("IndiHome");
  });

  it("pln_prepaid exposes token config", () => {
    const pln = getServiceConfig("pln_prepaid");
    expect(pln.tokenLabel).toBe("Kode Token");
  });

  it("getServiceConfig resolves a known service and falls back gracefully", () => {
    const pulsa = getServiceConfig("pulsa");
    expect(pulsa.label).toBe("Pulsa");
    expect(pulsa.defaultFee).toBeGreaterThan(0);

    const unknown = getServiceConfig("game_voucher");
    expect(unknown.id).toBe("game_voucher");
    expect(unknown.label).toBe("game_voucher");
    expect(unknown.defaultFee).toBe(0);
  });
});
