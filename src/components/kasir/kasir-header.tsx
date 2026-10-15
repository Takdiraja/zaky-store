"use client";

import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/use-ui-store";
import { useProductStore } from "@/stores/use-product-store";
import { PRODUCT_CATEGORIES } from "@/types";
import { Icon } from "@/lib/icon-map";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TodayTransactions from "./today-transactions";
import DraftDialog from "./draft-dialog";

export default function KasirHeader() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [scannerHotkey, setScannerHotkey] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setDraftOpen(true);
    window.addEventListener("open-draft", handler);
    return () => window.removeEventListener("open-draft", handler);
  }, []);

  // Desktop keyboard shortcuts: "/" focuses search, F2 opens scanner.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F2") {
        e.preventDefault();
        setScannerHotkey(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleSideNav = useUIStore((s) => s.toggleSideNav);
  const searchQuery = useProductStore((s) => s.searchQuery);
  const setSearchQuery = useProductStore((s) => s.setSearchQuery);
  const selectedCategory = useProductStore((s) => s.selectedCategory);
  const setSelectedCategory = useProductStore((s) => s.setSelectedCategory);

  return (
    <header className="border-b border-border-standard bg-surface">
      {/* Single row: hamburger + search + actions */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={toggleSideNav}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-on-surface transition-transform active:scale-95"
          aria-label="Buka menu navigasi"
        >
          <Icon name="menu" size={22} />
        </button>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-md border border-border-standard bg-card pl-11 pr-4 text-base text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-4 focus:ring-secondary/15"
            placeholder="Cari produk… (/)"
            type="text"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Riwayat Hari Ini"
          >
            <Icon name="history_edu" size={20} />
          </button>
          <button
            onClick={() => setDraftOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Draft Transaksi"
          >
            <Icon name="shopping_bag" size={20} />
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="hide-scrollbar overflow-x-auto px-3 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory("Semua")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-label-md font-medium transition-all active:scale-95 ${
              selectedCategory === "Semua"
                ? "bg-secondary text-white"
                : "border border-border-standard bg-card text-on-surface"
            }`}
          >
            Semua
          </button>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-label-md font-medium transition-all active:scale-95 ${
                  isActive
                    ? "bg-secondary text-white"
                    : "border border-border-standard bg-card text-on-surface"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Riwayat Hari Ini Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85dvh] max-w-[480px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">Riwayat Hari Ini</DialogTitle>
          </DialogHeader>
          <TodayTransactions />
        </DialogContent>
      </Dialog>

      {/* Draft Dialog */}
      <DraftDialog open={draftOpen} onOpenChange={setDraftOpen} />

      {/* Scanner via F2 — reuse the kasir page's scanner by dispatching a custom event */}
      <F2ScannerBridge active={scannerHotkey} onClose={() => setScannerHotkey(false)} />
    </header>
  );
}

/** Bridges the F2 shortcut to the scanner by dispatching the same custom event the kasir page listens for. */
function F2ScannerBridge({ active, onClose }: { active: boolean; onClose: () => void }) {
  useEffect(() => {
    if (active) {
      window.dispatchEvent(new CustomEvent("open-scanner"));
      onClose();
    }
  }, [active, onClose]);
  return null;
}
