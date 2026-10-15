"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useProductStore } from "@/stores/use-product-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { getTodayISO, getRelativeTime, formatCurrency } from "@/lib/formatters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Notifications bell (in the top app bar) + a bottom sheet listing in-app
 * notifications. Rules generate alerts from existing store data: low stock,
 * overdue kasbon, and a daily sales summary.
 */
export default function Notifications() {
  const [open, setOpen] = useState(false);
  const { notifications, addNotification, markAllRead } = useNotificationStore();
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const transactions = useTransactionStore((s) => s.transactions);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Rule-based generation — runs once per mount per data set; dedupes by title.
  const todayISO = getTodayISO();
  const seenKeys = useMemo(() => new Set(notifications.map((n) => n.title)), [notifications]);

  useEffect(() => {
    // Low stock
    const lowStock = products.filter((p) => p.isActive && p.stock <= p.minStock);
    const critical = lowStock.filter((p) => p.stock === 0);
    if (lowStock.length > 0) {
      const title = "Stok menipis";
      if (!seenKeys.has(title)) {
        addNotification({
          type: "stock",
          title,
          message: `${lowStock.length} produk di bawah stok minimum (${critical.length} habis). Segera isi ulang.`,
        });
      }
    }

    // Overdue kasbon
    const overdue = customers.filter((c) => c.currentDebt > 100000);
    if (overdue.length > 0) {
      const title = "Kasbon menunggak";
      if (!seenKeys.has(title)) {
        addNotification({
          type: "debt",
          title,
          message: `${overdue.length} pelanggan memiliki kasbon besar. Total ${formatCurrency(
            overdue.reduce((s, c) => s + c.currentDebt, 0),
          )}.`,
        });
      }
    }

    // Daily summary
    const todayTxns = transactions.filter((t) => t.date.startsWith(todayISO));
    if (todayTxns.length > 0) {
      const title = `Ringkasan hari ini`;
      if (!seenKeys.has(title)) {
        const total = todayTxns.reduce((s, t) => s + t.totalAmount, 0);
        addNotification({
          type: "daily",
          title,
          message: `${todayTxns.length} transaksi hari ini · ${formatCurrency(total)}.`,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, customers, transactions, todayISO]);

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          markAllRead();
        }}
        className="relative flex size-12 items-center justify-center text-on-surface transition-transform active:scale-95"
        aria-label="Notifikasi"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-card">
          <SheetHeader>
            <SheetTitle className="text-headline-md font-bold text-on-surface">Notifikasi</SheetTitle>
          </SheetHeader>
          <div className="px-5 pb-6">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-body-sm text-on-surface-variant/70">
                Belum ada notifikasi.
              </p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-md border p-3 ${
                      n.read ? "border-border-standard bg-card" : "border-secondary/30 bg-secondary/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-body-sm font-bold text-on-surface">{n.title}</p>
                      <span className="shrink-0 text-caption text-on-surface-variant">
                        {getRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-body-sm text-on-surface-variant">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
