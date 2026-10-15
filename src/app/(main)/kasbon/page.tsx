"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useCartStore } from "@/stores/use-cart-store";
import { formatCurrency, getRelativeTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import TransactionHistory from "@/components/kasbon/transaction-history";
import PaymentInput from "@/components/kasbon/payment-input";
import SearchInput from "@/components/shared/search-input";
import EmptyState from "@/components/shared/empty-state";
import StatusBadge from "@/components/shared/status-badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import type { Customer } from "@/types";

export default function KasbonPage() {
  const { customers } = useCustomerStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const totalPiutang = customers.reduce((s, c) => s + c.currentDebt, 0);
  const activeCount = customers.filter((c) => c.currentDebt > 0).length;

  // Hanya tampilkan pelanggan yang memiliki hutang aktif
  const filtered = (search.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : customers).filter((c) => c.currentDebt > 0);

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleAddCashAdvance = () => {
    // Prepare kasir flow for a new cash advance transaction.
    useCartStore.setState({ pendingKasbon: true });
    router.push("/");
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="w-full space-y-4 md:hidden">
        {/* Summary Header */}
        <div className="flex flex-col gap-1 rounded-lg border border-border-standard bg-primary p-5 shadow-card">
          <p className="text-label-md text-white/70">Total Piutang Kasbon</p>
          <h2 className="text-headline-lg-mobile font-bold text-white">
            {formatCurrency(totalPiutang)}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-warning/20 px-2 py-1 text-xs font-bold text-warning">
              {activeCount} Pelanggan
            </span>
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama pelanggan…"
        />

        {/* Customer List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon="person_search"
              title="Tidak ada kasbon aktif"
              description="Kasbon pelanggan yang belum lunas akan muncul di sini."
            />
          ) : (
            filtered.map((customer) => {
              const isOverdue = customer.currentDebt > 100000;
              return (
                <div
                  key={customer.id}
                  onClick={() => handleOpenDetail(customer)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card transition-all active:scale-[0.99] ${
                    isOverdue ? "border-l-4 border-l-danger" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-body-md font-bold text-on-surface">{customer.name}</h3>
                      {isOverdue && (
                        <StatusBadge label="Overdue" variant="danger" />
                      )}
                    </div>
                    <p className="text-caption text-on-surface-variant">
                      Terakhir: {getRelativeTime(customer.updatedAt)}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="font-bold text-warning">{formatCurrency(customer.currentDebt)}</p>
                    <Icon name="chevron_right" size={20} className="text-outline" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FAB */}
        <button
          onClick={handleAddCashAdvance}
          className="fixed bottom-20 right-6 z-30 md:bottom-6 flex size-14 items-center justify-center rounded-lg bg-primary text-white shadow-fab transition-transform active:scale-95"
          aria-label="Tambah kasbon baru"
        >
          <Plus className="size-7" />
        </button>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card hide-scrollbar">
            {selectedCustomer && <MobileDetailContent customer={selectedCustomer} onClose={() => setDetailOpen(false)} />}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden w-full min-h-0 md:flex">
        {/* Left: Customer List */}
        <aside className="flex min-h-0 w-[400px] flex-col border-r border-border-standard bg-surface-muted">
          <div className="border-b border-border-standard bg-surface p-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nama pelanggan…"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant/60">
                <Icon name="person_search" size={48} className="mx-auto mb-2 block" />
                <p>Tidak ada kasbon aktif</p>
              </div>
            ) : (
              filtered.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const isOverdue = customer.currentDebt > 100000;
                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`cursor-pointer border-b border-border-standard p-4 transition-colors ${
                      isSelected
                        ? "border-l-4 border-l-secondary bg-card shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <h3 className="truncate text-label-xl font-bold text-on-surface">{customer.name}</h3>
                      {isOverdue && (
                        <StatusBadge label="Overdue" variant="danger" />
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-body-sm text-on-surface-variant">
                        Terakhir: {getRelativeTime(customer.updatedAt)}
                      </p>
                      <p className="ml-3 shrink-0 font-bold text-warning">
                        {formatCurrency(customer.currentDebt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-border-standard p-4">
            <button
              onClick={handleAddCashAdvance}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-transform active:scale-95"
            >
              <Plus className="size-5" />
              Tambah Kasbon
            </button>
          </div>
        </aside>

        {/* Right: Customer Detail */}
        <section className="flex min-h-0 flex-1 flex-col bg-card">
          {!selectedCustomer ? (
            <div className="flex flex-1 items-center justify-center text-on-surface-variant/60">
              <div className="text-center">
                <Icon name="person_search" size={64} className="mx-auto mb-3" />
                <p>Pilih pelanggan untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent customer={selectedCustomer} />
          )}
        </section>
      </div>
    </div>
  );
}

/* Mobile detail content inside bottom sheet */
function MobileDetailContent({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  return (
    <div>
      {/* Handle */}
      <div className="flex w-full justify-center py-3">
        <div className="h-1 w-10 rounded-full bg-outline-variant" />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between px-5">
        <div className="flex flex-col">
          <h2 className="text-headline-md font-bold text-on-surface">{customer.name}</h2>
          <p className="text-label-xl font-bold text-warning">
            {formatCurrency(customer.currentDebt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
          aria-label="Tutup"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Transaction History */}
      <div className="mb-8 px-5">
        <TransactionHistory customerId={customer.id} />
      </div>

      {/* Payment Input */}
      {customer.currentDebt > 0 && (
        <div className="px-5 pb-8">
          <PaymentInput customerId={customer.id} />
        </div>
      )}
    </div>
  );
}

/* Tablet detail content */
function TabletDetailContent({ customer }: { customer: Customer }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border-standard bg-surface-bright p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary/10 text-2xl font-bold text-secondary">
            {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h2 className="text-headline-md font-bold text-on-surface">{customer.name}</h2>
            <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Icon name="account_circle" size={14} />
              {customer.phone || "-"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="mb-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
            Total Hutang Aktif
          </p>
          <p className="text-3xl font-bold text-danger">{formatCurrency(customer.currentDebt)}</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Total Hutang</p>
            <p className="mt-1 text-xl font-bold text-danger">{formatCurrency(customer.currentDebt)}</p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Status</p>
            <p className={`mt-1 text-xl font-bold ${customer.currentDebt > 0 ? "text-warning" : "text-success"}`}>
              {customer.currentDebt > 0 ? "Aktif" : "Lunas"}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Telepon</p>
            <p className="mt-1 text-xl font-bold text-secondary">{customer.phone || "-"}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="mb-4 text-label-xl font-bold text-on-surface">Riwayat Transaksi & Pembayaran</h3>
          <TransactionHistory customerId={customer.id} />
        </div>

        {/* Payment Input */}
        {customer.currentDebt > 0 && (
          <PaymentInput customerId={customer.id} />
        )}
      </div>
    </>
  );
}
