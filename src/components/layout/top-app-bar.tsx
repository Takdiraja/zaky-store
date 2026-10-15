"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/stores/use-ui-store";
import { APP_NAME } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";
import Notifications from "@/components/shared/notifications";

const pageTitles: Record<string, string> = {
  "/": "ZAKY STORE",
  "/dashboard": "Dashboard",
  "/produk": "Produk",
  "/pelanggan": "Pelanggan",
  "/pengeluaran": "Pengeluaran",
  "/kasbon": "Kasbon",
  "/capital": "Modal",
  "/laporan": "Laporan",
  "/settings": "Pengaturan",
  "/transaksi": "Transaksi",
  "/cart": "Keranjang",
  "/layanan-digital": "Layanan Digital",
};

export default function TopAppBar() {
  const pathname = usePathname();
  const router = useRouter();
  const toggleSideNav = useUIStore((s) => s.toggleSideNav);
  const openSearch = useUIStore((s) => s.openSearch);
  const title = pageTitles[pathname] || APP_NAME;

  return (
    <header className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-border-standard bg-surface/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSideNav}
          className="flex size-12 items-center justify-center text-on-surface transition-transform active:scale-95"
          aria-label="Buka menu navigasi"
        >
          <Icon name="menu" size={22} />
        </button>
        <h1 className="text-headline-md-mobile font-bold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center">
        <Notifications />
        <button
          onClick={openSearch}
          className="flex size-12 items-center justify-center text-on-surface transition-transform active:scale-95"
          aria-label="Cari (/)"
        >
          <Icon name="search" size={22} />
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="flex size-12 items-center justify-center text-on-surface transition-transform active:scale-95"
          aria-label="Pengaturan"
        >
          <Icon name="account_circle" size={22} />
        </button>
      </div>
    </header>
  );
}
