"use client";

import { useState } from "react";
import { useExpenseStore } from "@/stores/use-expense-store";
import { formatCurrency, formatDate, getTodayISO } from "@/lib/formatters";
import { generateExpenseNumber } from "@/lib/expense-counter";
import { processReceiptFile } from "@/lib/receipt-image";
import { Icon } from "@/lib/icon-map";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import SearchInput from "@/components/shared/search-input";
import EmptyState from "@/components/shared/empty-state";
import { useToast } from "@/components/shared/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Expense } from "@/types";

export default function PengeluaranPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const { addExpense, updateExpense, deleteExpense } = useExpenseStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expenseDate, setExpenseDate] = useState(getTodayISO());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = search.trim()
    ? expenses.filter(
        (e) =>
          e.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
          e.title.toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  const openAdd = () => {
    setEditExpense(null);
    setExpenseDate(getTodayISO());
    setTitle("");
    setDescription("");
    setTotalAmount("");
    setReceiptImage(null);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditExpense(expense);
    setExpenseDate(expense.expenseDate);
    setTitle(expense.title);
    setDescription(expense.description);
    setTotalAmount(String(expense.totalAmount));
    setReceiptImage(expense.receiptImage);
    setFormOpen(true);
  };

  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processReceiptFile(file);
      setReceiptImage(dataUrl);
      toast("Foto nota berhasil diproses.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Gagal memproses foto nota.",
        "error"
      );
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    const amount = Number(totalAmount);
    if (saving || !title.trim() || !expenseDate || !(amount > 0)) return;
    setSaving(true);
    try {
      if (editExpense) {
        await updateExpense(editExpense.id, {
          expenseDate,
          title: title.trim(),
          description: description.trim(),
          totalAmount: amount,
          receiptImage,
        });
        toast("Pengeluaran berhasil diperbarui.", "success");
      } else {
        const expenseNumber = await generateExpenseNumber();
        await addExpense({
          expenseNumber,
          expenseDate,
          title: title.trim(),
          description: description.trim(),
          totalAmount: amount,
          receiptImage,
        });
        toast("Pengeluaran berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      setEditExpense(null);
    } catch {
      toast("Gagal menyimpan pengeluaran.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      toast("Pengeluaran berhasil dihapus.", "success");
      if (selectedExpense?.id === deleteTarget.id) {
        setSelectedExpense(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus pengeluaran.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="w-full space-y-4 md:hidden">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold text-on-surface">Pengeluaran</h1>
          <button
            onClick={openAdd}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-secondary px-4 font-semibold text-white transition-all active:scale-95"
          >
            <Icon name="add" size={18} />
            Tambah
          </button>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nomor atau judul…"
        />

        {/* Expense List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title={search ? "Tidak ditemukan" : "Belum ada pengeluaran"}
              description={search ? "Coba kata kunci lain." : "Catat pengeluaran untuk pembukuan yang rapi."}
            />
          ) : (
            filtered.map((expense) => (
              <div
                key={expense.id}
                onClick={() => {
                  setSelectedExpense(expense);
                  setDetailOpen(true);
                }}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card transition-all active:scale-[0.99]"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {expense.receiptImage && (
                      <img
                        src={expense.receiptImage}
                        alt="Nota"
                        className="size-9 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <h3 className="truncate text-body-md font-bold text-on-surface">
                      {expense.title}
                    </h3>
                  </div>
                  <p className="truncate text-caption text-on-surface-variant">
                    {expense.expenseNumber} • {formatDate(expense.expenseDate)}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="font-bold text-danger">{formatCurrency(expense.totalAmount)}</p>
                  <Icon name="chevron_right" size={16} className="ml-auto mt-1 text-outline" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card hide-scrollbar"
          >
            {selectedExpense && (
              <MobileDetailContent
                expense={selectedExpense}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                  setDetailOpen(false);
                  openEdit(selectedExpense);
                }}
                onDelete={() => setDeleteTarget(selectedExpense)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden w-full min-h-0 md:flex">
        {/* Left: Expense List */}
        <aside className="flex min-h-0 w-[400px] flex-col border-r border-border-standard bg-surface-muted">
          <div className="space-y-3 border-b border-border-standard bg-surface p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold text-on-surface">Pengeluaran</h1>
              <button
                onClick={openAdd}
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-secondary px-4 font-semibold text-white transition-all active:scale-95"
              >
                <Icon name="add" size={18} />
                Tambah
              </button>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nomor atau judul…"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant/60">
                <Icon name="receipt_long" size={48} className="mx-auto mb-2 block" />
                <p>{search ? "Tidak ditemukan" : "Belum ada pengeluaran"}</p>
              </div>
            ) : (
              filtered.map((expense) => {
                const isSelected = selectedExpense?.id === expense.id;
                return (
                  <div
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className={`cursor-pointer border-b border-border-standard p-4 transition-colors ${
                      isSelected
                        ? "border-l-4 border-l-secondary bg-card shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <h3 className="truncate text-label-xl font-bold text-on-surface">
                        {expense.title}
                      </h3>
                      <p className="ml-3 shrink-0 font-bold text-danger">
                        {formatCurrency(expense.totalAmount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-body-sm text-on-surface-variant">
                        {expense.expenseNumber}
                      </p>
                      <span className="ml-3 shrink-0 text-caption text-on-surface-variant">
                        {formatDate(expense.expenseDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Expense Detail */}
        <section className="flex-1 flex flex-col bg-card min-h-0">
          {!selectedExpense ? (
            <div className="flex flex-1 items-center justify-center text-on-surface-variant/60">
              <div className="text-center">
                <Icon name="receipt_long" size={64} className="mx-auto mb-3" />
                <p>Pilih pengeluaran untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent
              expense={selectedExpense}
              onEdit={() => openEdit(selectedExpense)}
              onDelete={() => setDeleteTarget(selectedExpense)}
            />
          )}
        </section>
      </div>

      {/* ===== ADD / EDIT EXPENSE DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] max-w-[400px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              {editExpense ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Tanggal <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Judul Pengeluaran <span className="text-danger">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="Contoh: Pembelian Gas LPG"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Deskripsi <span className="text-on-surface-variant/60">(opsional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-md border border-border-standard bg-card px-4 py-3 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Total Biaya <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Foto Nota <span className="text-on-surface-variant/60">(opsional)</span>
              </label>
              {receiptImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={receiptImage}
                    alt="Pratinjau nota"
                    className="h-16 w-16 rounded-md border border-border-standard object-cover"
                  />
                  <button
                    onClick={() => setReceiptImage(null)}
                    className="h-10 rounded-md border border-danger/30 bg-card px-3 text-body-sm font-semibold text-danger transition-all active:scale-95"
                  >
                    Hapus Foto
                  </button>
                </div>
              ) : (
                <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-standard text-body-sm font-semibold text-on-surface-variant transition-transform active:scale-[0.98]">
                  <Icon name="add" size={18} />
                  Upload Foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptFile}
                    className="hidden"
                  />
                </label>
              )}
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
                disabled={
                  saving ||
                  !title.trim() ||
                  !expenseDate ||
                  !(Number(totalAmount) > 0)
                }
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
        title="Hapus Pengeluaran"
        description={
          deleteTarget
            ? `Yakin ingin menghapus pengeluaran "${deleteTarget.title}" (${deleteTarget.expenseNumber})?`
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

/* Mobile detail content inside bottom sheet */
function MobileDetailContent({
  expense,
  onClose,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      {/* Handle */}
      <div className="flex w-full justify-center py-3">
        <div className="h-1 w-10 rounded-full bg-outline-variant" />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between px-5">
        <div className="flex flex-col gap-1">
          <span className="text-caption text-on-surface-variant font-semibold">
            {expense.expenseNumber}
          </span>
          <h2 className="text-headline-md font-bold text-on-surface">{expense.title}</h2>
          <p className="text-label-xl font-bold text-danger">
            {formatCurrency(expense.totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Edit pengeluaran"
          >
            <Icon name="edit" size={20} className="text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Hapus pengeluaran"
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

      {/* Detail */}
      <div className="space-y-4 px-5 pb-8">
        <div className="rounded-lg border border-border-standard bg-card p-3 shadow-card">
          <p className="mb-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
            Tanggal
          </p>
          <p className="text-body-sm font-bold text-on-surface">{formatDate(expense.expenseDate)}</p>
        </div>
        {expense.description && (
          <div className="rounded-lg border border-border-standard bg-card p-3 shadow-card">
            <p className="mb-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Deskripsi
            </p>
            <p className="whitespace-pre-wrap text-body-sm text-on-surface">{expense.description}</p>
          </div>
        )}
        {expense.receiptImage && (
          <div>
            <p className="mb-2 text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Foto Nota
            </p>
            <img
              src={expense.receiptImage}
              alt={`Nota ${expense.expenseNumber}`}
              className="mx-auto max-w-[300px] rounded-md border border-border-standard"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* Tablet detail content */
function TabletDetailContent({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border-standard bg-surface-bright p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <Icon name="receipt_long" size={32} />
          </div>
          <div>
            <span className="text-caption text-on-surface-variant font-semibold">
              {expense.expenseNumber}
            </span>
            <h2 className="text-headline-md font-bold text-on-surface">{expense.title}</h2>
            <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Icon name="calendar_month" size={14} />
              {formatDate(expense.expenseDate)}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Total Biaya
            </p>
            <p className="mt-1 text-xl font-bold text-danger">
              {formatCurrency(expense.totalAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Tanggal
            </p>
            <p className="mt-1 text-body-sm font-bold text-secondary">
              {formatDate(expense.expenseDate)}
            </p>
          </div>
        </div>

        {expense.description && (
          <div>
            <h3 className="mb-2 text-label-xl font-bold text-on-surface">Deskripsi</h3>
            <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">
              {expense.description}
            </p>
          </div>
        )}

        {expense.receiptImage && (
          <div>
            <h3 className="mb-2 text-label-xl font-bold text-on-surface">Foto Nota</h3>
            <img
              src={expense.receiptImage}
              alt={`Nota ${expense.expenseNumber}`}
              className="max-w-[300px] rounded-md border border-border-standard"
            />
          </div>
        )}
      </div>
    </>
  );
}
