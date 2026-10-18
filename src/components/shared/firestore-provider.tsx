"use client";

import { useEffect, useRef } from "react";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import { useDraftStore } from "@/stores/use-draft-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useStockInStore } from "@/stores/use-stockin-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { warmupDatabases } from "@/lib/pouchdb";

const ALL_COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
  "drafts",
  "expenses",
  "capital",
  "stock_in_receipts",
];

/**
 * Provider database lokal (PouchDB, offline-first).
 *
 * Tiap store membuka database IndexedDB-nya sendiri dan memulai sync
 * dua arah ke CouchDB saat pertama di-load. Aplikasi tetap jalan 100%
 * offline; perubahan tersinkron otomatis saat online.
 *
 * (Nama komponen dipertahankan sebagai FirestoreProvider agar tidak
 * perlu mengubah import di providers.tsx.)
 */
export default function FirestoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Warmup: buka semua DB di background agar navigasi tidak menunggu.
    void warmupDatabases(ALL_COLLECTIONS);

    // Batch 1 — kritis untuk kasir & dashboard: langsung jalan.
    const unsubProducts = useProductStore.getState().loadProducts();
    const unsubTransactions = useTransactionStore.getState().loadTransactions();
    const unsubCustomers = useCustomerStore.getState().loadCustomers();

    // Batch 2 — sisanya ditunda 1,2 dtk agar handshake sync awal
    // tidak menumpuk sekaligus saat startup.
    let unsubRest: Array<() => void> = [];
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      unsubRest = [
        useDebtPaymentStore.getState().loadPayments(),
        useDraftStore.getState().loadDrafts(),
        useExpenseStore.getState().loadExpenses(),
        useCapitalStore.getState().loadCapitalTransactions(),
        useStockInStore.getState().loadReceipts(),
      ];
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubProducts();
      unsubTransactions();
      unsubCustomers();
      unsubRest.forEach((u) => u());
    };
  }, []);

  return <>{children}</>;
}
