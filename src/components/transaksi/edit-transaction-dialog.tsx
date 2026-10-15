"use client";

import { useState, useMemo } from "react";
import type { Transaction, CartItem, PaymentMethod } from "@/types";
import { useProductStore } from "@/stores/use-product-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import { useToast } from "@/components/shared/toast-provider";
import QuantityControl from "@/components/kasir/quantity-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export default function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: Props) {
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const { toast } = useToast();

  // Initial form state is derived from `transaction` at mount time.
  // The parent remounts this component via `key` each time it opens for a
  // different transaction, so state always matches the transaction being edited.
  const [items, setItems] = useState<CartItem[]>(
    () => transaction?.items.map((i) => ({ ...i })) ?? []
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    () => transaction?.paymentMethod ?? "cash"
  );
  const [customerId, setCustomerId] = useState<string>(
    () => transaction?.customerId ?? ""
  );
  const [notes, setNotes] = useState(
    () => transaction?.notes ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const totals = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.totalAmount += i.subtotal;
        acc.totalProfit += i.profit;
        return acc;
      },
      { totalAmount: 0, totalProfit: 0 }
    );
  }, [items]);

  const oldQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    transaction?.items.forEach((i) => {
      map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity);
    });
    return map;
  }, [transaction]);

  const availableProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.isActive &&
        (!q || p.name.toLowerCase().includes(q)) &&
        !items.some((i) => i.productId === p.id)
    );
  }, [products, productSearch, items]);

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const subtotal = i.sellPrice * quantity;
        const profit = (i.sellPrice - i.buyPrice) * quantity;
        return { ...i, quantity, subtotal, profit };
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => {
      if (prev.some((i) => i.productId === productId)) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          subtotal: product.sellPrice,
          profit: product.sellPrice - product.buyPrice,
        },
      ];
    });
    setProductPickerOpen(false);
    setProductSearch("");
  };

  const handleSave = async () => {
    if (saving || !transaction || items.length === 0) return;
    if (paymentMethod === "kasbon" && !customerId) {
      toast("Silakan pilih pelanggan untuk transaksi kasbon.", "error");
      return;
    }
    setSaving(true);
    try {
      // Pre-validate stock for increased quantities.
      const newQtyMap = new Map<string, number>();
      items.forEach((i) => {
        newQtyMap.set(i.productId, (newQtyMap.get(i.productId) ?? 0) + i.quantity);
      });
      for (const item of items) {
        const delta = newQtyMap.get(item.productId)! - (oldQtyByProduct.get(item.productId) ?? 0);
        if (delta > 0) {
          const product = products.find((p) => p.id === item.productId);
          if (!product || product.stock < delta) {
            toast(`Stok ${item.name} tidak mencukupi.`, "error");
            return;
          }
        }
      }

      const result = await updateTransaction(transaction.id, {
        items,
        totalAmount: totals.totalAmount,
        totalProfit: totals.totalProfit,
        paymentMethod,
        customerId: customerId || null,
        status: paymentMethod === "kasbon" ? "debt" : "paid",
        notes: notes.trim() || null,
      });

      if (!result.ok) {
        toast(result.error || "Gagal memperbarui transaksi.", "error");
        return;
      }

      toast("Transaksi berhasil diperbarui.", "success");
      onOpenChange(false);
    } catch {
      toast("Gagal memperbarui transaksi.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[440px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline-md font-bold">
            Edit Transaksi
          </DialogTitle>
        </DialogHeader>

        {/* Non-editable info */}
        {transaction && (
          <div className="space-y-0.5 rounded-md bg-surface-container-low p-3">
            <p className="text-label-md font-mono font-bold text-secondary">
              {transaction.receiptNumber || "—"}
            </p>
            <p className="text-caption text-on-surface-variant">
              Dibuat {formatDateTime(transaction.date)}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-label-md text-on-surface-variant font-semibold">
                Produk
              </label>
              <button
                onClick={() => setProductPickerOpen((v) => !v)}
                className="text-secondary font-bold text-label-md flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Icon name="add" size={16} />
                Tambah Produk
              </button>
            </div>

            {productPickerOpen && (
              <div className="mb-3 border border-border-standard rounded-xl p-3 space-y-2 bg-surface">
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-10 px-3 border border-border-standard rounded-lg focus:border-secondary outline-none text-sm"
                  placeholder="Cari produk..."
                  autoFocus
                />
                <div className="max-h-[180px] overflow-y-auto space-y-1">
                  {availableProducts.length === 0 ? (
                    <p className="text-sm text-on-surface-variant/60 py-2 text-center">
                      Tidak ada produk
                    </p>
                  ) : (
                    availableProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p.id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors text-left"
                      >
                        <span className="text-sm font-medium truncate">
                          {p.name}
                        </span>
                        <span className="text-xs text-outline shrink-0 ml-2">
                          {formatCurrency(p.sellPrice)} • Stok {p.stock}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 py-4 text-center">
                Belum ada produk. Tambahkan produk.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const maxStock =
                    product === undefined
                      ? undefined
                      : product.stock +
                        (oldQtyByProduct.get(item.productId) ?? 0);
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-2 border border-border-standard rounded-xl p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-outline">
                          {formatCurrency(item.sellPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <QuantityControl
                          quantity={item.quantity}
                          maxStock={maxStock}
                          onDecrement={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          onIncrement={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                        />
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-danger-alert w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger-alert/10 active:scale-90 transition-all"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="text-label-md text-on-surface-variant font-semibold block mb-2">
              Metode Pembayaran
            </label>
            <div className="grid gap-2 grid-cols-3">
              {(
                [
                  { value: "cash", label: "Tunai", icon: "payments" },
                  { value: "kasbon", label: "Kasbon", icon: "menu_book" },
                  { value: "qris", label: "QRIS", icon: "qr_code_2" },
                ] as const
              ).map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`touch-target flex items-center justify-center gap-1.5 font-bold text-label-md rounded-xl transition-all ${
                    paymentMethod === m.value
                      ? m.value === "kasbon"
                        ? "border-2 border-warning-debt bg-warning-debt/5 text-warning-debt"
                        : "border-2 border-secondary bg-secondary/5 text-secondary"
                      : "border border-border-standard text-outline"
                  }`}
                >
                  <Icon name={m.icon} size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="text-label-md text-on-surface-variant font-semibold block mb-1">
              Pelanggan
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
            >
              <option value="">
                {paymentMethod === "kasbon"
                  ? "Pilih pelanggan..."
                  : "Tanpa pelanggan"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-label-md text-on-surface-variant font-semibold block mb-1">
              Catatan{" "}
              <span className="text-outline font-normal">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-md border border-border-standard bg-card px-4 py-3 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="Catatan transaksi..."
              rows={2}
            />
          </div>

          {/* Totals */}
          <div className="border-t border-border-standard pt-3 space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Laba</span>
              <span className="text-success-paid font-medium">
                {formatCurrency(totals.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-bold text-secondary text-body-lg">
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="h-12 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
