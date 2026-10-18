"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/stores/use-ui-store";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";

export default function SideNavDrawer() {
  const pathname = usePathname();
  const isOpen = useUIStore((s) => s.isSideNavOpen);
  const closeSideNav = useUIStore((s) => s.closeSideNav);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeSideNav()}>
      <SheetContent side="left" className="flex w-[280px] flex-col bg-surface p-0">
        {/* Header */}
        <SheetHeader className="px-6 pb-2 pt-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-on-primary shadow-sm">
              <Icon name="store" size={24} />
            </div>
            <div>
              <SheetTitle className="text-headline-md font-bold text-on-surface">
                {APP_NAME}
              </SheetTitle>
              <p className="text-overline uppercase tracking-wider font-bold text-on-surface-variant/60">
                Kiosk Assistant
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          <p className="px-4 pb-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant/60">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSideNav}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-body-md font-medium transition-all active:scale-[0.98] ${
                  active
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  className={active ? "" : "text-on-surface-variant/70"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
