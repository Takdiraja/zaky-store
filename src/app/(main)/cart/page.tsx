"use client";

import { useRouter } from "next/navigation";
import CartItemRow from "@/components/kasir/cart-item";
import PaymentMethod from "@/components/kasir/payment-method";
import CustomerSelect from "@/components/kasir/customer-select";
import QrisPaymentDialog from "@/components/kasir/qris-payment-dialog";
import CashPaymentDialog from "@/components/kasir/cash-payment-dialog";
import ReceiptSuccessDialog from "@/components/kasir/receipt-success-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import EmptyState from "@/components/shared/empty-state";
import { PrintProgressDialog } from "@/components/shared/print-progress-dialog";
import { useCheckout } from "@/hooks/use-checkout";
import { useCartStore } from "@/stores/use-cart-store";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";

export default function CartPage() {
  const router = useRouter();
  const c = useCheckout({ onAfterDone: () => router.push("/") });
  const clearCart = useCartStore((s) => s.clearCart);

  if (c.items.length === 0) {
    return (
      <div className="pt-10">
        <EmptyState
          icon="shopping_cart"
          title="Keranjang kosong"
          description="Tidak ada produk di keranjang saat ini."
          actionLabel="Kembali ke Kasir"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header with back button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => router.push("/")}
          className="flex size-12 items-center justify-center rounded-md border border-border-standard bg-card text-on-surface transition-colors active:bg-surface-container"
          aria-label="Kembali"
        >
          <Icon name="chevron_right" size={20} className="rotate-180" />
        </button>
        <h1 className="text-headline-md font-bold text-on-surface">
          Keranjang ({c.totalItems})
        </h1>
        <button
          onClick={clearCart}
          className="ml-auto text-label-md font-bold text-danger"
        >
          Kosongkan
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {c.items.map((item) => (
          <div key={item.productId} className="rounded-lg border border-border-standard bg-card p-4 shadow-card">
            <CartItemRow item={item} />
          </div>
        ))}
      </div>

      {/* Payment & Checkout */}
      <div className="space-y-4">
        <PaymentMethod />
        <CustomerSelect />

        <div className="flex items-center justify-between border-t border-border-standard pt-4">
          <span className="text-body-md text-on-surface-variant">Total Pembayaran</span>
          <span className="text-headline-md font-extrabold text-secondary">
            {formatCurrency(c.totalAmount)}
          </span>
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
            onClick={() => router.push("/")}
            className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border-standard bg-card transition-transform active:scale-[0.98]"
            title="Scan Barcode"
            aria-label="Scan Barcode"
          >
            <Icon name="scan_barcode" size={20} />
          </button>
          <button
            onClick={c.handleCheckoutStart}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-transform active:scale-[0.98]"
          >
            <Icon name="check_circle" size={22} />
            {c.paymentMethod === "qris" ? "Bayar QRIS" : "Simpan Transaksi"}
          </button>
        </div>
      </div>

      {/* Cash Payment Dialog */}
      <CashPaymentDialog
        key={c.showCashPayment ? "open" : "closed"}
        open={c.showCashPayment}
        totalAmount={c.totalAmount}
        onConfirm={c.handleCashPaymentConfirm}
        onCancel={() => c.setShowCashPayment(false)}
      />

      {/* QRIS Dialog */}
      <QrisPaymentDialog
        open={c.showQris}
        amount={c.totalAmount}
        onConfirm={c.handleQrisConfirm}
        onClose={c.handleQrisClose}
      />

      {/* Receipt Success Dialog */}
      <ReceiptSuccessDialog
        open={c.showReceiptSuccess}
        receiptNumber={c.receiptNumber}
        totalAmount={c.totalAmount}
        amountPaid={c.amountPaid}
        change={c.change}
        paymentMethod={c.paymentMethod}
        customerPhone={c.customerPhone}
        onPrint={c.handlePrint}
        onWhatsApp={c.handleWhatsApp}
        onDone={c.handleReceiptDone}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={c.confirmCheckout}
        onOpenChange={c.setConfirmCheckout}
        title={c.checkoutError ? "Perhatian" : "Konfirmasi Transaksi"}
        description={c.checkoutMessage}
        confirmLabel={c.checkoutError ? "Tutup" : c.isSubmitting ? "Menyimpan..." : "Simpan"}
        confirmDisabled={c.isSubmitting && !c.checkoutError}
        variant={c.checkoutError ? "danger" : "default"}
        onConfirm={c.handleConfirmTransaction}
      />

      {/* Print progress + retry */}
      <PrintProgressDialog
        open={c.printOpen}
        state={c.printState}
        onRetry={c.retryPrint}
        onClose={c.closePrint}
      />
    </div>
  );
}
