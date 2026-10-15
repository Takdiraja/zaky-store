import type { DigitalServicePayment } from "@/types";

/**
 * A selectable sub-option within a service (e.g. the specific game for a
 * "Game Top Up" transaction). Extending this is pure configuration.
 */
export interface DigitalServiceOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * Digital Services catalog.
 *
 * The service list is a pure configuration array — adding a new service
 * (game voucher, ticketing, insurance, ...) only requires appending an
 * entry here (plus optionally a matching icon in icon-map.tsx). No core
 * logic changes are needed.
 */
/** Shared destination options for money-moving services (transfer, tarik tunai). */
const BANK_OPTIONS: DigitalServiceOption[] = [
  { id: "bri", label: "BRI", icon: "bank" },
  { id: "bca", label: "BCA", icon: "banknote" },
  { id: "mandiri", label: "Mandiri", icon: "bank" },
  { id: "bni", label: "BNI", icon: "bank" },
  { id: "btn", label: "BTN", icon: "bank" },
  { id: "bsi", label: "BSI", icon: "bank" },
  { id: "permata", label: "Permata", icon: "bank" },
  { id: "cimb", label: "CIMB Niaga", icon: "bank" },
  { id: "danamon", label: "Danamon", icon: "bank" },
  { id: "maybank", label: "Maybank", icon: "bank" },
  { id: "dbs", label: "DBS", icon: "bank" },
  { id: "jago", label: "Jago", icon: "bank" },
  { id: "sea_bank", label: "SeaBank", icon: "bank" },
  { id: "ovo", label: "OVO", icon: "wallet" },
  { id: "dana", label: "DANA", icon: "wallet" },
  { id: "gopay", label: "GoPay", icon: "wallet" },
  { id: "shopeepay", label: "ShopeePay", icon: "wallet" },
];

export interface DigitalServiceConfig {
  id: string;
  label: string;
  icon: string;
  /** Placeholder shown for the customer identifier field. */
  identifierLabel: string;
  identifierPlaceholder: string;
  /** Identifier kind used on the printed receipt (e.g. "No. Pelanggan"). */
  identifierReceiptLabel: string;
  /** Input type hint for the identifier field. */
  identifierInputMode?: "text" | "numeric" | "tel";
  /**
   * When true, the customer identifier IS the customer's phone number, so
   * a WhatsApp receipt can be sent directly to it. Otherwise (BPJS number,
   * meter number, game user ID, ...) the user must supply a WhatsApp number
   * at send time.
   */
  identifierIsPhone?: boolean;
  /** Default service fee charged when the field is left blank. */
  defaultFee: number;
  /**
   * Optional sub-options the user picks from before entering the rest of
   * the form (e.g. specific games for game top-up). When present, the form
   * renders an extra selector and stores the choice in `subService`.
   */
  options?: DigitalServiceOption[];
  /** Label for the sub-option selector, when `options` is present. */
  optionsLabel?: string;
  /**
   * When set (e.g. PLN prepaid token), the form renders an extra token-code
   * input alongside the identifier and the receipt shows it prominently.
   * The token code is stored in the `tokenCode` transaction field.
   */
  tokenLabel?: string;
}

