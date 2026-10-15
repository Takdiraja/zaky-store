"use client";

import { useState } from "react";
import { useCapitalStore } from "@/stores/use-capital-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { formatCurrency, formatDate, getTodayISO } from "@/lib/formatters";
import { generateCapitalNumber } from "@/lib/capital-counter";
import { Icon } from "@/lib/icon-map";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { CapitalTransaction, CapitalType, CapitalCategory } from "@/types";
import {
  CAPITAL_CATEGORY_LABELS,
  normalizeCapitalCategory,
} from "@/stores/use-capital-store";

const TYPE_META: Record<
  CapitalType,
  { label: string; badge: string; text: string; sign: "+" | "-" }
> = {
  initial: {
    label: "Modal Awal",
    badge: "bg-primary/10 text-primary",
    text: "text-primary",
    sign: "+",
  },
  addition: {
    label: "Penambahan",
    badge: "bg-success-paid/10 text-success-paid",
    text: "text-success-paid",
    sign: "+",
  },
  withdrawal: {
    label: "Penarikan",
    badge: "bg-danger-alert/10 text-danger-alert",
    text: "text-danger-alert",
    sign: "-",
  },
};

const CATEGORY_META: Record<
  CapitalCategory,
  { icon: string; tone: "info" | "default" }
> = {
  warung: { icon: "shopping_bag", tone: "info" },
  digital_service: { icon: "smartphone", tone: "default" },
};

