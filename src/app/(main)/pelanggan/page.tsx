"use client";

import { useState } from "react";
import { useCustomerStore } from "@/stores/use-customer-store";
import {
  formatCurrency,
  getRelativeTime,
} from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import TransactionHistory from "@/components/kasbon/transaction-history";
import PaymentInput from "@/components/kasbon/payment-input";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import SearchInput from "@/components/shared/search-input";
import EmptyState from "@/components/shared/empty-state";
import StatusBadge from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import type { Customer } from "@/types";

export default function PelangganPage() {
  const customers = useCustomerStore((s) => s.customers);
  const { addCustomer, updateCustomer, deleteCustomer } = useCustomerStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const openAdd = () => {
    setEditCustomer(null);
    setName("");
    setPhone("");
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    try {
      if (editCustomer) {
        await updateCustomer(editCustomer.id, {
          name: name.trim(),
          phone: phone.trim(),
        });
        toast("Pelanggan berhasil diperbarui.", "success");
      } else {
        await addCustomer({
          name: name.trim(),
          phone: phone.trim(),
          currentDebt: 0,
        });
        toast("Pelanggan berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      setEditCustomer(null);
    } catch {
      toast("Gagal menyimpan pelanggan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast("Pelanggan berhasil dihapus.", "success");
      if (selectedCustomer?.id === deleteTarget.id) {
        setSelectedCustomer(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus pelanggan.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden w-full space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold">Pelanggan</h1>
          <button
            onClick={openAdd}
            className="h-10 px-4 bg-secondary text-on-secondary rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Icon name="add" size={18} />
            Tambah
          </button>
        </div>

        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama atau nomor…"
        />

        {/* Customer List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon="person_search"
              title={search ? "Tidak ditemukan" : "Belum ada pelanggan"}
              description={search ? "Coba kata kunci lain." : "Tambahkan pelanggan untuk mulai mencatat kasbon."}
            />
          ) : (
            filtered.map((customer) => {
              const isPaid = customer.currentDebt === 0;
              return (
                <div
                  key={customer.id}
                  onClick={() => handleOpenDetail(customer)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card transition-all active:scale-[0.99] ${
                    !isPaid ? "border-l-4 border-l-warning" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h3 className="truncate text-body-md font-bold text-on-surface">{customer.name}</h3>
                    <p className="truncate text-caption text-on-surface-variant">
                      {customer.phone || "—"}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className={`font-bold ${isPaid ? "text-on-surface-variant" : "text-warning"}`}>
                      {formatCurrency(customer.currentDebt)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <StatusBadge
                        label={isPaid ? "Lunas" : "Aktif"}
                        variant={isPaid ? "success" : "warning"}
                      />
                      <Icon name="chevron_right" size={16} className="text-outline" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card hide-scrollbar">
            {selectedCustomer && (
              <MobileDetailContent
                customer={selectedCustomer}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                  setDetailOpen(false);
                  openEdit(selectedCustomer);
                }}
                onDelete={() => setDeleteTarget(selectedCustomer)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden w-full min-h-0 md:flex">
        {/* Left: Customer List */}
        <aside className="flex min-h-0 w-[400px] flex-col border-r border-border-standard bg-surface-muted">
          <div className="space-y-3 border-b border-border-standard bg-surface p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold text-on-surface">Pelanggan</h1>
              <button
                onClick={openAdd}
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-secondary px-4 font-semibold text-white transition-all active:scale-[0.98]"
              >
                <Icon name="add" size={18} />
                Tambah
              </button>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nama atau nomor…"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant/60">
                <Icon name="person_search" size={48} className="mx-auto mb-2 block" />
                <p>{search ? "Tidak ditemukan" : "Belum ada pelanggan"}</p>
              </div>
            ) : (
              filtered.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const isPaid = customer.currentDebt === 0;
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
                      {!isPaid && (
                        <span className="ml-2 shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-caption font-bold uppercase text-warning">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="truncate text-body-sm text-on-surface-variant">
                        {customer.phone || "—"}
                      </p>
                      <p className={`ml-3 shrink-0 font-bold ${isPaid ? "text-on-surface" : "text-danger"}`}>
                        {formatCurrency(customer.currentDebt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Customer Detail */}
        <section className="flex-1 flex flex-col bg-card min-h-0">
          {!selectedCustomer ? (
            <div className="flex flex-1 items-center justify-center text-on-surface-variant/60">
              <div className="text-center">
                <Icon name="person_search" size={64} className="mx-auto mb-3" />
                <p>Pilih pelanggan untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent
              customer={selectedCustomer}
              onEdit={() => openEdit(selectedCustomer)}
              onDelete={() => setDeleteTarget(selectedCustomer)}
            />
          )}
        </section>
      </div>

      {/* ===== ADD / EDIT CUSTOMER DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              {editCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Nama Pelanggan <span className="text-danger">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="Nama"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Nomor WhatsApp <span className="text-on-surface-variant/60">(opsional)</span>
              </label>
              <div className="flex overflow-hidden rounded-md border border-border-standard bg-card transition-all focus-within:border-secondary focus-within:ring-4 focus-within:ring-secondary/15">
                <span className="flex shrink-0 items-center bg-surface-container px-3 text-body-md font-bold text-on-surface-variant">
                  +62
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-12 flex-1 px-3 text-base outline-none"
                  placeholder="81x-xxxx-xxxx"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFormOpen(false)}
                className="h-12 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim()}
                className="h-12 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION ===== */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Pelanggan"
        description={
          deleteTarget
            ? deleteTarget.currentDebt > 0
              ? `Pelanggan "${deleteTarget.name}" masih memiliki hutang ${formatCurrency(deleteTarget.currentDebt)}. Lunasi kasbon terlebih dahulu sebelum menghapus.`
              : `Yakin ingin menghapus pelanggan "${deleteTarget.name}"?`
            : ""
        }
        confirmLabel={
          (deleteTarget?.currentDebt ?? 0) > 0
            ? "Tutup"
            : deleting
            ? "Menghapus..."
            : "Hapus"
        }
        variant="danger"
        confirmDisabled={deleting}
        onConfirm={() => {
          if ((deleteTarget?.currentDebt ?? 0) > 0) {
            setDeleteTarget(null);
            return;
          }
          handleDelete();
        }}
      />
    </div>
  );
}

/* Mobile detail content inside bottom sheet */
function MobileDetailContent({
  customer,
  onClose,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = customer.currentDebt === 0;
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
          <p className={`text-label-xl font-bold ${isPaid ? "text-success" : "text-warning"}`}>
            {formatCurrency(customer.currentDebt)}
          </p>
          <p className="text-caption text-on-surface-variant">{customer.phone || "—"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Edit pelanggan"
          >
            <Icon name="edit" size={20} className="text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Hapus pelanggan"
          >
            <Icon name="delete" size={20} className="text-danger" />
          </button>
          <button
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Tutup"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
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
function TabletDetailContent({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = customer.currentDebt === 0;
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
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border-standard bg-card px-4 font-semibold text-secondary transition-all active:scale-95"
          >
            <Icon name="edit" size={16} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-danger/30 bg-card px-4 font-semibold text-danger transition-all active:scale-95"
          >
            <Icon name="delete" size={16} />
            Hapus
          </button>
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
            <p className={`mt-1 text-xl font-bold ${isPaid ? "text-success" : "text-warning"}`}>
              {isPaid ? "Lunas" : "Aktif"}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Terakhir Update</p>
            <p className="mt-1 text-body-sm font-bold text-secondary">{getRelativeTime(customer.updatedAt)}</p>
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
