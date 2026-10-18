"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";

/**
 * Mobile bottom navigation — the 5 most-used routes.
 * Hidden on the kasir page (full-bleed checkout) and on md+ screens
 * (desktop uses the drawer).
 */
export default function BottomNav() {
  const pathname = usePathname();

  const isKasir = pathname === "/" || pathname === "/cart";
  if (isKasir) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-standard bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Navigasi utama"
    >
      <div className="flex h-16 items-stretch justify-around px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md transition-colors active:bg-surface-container"
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                name={item.icon}
                size={22}
                className={isActive ? "text-secondary" : "text-on-surface-variant"}
              />
              <span
                className={`text-caption font-medium ${
                  isActive ? "font-semibold text-secondary" : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
