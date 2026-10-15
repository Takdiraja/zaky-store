"use client";

import { useCartStore } from "@/stores/use-cart-store";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import CartItemRow from "./cart-item";
import PaymentMethod from "./payment-method";
import CustomerSelect from "./customer-select";

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onScan: () => void;
}

export default function CartDrawer({ open, onClose, onCheckout, onScan }: Props) {
  const { items, clearCart } = useCartStore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-standard px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-md transition-colors active:bg-surface-container"
            aria-label="Tutup keranjang"
          >
            <Icon name="chevron_right" size={22} className="rotate-180" />
          </button>
          <h2 className="text-headline-md font-bold text-on-surface">Keranjang ({totalItems})</h2>
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-label-md font-bold text-danger">
            Kosongkan
          </button>
        )}
      </div>

      {/* Items - scrollable */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-on-surface-variant/60">
              <Icon name="shopping_cart" size={48} className="mx-auto mb-2 block" />
              <p>Keranjang masih kosong</p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))
        )}
      </div>

      {/* Sticky footer */}
      {items.length > 0 && (
        <div className="shrink-0 border-t border-border-standard bg-card shadow-dialog">
          <div className="space-y-4 px-4 py-4">
            <PaymentMethod />
            <CustomerSelect />

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between border-t border-border-standard pt-2">
                <span className="text-headline-md text-on-surface">Total</span>
                <span className="text-headline-md font-extrabold text-secondary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-draft"))}
                className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border-standard bg-card transition-transform active:scale-[0.98]"
                title="Simpan Draft"
                aria-label="Simpan Draft"
              >
                <Icon name="save" size={20} />
              </button>
              <button
                onClick={onScan}
                className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border-standard bg-card transition-transform active:scale-[0.98]"
                title="Scan Barcode"
                aria-label="Scan Barcode"
              >
                <Icon name="scan_barcode" size={20} />
              </button>
              <button
                onClick={onCheckout}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-secondary text-body-lg font-semibold text-white shadow-fab transition-transform active:scale-[0.98]"
              >
                <Icon name="check_circle" size={22} />
                Konfirmasi & Bayar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
