"use client";

import { useMemo, useRef, useState } from "react";
import { useDigitalServiceStore } from "@/stores/use-digital-service-store";
import { getServiceConfig } from "@/lib/digital-services";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { generateDigitalServiceNumber } from "@/lib/digital-service-counter";
import { Icon } from "@/lib/icon-map";
import { useToast } from "@/components/shared/toast-provider";
import SearchInput from "@/components/shared/search-input";
import EmptyState from "@/components/shared/empty-state";
import StatusBadge from "@/components/shared/status-badge";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ServiceCardGrid from "@/components/digital-services/service-card-grid";
import DigitalServiceForm, {
  type DigitalServiceFormValues,
} from "@/components/digital-services/digital-service-form";
import DigitalServiceDetail from "@/components/digital-services/digital-service-detail";
import type { DigitalServiceTransaction } from "@/types";

export default function DigitalServicesPage() {
  const transactions = useDigitalServiceStore((s) => s.transactions);
  const { addTransaction, updateTransaction, deleteTransaction } =
    useDigitalServiceStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DigitalServiceTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [pickingOpen, setPickingOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DigitalServiceTransaction | null>(null);
  const [presetService, setPresetService] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formRef = useRef<{ submit: () => void }>(null);
  const [canSubmit, setCanSubmit] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<DigitalServiceTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((t) => {
      const service = getServiceConfig(t.serviceType);
      return (
        t.transactionNumber.toLowerCase().includes(q) ||
        t.customerIdentifier.toLowerCase().includes(q) ||
        (t.customerName ?? "").toLowerCase().includes(q) ||
        service.label.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  const openAdd = (serviceType: string) => {
    setEditTarget(null);
    setPresetService(serviceType);
    setFormOpen(true);
  };

  const openEdit = (txn: DigitalServiceTransaction) => {
    setEditTarget(txn);
    setPresetService(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: DigitalServiceFormValues) => {
    if (saving) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateTransaction(editTarget.id, {
          serviceType: values.serviceType,
          customerIdentifier: values.customerIdentifier,
          subService: values.subService,
          tokenCode: values.tokenCode,
          customerName: values.customerName,
          nominalAmount: values.nominalAmount,
          serviceFee: values.serviceFee,
          totalAmount: values.nominalAmount + values.serviceFee,
          paymentMethod: values.paymentMethod,
          transactionDate: values.transactionDate,
          notes: values.notes,
        });
        toast("Transaksi layanan digital berhasil diperbarui.", "success");
      } else {
        const transactionNumber = await generateDigitalServiceNumber();
        await addTransaction({
          transactionNumber,
          serviceType: values.serviceType,
          customerIdentifier: values.customerIdentifier,
          subService: values.subService,
          tokenCode: values.tokenCode,
          customerName: values.customerName,
          nominalAmount: values.nominalAmount,
          serviceFee: values.serviceFee,
          totalAmount: values.nominalAmount + values.serviceFee,
          paymentMethod: values.paymentMethod,
          transactionDate: values.transactionDate,
          notes: values.notes,
          receiptNumber: transactionNumber,
          printed: false,
          printCount: 0,
        });
        toast("Transaksi layanan digital berhasil disimpan.", "success");
      }
      setFormOpen(false);
      setEditTarget(null);
      setPresetService(null);
    } catch {
      toast("Gagal menyimpan transaksi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      toast("Transaksi layanan digital berhasil dihapus.", "success");
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus transaksi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="w-full space-y-4 md:hidden">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold text-on-surface">Layanan Digital</h1>
          <button
            onClick={() => setPickingOpen(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-secondary px-4 font-semibold text-white transition-all active:scale-95"
          >
            <Icon name="add" size={18} />
            Transaksi
          </button>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari no. transaksi, ID, atau layanan…"
        />

        {/* Transaction List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon="smartphone"
              title={search ? "Tidak ditemukan" : "Belum ada transaksi layanan"}
              description={
                search
                  ? "Coba kata kunci lain."
                  : "Catat transaksi layanan digital seperti BPJS, PDAM, pulsa, dan lainnya."
              }
            />
          ) : (
            filtered.map((t) => {
              const service = getServiceConfig(t.serviceType);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setDetailOpen(true);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card transition-all active:scale-[0.99]"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                        <Icon name={service.icon} size={16} />
                      </span>
                      <h3 className="truncate text-body-md font-bold text-on-surface">
                        {service.label}
                      </h3>
                      <StatusBadge
                        label={t.printed ? "Dicetak" : "Belum cetak"}
                        variant={t.printed ? "success" : "warning"}
                      />
                    </div>
                    <p className="truncate font-mono text-caption text-on-surface-variant">
                      {t.transactionNumber} • {t.customerIdentifier}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="font-bold text-on-surface">{formatCurrency(t.totalAmount)}</p>
                    <p className="text-caption text-on-surface-variant">
                      {formatDate(t.transactionDate)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card hide-scrollbar"
          >
            {selected && (
              <div className="px-5 pb-8">
                <DigitalServiceDetail
                  transaction={selected}
                  onClose={() => setDetailOpen(false)}
                  onEdit={() => {
                    setDetailOpen(false);
                    openEdit(selected);
                  }}
                  onDelete={() => setDeleteTarget(selected)}
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden w-full min-h-0 md:flex">
        {/* Left: Transaction List + Service quick-add */}
        <aside className="flex min-h-0 w-[420px] flex-col border-r border-border-standard bg-surface-muted">
          <div className="space-y-3 border-b border-border-standard bg-surface p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold text-on-surface">Layanan Digital</h1>
              <button
                onClick={() => setPickingOpen(true)}
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-secondary px-4 font-semibold text-white transition-all active:scale-95"
              >
                <Icon name="add" size={18} />
                Transaksi
              </button>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari no. transaksi, ID, atau layanan…"
            />
          </div>

          {/* Service quick-add grid */}
          <div className="border-b border-border-standard bg-surface p-4">
            <p className="mb-2 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Pilih layanan
            </p>
            <ServiceCardGrid
              selectedId={null}
              onSelect={(s) => openAdd(s.id)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant/60">
                <Icon name="smartphone" size={48} className="mx-auto mb-2 block" />
                <p>{search ? "Tidak ditemukan" : "Belum ada transaksi layanan"}</p>
              </div>
            ) : (
              filtered.map((t) => {
                const isSelected = selected?.id === t.id;
                const service = getServiceConfig(t.serviceType);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`cursor-pointer border-b border-border-standard p-4 transition-colors ${
                      isSelected
                        ? "border-l-4 border-l-secondary bg-card shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                          <Icon name={service.icon} size={14} />
                        </span>
                        <h3 className="truncate text-label-xl font-bold text-on-surface">
                          {service.label}
                        </h3>
                      </div>
                      <p className="ml-3 shrink-0 font-bold text-on-surface">
                        {formatCurrency(t.totalAmount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate font-mono text-body-sm text-on-surface-variant">
                        {t.transactionNumber} • {t.customerIdentifier}
                      </p>
                      <StatusBadge
                        label={t.printed ? "Dicetak" : "Belum cetak"}
                        variant={t.printed ? "success" : "warning"}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Detail */}
        <section className="flex flex-1 flex-col bg-card min-h-0">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-on-surface-variant/60">
              <div className="text-center">
                <Icon name="smartphone" size={64} className="mx-auto mb-3" />
                <p>Pilih transaksi untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Icon name={getServiceConfig(selected.serviceType).icon} size={32} />
                  </div>
                  <div>
                    <span className="font-mono text-caption text-on-surface-variant font-semibold">
                      {selected.transactionNumber}
                    </span>
                    <h2 className="text-headline-md font-bold text-on-surface">
                      {getServiceConfig(selected.serviceType).label}
                    </h2>
                    <p className="text-body-sm text-on-surface-variant">
                      {formatDate(selected.transactionDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(selected)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border-standard bg-card px-4 font-semibold text-secondary transition-all active:scale-95"
                  >
                    <Icon name="edit" size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selected)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-md border border-danger/30 bg-card px-4 font-semibold text-danger transition-all active:scale-95"
                  >
                    <Icon name="delete" size={16} />
                    Hapus
                  </button>
                </div>
              </div>
              <DigitalServiceDetail
                transaction={selected}
                onClose={() => setSelected(null)}
                onEdit={() => openEdit(selected)}
                onDelete={() => setDeleteTarget(selected)}
              />
            </div>
          )}
        </section>
      </div>

      {/* ===== SERVICE PICKER (new transaction) ===== */}
      <Dialog open={pickingOpen} onOpenChange={setPickingOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              Pilih Layanan
            </DialogTitle>
          </DialogHeader>
          <p className="-mt-1 text-body-sm text-on-surface-variant">
            Pilih jenis layanan untuk membuat transaksi baru.
          </p>
          <ServiceCardGrid
            selectedId={null}
            onSelect={(s) => {
              setPickingOpen(false);
              openAdd(s.id);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ===== ADD / EDIT DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">
              {editTarget
                ? "Edit Transaksi Layanan"
                : `Transaksi ${presetService ? getServiceConfig(presetService).label : "Layanan Digital"}`}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Isi detail transaksi layanan digital.
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-5 no-scrollbar max-h-[70vh] overflow-y-auto px-5">
            <DigitalServiceForm
              key={
                editTarget?.id ??
                `new-${presetService ?? "none"}`
              }
              ref={formRef}
              initial={editTarget}
              defaultService={presetService}
              onSubmit={handleSubmit}
              onValidChange={setCanSubmit}
            />
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    setEditTarget(null);
                    setPresetService(null);
                  }}
                  className="h-12 flex-1"
                >
                  Batal
                </Button>
              }
            />
            <Button
              type="button"
              onClick={() => formRef.current?.submit()}
              disabled={!canSubmit || saving}
              className="h-12 flex-1 bg-secondary text-white"
            >
              {saving
                ? "Menyimpan..."
                : editTarget
                  ? "Simpan Perubahan"
                  : "Simpan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION ===== */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Transaksi Layanan"
        description={
          deleteTarget
            ? `Yakin ingin menghapus transaksi ${deleteTarget.transactionNumber} (${getServiceConfig(deleteTarget.serviceType).label}) sebesar ${formatCurrency(
                deleteTarget.totalAmount
              )}?`
            : ""
        }
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        variant="danger"
        confirmDisabled={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