export default function CapitalPage() {
  const capitalTransactions = useCapitalStore((s) => s.capitalTransactions);
  const { addCapitalTransaction, updateCapitalTransaction, deleteCapitalTransaction } =
    useCapitalStore();
  const hasInitial = useCapitalStore((s) => s.hasInitialCapital);
  const transactions = useTransactionStore((s) => s.transactions);
  const expenses = useExpenseStore((s) => s.expenses);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCapital, setSelectedCapital] = useState<CapitalTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editCapital, setEditCapital] = useState<CapitalTransaction | null>(null);
  const [transactionDate, setTransactionDate] = useState(getTodayISO());
  const [type, setType] = useState<CapitalType>("addition");
  const [category, setCategory] = useState<CapitalCategory>("warung");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<CapitalTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Per-category capital ──
  const getCapitalBreakdown = useCapitalStore((s) => s.getCapitalBreakdown);
  const warungCapital = getCapitalBreakdown("warung").current;
  const digitalCapital = getCapitalBreakdown("digital_service").current;
  const combinedCapital = warungCapital + digitalCapital;

  // ── Break-even & Remaining Capital (Warung) ──
  const grossProfit = transactions.reduce((s, t) => s + t.totalProfit, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const netProfit = grossProfit - totalExpenses;
  const warungBreakEvenPercent =
    warungCapital > 0 ? (netProfit / warungCapital) * 100 : 0;
  const isBreakEven = warungBreakEvenPercent >= 100;

  const filtered = search.trim()
    ? capitalTransactions.filter(
        (c) =>
          c.capitalNumber.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
      )
    : capitalTransactions;

  const openAdd = () => {
    setEditCapital(null);
    setTransactionDate(getTodayISO());
    setType(hasInitial("warung") ? "addition" : "initial");
    setCategory("warung");
    setAmount("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (capital: CapitalTransaction) => {
    setEditCapital(capital);
    setTransactionDate(capital.transactionDate);
    setType(capital.type);
    setCategory(normalizeCapitalCategory(capital.category));
    setAmount(String(capital.amount));
    setDescription(capital.description);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (saving || !transactionDate || !(amt > 0)) return;
    if (type === "initial" && !editCapital && hasInitial(category)) {
      toast("Modal awal hanya dapat dibuat satu kali.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editCapital) {
        await updateCapitalTransaction(editCapital.id, {
          transactionDate,
          type,
          category,
          amount: amt,
          description: description.trim(),
        });
        toast("Transaksi modal berhasil diperbarui.", "success");
      } else {
        const capitalNumber = await generateCapitalNumber();
        await addCapitalTransaction({
          capitalNumber,
          transactionDate,
          type,
          category,
          amount: amt,
          description: description.trim(),
        });
        toast("Transaksi modal berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      setEditCapital(null);
    } catch {
      toast("Gagal menyimpan transaksi modal.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteCapitalTransaction(deleteTarget.id);
      toast("Transaksi modal berhasil dihapus.", "success");
      if (selectedCapital?.id === deleteTarget.id) {
        setSelectedCapital(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus transaksi modal.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="w-full space-y-4 md:hidden">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold text-on-surface">Modal</h1>
          <button
            onClick={openAdd}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-secondary px-4 font-semibold text-white transition-all active:scale-95"
          >
            <Icon name="add" size={18} />
            Tambah
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Warung Capital
            </p>
            <p className="mt-1 text-numeric-display font-bold text-on-surface">
              {formatCurrency(warungCapital)}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Digital Capital
            </p>
            <p className="mt-1 text-numeric-display font-bold text-on-surface">
              {formatCurrency(digitalCapital)}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Total Modal Aktif
            </p>
            <p className="mt-1 text-numeric-display font-bold text-on-surface">
              {formatCurrency(combinedCapital)}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Break-even
            </p>
            <p className="mt-1 text-numeric-display font-bold text-secondary">
              {Math.round(warungBreakEvenPercent)}%
            </p>
            <p className="text-caption text-on-surface-variant">
              {isBreakEven ? "Sudah balik modal ✅" : "Belum balik modal"}
            </p>
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nomor atau deskripsi…"
        />

        {/* Capital List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon="account_balance_wallet"
              title={search ? "Tidak ditemukan" : "Belum ada transaksi modal"}
              description={search ? "Coba kata kunci lain." : "Catat modal awal untuk mulai melacak balik modal."}
            />
          ) : (
            filtered.map((capital) => {
              const meta = TYPE_META[capital.type];
              return (
                <div
                  key={capital.id}
                  onClick={() => {
                    setSelectedCapital(capital);
                    setDetailOpen(true);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border-standard bg-card p-4 shadow-card transition-all active:scale-[0.99]"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={meta.label}
                        variant={capital.type === "withdrawal" ? "danger" : capital.type === "addition" ? "success" : "info"}
                      />
                      <StatusBadge
                        label={CAPITAL_CATEGORY_LABELS[normalizeCapitalCategory(capital.category)]}
                        variant={capital.category === "digital_service" ? "info" : "default"}
                      />
                      <h3 className="truncate text-body-md font-bold text-on-surface">
                        {capital.capitalNumber}
                      </h3>
                    </div>
                    <p className="truncate text-caption text-on-surface-variant">
                      {formatDate(capital.transactionDate)}
                      {capital.description ? ` • ${capital.description}` : ""}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className={`font-bold ${meta.text}`}>
                      {meta.sign} {formatCurrency(capital.amount)}
                    </p>
                    <Icon name="chevron_right" size={16} className="ml-auto mt-1 text-outline" />
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
            {selectedCapital && (
              <MobileDetailContent
                capital={selectedCapital}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                  setDetailOpen(false);
                  openEdit(selectedCapital);
                }}
                onDelete={() => setDeleteTarget(selectedCapital)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden w-full min-h-0 md:flex">
        {/* Left: Capital List */}
        <aside className="flex min-h-0 w-[400px] flex-col border-r border-border-standard bg-surface-muted">
          <div className="space-y-3 border-b border-border-standard bg-surface p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold text-on-surface">Modal</h1>
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
              placeholder="Cari nomor atau deskripsi…"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant/60">
                <Icon name="account_balance_wallet" size={48} className="mx-auto mb-2 block" />
                <p>{search ? "Tidak ditemukan" : "Belum ada transaksi modal"}</p>
              </div>
            ) : (
              filtered.map((capital) => {
                const isSelected = selectedCapital?.id === capital.id;
                const meta = TYPE_META[capital.type];
                return (
                  <div
                    key={capital.id}
                    onClick={() => setSelectedCapital(capital)}
                    className={`cursor-pointer border-b border-border-standard p-4 transition-colors ${
                      isSelected
                        ? "border-l-4 border-l-secondary bg-card shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <StatusBadge
                          label={meta.label}
                          variant={capital.type === "withdrawal" ? "danger" : capital.type === "addition" ? "success" : "info"}
                        />
                        <StatusBadge
                          label={CAPITAL_CATEGORY_LABELS[normalizeCapitalCategory(capital.category)]}
                          variant={capital.category === "digital_service" ? "info" : "default"}
                        />
                        <h3 className="truncate text-label-xl font-bold text-on-surface">
                          {capital.capitalNumber}
                        </h3>
                      </div>
                      <p className={`ml-3 shrink-0 font-bold ${meta.text}`}>
                        {meta.sign} {formatCurrency(capital.amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-body-sm text-on-surface-variant">
                        {capital.description || "—"}
                      </p>
                      <span className="ml-3 shrink-0 text-caption text-on-surface-variant">
                        {formatDate(capital.transactionDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Capital Detail */}
        <section className="flex-1 flex flex-col bg-card min-h-0">
          {!selectedCapital ? (
            <div className="flex flex-1 items-center justify-center text-on-surface-variant/60">
              <div className="text-center">
                <Icon name="account_balance_wallet" size={64} className="mx-auto mb-3" />
                <p>Pilih transaksi modal untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent
              capital={selectedCapital}
              currentCapital={getCapitalBreakdown(normalizeCapitalCategory(selectedCapital.category)).current}
              onEdit={() => openEdit(selectedCapital)}
              onDelete={() => setDeleteTarget(selectedCapital)}
            />
          )}
        </section>
      </div>

      {/* ===== ADD / EDIT CAPITAL DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              {editCapital ? "Edit Transaksi Modal" : "Tambah Transaksi Modal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Tanggal <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Kategori Modal <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: "warung",
                      label: CAPITAL_CATEGORY_LABELS.warung,
                      icon: "shopping_bag",
                    },
                    {
                      value: "digital_service",
                      label: CAPITAL_CATEGORY_LABELS.digital_service,
                      icon: "smartphone",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setCategory(opt.value);
                      setType(hasInitial(opt.value) ? "addition" : "initial");
                    }}
                    className={`flex h-12 items-center justify-center gap-1.5 rounded-md text-label-md font-semibold transition-all active:scale-[0.98] ${
                      category === opt.value
                        ? "border-2 border-secondary bg-secondary/5 text-secondary"
                        : "border border-border-standard bg-card text-on-surface-variant"
                    }`}
                  >
                    <Icon name={opt.icon} size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Jenis Transaksi <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "initial", label: "Modal Awal", disabled: hasInitial(category) && !editCapital },
                    { value: "addition", label: "Penambahan", disabled: false },
                    { value: "withdrawal", label: "Penarikan", disabled: false },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => setType(opt.value)}
                    className={`h-12 rounded-md text-label-md font-semibold transition-all active:scale-[0.98] ${
                      type === opt.value
                        ? opt.value === "withdrawal"
                          ? "border-2 border-danger bg-danger/5 text-danger"
                          : "border-2 border-secondary bg-secondary/5 text-secondary"
                        : "border border-border-standard bg-card text-on-surface-variant"
                    } ${opt.disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {type === "initial" && !editCapital && (
                <p className="mt-1 text-caption text-on-surface-variant">
                  Modal awal hanya dapat dicatat satu kali.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">
                Jumlah <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
                placeholder="0"
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
                placeholder="Contoh: Tambahan modal untuk restock"
                rows={2}
              />
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
                disabled={saving || !transactionDate || !(Number(amount) > 0)}
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
        title="Hapus Transaksi Modal"
        description={
          deleteTarget
            ? `Yakin ingin menghapus "${deleteTarget.capitalNumber}" (${TYPE_META[deleteTarget.type].label}) sebesar ${formatCurrency(
                deleteTarget.amount
              )}? Tindakan ini dapat memengaruhi perhitungan modal.`
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
  capital,
  onClose,
  onEdit,
  onDelete,
}: {
  capital: CapitalTransaction;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[capital.type];
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
            {capital.capitalNumber}
          </span>
          <div className="mt-1">
            <StatusBadge
              label={CAPITAL_CATEGORY_LABELS[normalizeCapitalCategory(capital.category)]}
              variant={capital.category === "digital_service" ? "info" : "default"}
            />
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">{meta.label}</h2>
          <p className={`text-label-xl font-bold ${meta.text}`}>
            {meta.sign} {formatCurrency(capital.amount)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Edit transaksi modal"
          >
            <Icon name="edit" size={20} className="text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-surface-container active:scale-90"
            aria-label="Hapus transaksi modal"
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
          <p className="mb-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant">Tanggal</p>
          <p className="text-body-sm font-bold text-on-surface">{formatDate(capital.transactionDate)}</p>
        </div>
        {capital.description && (
          <div className="rounded-lg border border-border-standard bg-card p-3 shadow-card">
            <p className="mb-1 text-overline uppercase tracking-[0.08em] text-on-surface-variant">Deskripsi</p>
            <p className="whitespace-pre-wrap text-body-sm text-on-surface">{capital.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* Tablet detail content */
function TabletDetailContent({
  capital,
  currentCapital,
  onEdit,
  onDelete,
}: {
  capital: CapitalTransaction;
  currentCapital: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[capital.type];
  return (
    <>
      <div className="flex items-center justify-between border-b border-border-standard bg-surface-bright p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Icon name="account_balance_wallet" size={32} />
          </div>
          <div>
            <span className="text-caption text-on-surface-variant font-semibold">
              {capital.capitalNumber}
            </span>
            <h2 className="text-headline-md font-bold text-on-surface">{meta.label}</h2>
            <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Icon name={CATEGORY_META[normalizeCapitalCategory(capital.category)].icon} size={14} />
              {CAPITAL_CATEGORY_LABELS[normalizeCapitalCategory(capital.category)]}
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
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Jumlah</p>
            <p className={`mt-1 text-xl font-bold ${meta.text}`}>
              {meta.sign} {formatCurrency(capital.amount)}
            </p>
          </div>
          <div className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
              Total Modal Aktif
            </p>
            <p className="mt-1 text-body-sm font-bold text-on-surface">{formatCurrency(currentCapital)}</p>
          </div>
        </div>

        {capital.description && (
          <div>
            <h3 className="mb-2 text-label-xl font-bold text-on-surface">Deskripsi</h3>
            <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">
              {capital.description}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