export const DIGITAL_SERVICES: DigitalServiceConfig[] = [
  {
    id: "bpjs",
    label: "BPJS",
    icon: "health",
    identifierLabel: "No. Peserta BPJS",
    identifierPlaceholder: "0001234567890",
    identifierReceiptLabel: "No. Peserta",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pdam",
    label: "PDAM",
    icon: "water_drop",
    identifierLabel: "No. Pelanggan PDAM",
    identifierPlaceholder: "Contoh: 1234567890",
    identifierReceiptLabel: "No. Pelanggan",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "internet",
    label: "Internet",
    icon: "wifi",
    identifierLabel: "No. Pelanggan",
    identifierPlaceholder: "Nomor ID pelanggan internet",
    identifierReceiptLabel: "No. Pelanggan",
    identifierInputMode: "numeric",
    defaultFee: 2000,
    optionsLabel: "Pilih Provider",
    options: [
      { id: "indihome", label: "IndiHome", icon: "provider" },
      { id: "biznet", label: "BizNet", icon: "network" },
      { id: "firstmedia", label: "First Media", icon: "router" },
      { id: "mytv", label: "MyRepublic", icon: "satellite" },
      { id: "iconnet", label: "Iconnet", icon: "network" },
      { id: "mora", label: "Mora", icon: "satellite" },
      { id: "cbn", label: "CBN", icon: "building" },
      { id: "oxygen", label: "Oxygen", icon: "tower" },
      { id: "smartfren", label: "Smartfren", icon: "provider_alt" },
      { id: "starlink", label: "Starlink", icon: "satellite" },
    ],
  },
  {
    id: "cable_tv",
    label: "TV Kabel",
    icon: "tv",
    identifierLabel: "No. Pelanggan TV",
    identifierPlaceholder: "Nomor ID pelanggan TV kabel",
    identifierReceiptLabel: "No. Pelanggan",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pln_prepaid",
    label: "Token PLN",
    icon: "zap",
    identifierLabel: "No. Meter / ID Pelanggan",
    identifierPlaceholder: "Contoh: 123456789012",
    identifierReceiptLabel: "No. Meter",
    identifierInputMode: "numeric",
    defaultFee: 2000,
    tokenLabel: "Kode Token",
  },
  {
    id: "pln_postpaid",
    label: "Listrik PLN",
    icon: "zap",
    identifierLabel: "No. Meter / ID Pelanggan",
    identifierPlaceholder: "Contoh: 123456789012",
    identifierReceiptLabel: "No. Meter",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pulsa",
    label: "Pulsa",
    icon: "smartphone",
    identifierLabel: "No. HP",
    identifierPlaceholder: "Contoh: 081234567890",
    identifierReceiptLabel: "No. HP",
    identifierInputMode: "tel",
    identifierIsPhone: true,
    defaultFee: 1500,
    optionsLabel: "Pilih Provider",
    options: [
      { id: "telkomsel", label: "Telkomsel", icon: "provider" },
      { id: "indosat", label: "Indosat / IM3", icon: "provider_alt" },
      { id: "xl", label: "XL / Axis", icon: "signal" },
      { id: "tri", label: "Tri / 3", icon: "signal_high" },
      { id: "smartfren", label: "Smartfren", icon: "tower" },
      { id: "by_u", label: "by.U", icon: "provider_alt" },
    ],
  },
  {
    id: "data",
    label: "Paket Data",
    icon: "data",
    identifierLabel: "No. HP",
    identifierPlaceholder: "Contoh: 081234567890",
    identifierReceiptLabel: "No. HP",
    identifierInputMode: "tel",
    identifierIsPhone: true,
    defaultFee: 1500,
    optionsLabel: "Pilih Provider",
    options: [
      { id: "telkomsel", label: "Telkomsel", icon: "provider" },
      { id: "indosat", label: "Indosat / IM3", icon: "provider_alt" },
      { id: "xl", label: "XL / Axis", icon: "signal" },
      { id: "tri", label: "Tri / 3", icon: "signal_high" },
      { id: "smartfren", label: "Smartfren", icon: "tower" },
      { id: "by_u", label: "by.U", icon: "provider_alt" },
    ],
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    icon: "account_balance_wallet",
    identifierLabel: "No. HP / Akun",
    identifierPlaceholder: "Contoh: 081234567890",
    identifierReceiptLabel: "No. Akun",
    identifierInputMode: "tel",
    identifierIsPhone: true,
    defaultFee: 1500,
  },
  {
    id: "transfer",
    label: "Transfer Uang",
    icon: "swap",
    identifierLabel: "No. Rekening / No. HP",
    identifierPlaceholder: "Tujuan transfer",
    identifierReceiptLabel: "No. Tujuan",
    identifierInputMode: "tel",
    defaultFee: 2500,
    optionsLabel: "Pilih Bank Tujuan",
    options: BANK_OPTIONS,
  },
  {
    id: "tarik_tunai",
    label: "Tarik Tunai",
    icon: "banknote",
    identifierLabel: "No. Rekening / No. HP",
    identifierPlaceholder: "Tujuan tarik tunai",
    identifierReceiptLabel: "No. Tujuan",
    identifierInputMode: "tel",
    defaultFee: 2500,
    optionsLabel: "Pilih Bank / E-Wallet",
    options: BANK_OPTIONS,
  },
  {
    id: "game_topup",
    label: "Top Up Game",
    icon: "gamepad",
    identifierLabel: "User ID / Player ID",
    identifierPlaceholder: "Contoh: 123456789",
    identifierReceiptLabel: "User ID",
    identifierInputMode: "numeric",
    defaultFee: 2000,
    optionsLabel: "Pilih Game",
    options: [
      { id: "free_fire", label: "Free Fire", icon: "flame" },
      { id: "mobile_legends", label: "Mobile Legends", icon: "swords" },
      { id: "pubg_mobile", label: "PUBG Mobile", icon: "crosshair" },
      { id: "genshin_impact", label: "Genshin Impact", icon: "sparkles" },
      { id: "cod_mobile", label: "COD Mobile", icon: "crosshair" },
      { id: "honor_of_kings", label: "Honor of Kings", icon: "crown" },
      { id: "roblox", label: "Roblox", icon: "dices" },
      { id: "steam", label: "Steam Wallet", icon: "gamepad" },
      { id: "point_blank", label: "Point Blank", icon: "target" },
      { id: "valorant", label: "Valorant", icon: "target" },
      { id: "domino_higgs", label: "Higgs Domino", icon: "clover" },
      { id: "epep", label: "E-PEP", icon: "shield" },
    ],
  },
];

const SERVICE_BY_ID = new Map(DIGITAL_SERVICES.map((s) => [s.id, s]));

export function getServiceConfig(serviceType: string): DigitalServiceConfig {
  return (
    SERVICE_BY_ID.get(serviceType) ?? {
      id: serviceType,
      label: serviceType,
      icon: "receipt_long",
      identifierLabel: "No. Pelanggan",
      identifierPlaceholder: "Nomor pelanggan",
      identifierReceiptLabel: "No. Pelanggan",
      identifierInputMode: "text",
      defaultFee: 0,
    }
  );
}

/** Resolves a sub-option label from a service config (e.g. a game name). */
export function getSubServiceLabel(
  serviceType: string,
  subServiceId: string | null | undefined,
): string | null {
  if (!subServiceId) return null;
  const cfg = getServiceConfig(serviceType);
  const opt = cfg.options?.find((o) => o.id === subServiceId);
  return opt?.label ?? subServiceId;
}

/** All payment options offered on a digital service transaction. */
export const DIGITAL_SERVICE_PAYMENTS: {
  value: DigitalServicePayment;
  label: string;
  icon: string;
}[] = [
  { value: "cash", label: "Tunai", icon: "payments" },
  { value: "qris", label: "QRIS", icon: "qr_code_2" },
];
