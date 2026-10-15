"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { useProductStore } from "@/stores/use-product-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { Icon } from "@/lib/icon-map";
import { formatCurrency, formatDateShort } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface Result {
  id: string;
  group: "Produk" | "Pelanggan" | "Transaksi" | "Pengeluaran" | "Modal";
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

/**
 * Global search (command palette) — searches products (name + barcode),
 * customers, transactions (receipt #), expenses, and capital in one place.
 * Open with the search button in the top bar or the "/" shortcut.
 */
export default function GlobalSearch() {
  const router = useRouter();
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const transactions = useTransactionStore((s) => s.transactions);
  const expenses = useExpenseStore((s) => s.expenses);
  const capital = useCapitalStore((s) => s.capitalTransactions);

  // Focus the input when opened.
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // "/" shortcut (when not already typing) + Escape to close.
  // Skipped on the kasir page, which has its own search-focus "/".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
      const onKasir = typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "/cart");
      if (e.key === "/" && !typing && !isOpen && !onKasir) {
        e.preventDefault();
        useUIStore.getState().openSearch();
      } else if (e.key === "Escape" && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeSearch]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const list: Result[] = [];

    for (const p of products) {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
      ) {
        list.push({
          id: `p-${p.id}`,
          group: "Produk",
          title: p.name,
          subtitle: `${p.brand || p.category} · Stok ${p.stock} · ${formatCurrency(p.sellPrice)}`,
          href: "/produk",
          icon: "inventory_2",
        });
      }
    }
    for (const c of customers) {
      if (c.name.toLowerCase().includes(q) || c.phone.includes(q)) {
        list.push({
          id: `c-${c.id}`,
          group: "Pelanggan",
          title: c.name,
          subtitle: `${c.phone || "—"} · Hutang ${formatCurrency(c.currentDebt)}`,
          href: "/pelanggan",
          icon: "account_circle",
        });
      }
    }
    for (const t of transactions) {
      if (t.receiptNumber?.toLowerCase().includes(q) || t.items.some((i) => i.name.toLowerCase().includes(q))) {
        list.push({
          id: `t-${t.id}`,
          group: "Transaksi",
          title: t.receiptNumber || t.id,
          subtitle: `${formatDateShort(t.date)} · ${formatCurrency(t.totalAmount)}`,
          href: "/transaksi",
          icon: "receipt_long",
        });
      }
    }
    for (const e of expenses) {
      if (e.title.toLowerCase().includes(q) || e.expenseNumber.toLowerCase().includes(q)) {
        list.push({
          id: `e-${e.id}`,
          group: "Pengeluaran",
          title: e.title,
          subtitle: `${e.expenseNumber} · ${formatCurrency(e.totalAmount)}`,
          href: "/pengeluaran",
          icon: "receipt_long",
        });
      }
    }
    for (const cap of capital) {
      if (cap.capitalNumber.toLowerCase().includes(q) || cap.description.toLowerCase().includes(q)) {
        list.push({
          id: `cap-${cap.id}`,
          group: "Modal",
          title: cap.capitalNumber,
          subtitle: `${cap.description || cap.type} · ${formatCurrency(cap.amount)}`,
          href: "/capital",
          icon: "account_balance_wallet",
        });
      }
    }
    return list.slice(0, 12);
  }, [query, products, customers, transactions, expenses, capital]);

  const grouped = useMemo(() => {
    const order = ["Produk", "Pelanggan", "Transaksi", "Pengeluaran", "Modal"] as const;
    return order
      .map((g) => ({ group: g, items: results.filter((r) => r.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  const go = (href: string) => {
    closeSearch();
    router.push(href);
  };

  const handleClose = () => {
    setQuery("");
    closeSearch();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[10vh] max-w-lg translate-y-0 !p-0"
      >
        <DialogTitle className="sr-only">Pencarian global</DialogTitle>
        <DialogDescription className="sr-only">
          Cari produk, pelanggan, transaksi, pengeluaran, atau modal.
        </DialogDescription>

        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border-standard px-4">
          <Search className="size-5 shrink-0 text-on-surface-variant" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, pelanggan, transaksi, pengeluaran…"
            className="h-14 w-full bg-transparent text-base text-on-surface outline-none placeholder:text-on-surface-variant/60"
          />
          <span className="flex shrink-0 items-center gap-1 rounded border border-border-standard px-1.5 py-0.5 text-caption text-on-surface-variant">
            <CornerDownLeft className="size-3" /> enter
          </span>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-body-sm text-on-surface-variant/70">
              Ketik minimal 2 huruf untuk mencari.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-body-sm text-on-surface-variant/70">
              Tidak ada hasil untuk “{query}”.
            </p>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <p className="px-3 py-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
                  {group}
                </p>
                {items.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => go(r.href)}
                    onKeyDown={(e) => e.key === "Enter" && go(r.href)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-container"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
                      <Icon name={r.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm font-semibold text-on-surface">
                        {r.title}
                      </span>
                      <span className="block truncate text-caption text-on-surface-variant">
                        {r.subtitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-caption text-secondary">{group}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
