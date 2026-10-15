import type { PeriodFilter } from "@/types";

export const PERIOD_LABELS: Record<string, string> = {
  today: "Hari Ini",
  yesterday: "Kemarin",
  week: "Minggu Ini",
  month: "Bulan Ini",
  custom: "Custom",
};

export const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: "Hari Ini", value: "today" },
  { label: "Kemarin", value: "yesterday" },
  { label: "Minggu Ini", value: "week" },
  { label: "Bulan Ini", value: "month" },
  { label: "Custom", value: "custom" },
];

export const NAV_ITEMS = [
  { label: "Kasir", href: "/", icon: "point_of_sale" as const },
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" as const },
  { label: "Transaksi", href: "/transaksi", icon: "receipt_long" as const },
  { label: "Produk", href: "/produk", icon: "inventory_2" as const },
  { label: "Pelanggan", href: "/pelanggan", icon: "account_circle" as const },
  { label: "Layanan Digital", href: "/layanan-digital", icon: "smartphone" as const },
  { label: "Modal", href: "/capital", icon: "account_balance_wallet" as const },
  { label: "Pengeluaran", href: "/pengeluaran", icon: "receipt_long" as const },
  { label: "Kasbon", href: "/kasbon", icon: "menu_book" as const },
  { label: "Laporan", href: "/laporan", icon: "assessment" as const },
  { label: "Pengaturan", href: "/settings", icon: "settings" as const },
];

/** Top 5 most-used routes shown in the mobile bottom navigation. */
export const BOTTOM_NAV_ITEMS = [
  { label: "Kasir", href: "/", icon: "point_of_sale" as const },
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" as const },
  { label: "Transaksi", href: "/transaksi", icon: "receipt_long" as const },
  { label: "Produk", href: "/produk", icon: "inventory_2" as const },
  { label: "Pengaturan", href: "/settings", icon: "settings" as const },
];

export const APP_NAME = "ZAKY STORE";

/** Default store address printed on receipts. */
export const STORE_ADDRESS =
  "Brumbung RT 11, Kebayanan I, Ngandul, Sumberlawang, Sragen Regency, Central Java 57272";

/** Default store phone printed on receipts (blank = omitted). */
export const STORE_PHONE = "";
