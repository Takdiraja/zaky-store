"use client";

import { useEffect } from "react";
import KasirHeader from "@/components/kasir/kasir-header";
import ProductGrid from "@/components/kasir/product-grid";
import CartBar from "@/components/kasir/cart-bar";
import CartDrawer from "@/components/kasir/cart-drawer";
import CartItemRow from "@/components/kasir/cart-item";
import PaymentMethod from "@/components/kasir/payment-method";
import CustomerSelect from "@/components/kasir/customer-select";
import QrisPaymentDialog from "@/components/kasir/qris-payment-dialog";
import CashPaymentDialog from "@/components/kasir/cash-payment-dialog";
import ReceiptSuccessDialog from "@/components/kasir/receipt-success-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import EmptyState from "@/components/shared/empty-state";
import ScannerDialog from "@/components/shared/scanner-dialog";
import FlyingBalls from "@/components/kasir/flying-balls";
import { PrintProgressDialog } from "@/components/shared/print-progress-dialog";
import { useCheckout } from "@/hooks/use-checkout";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";

export default function KasirPage() {
  const c = useCheckout();

  // F2 shortcut (from KasirHeader) opens the scanner.
  useEffect(() => {
    const handler = () => c.setScannerOpen(true);
    window.addEventListener("open-scanner", handler);
    return () => window.removeEventListener("open-scanner", handler);
  }, [c]);

  return (
    <div className="flex h-dvh kasir-layout">
      {/* Left: Header + Product grid */}
      <div className="flex min-w-0 flex-[3] flex-col border-r border-border-standard">
        <KasirHeader />
        <div className="flex-1 overflow-y-auto">
          <ProductGrid />
        </div>
        {/* Scan FAB — mobile only */}
        <button
          onClick={() => c.setScannerOpen(true)}
          className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-lg bg-card text-secondary shadow-fab ring-2 ring-secondary transition-all active:scale-90 hover:bg-secondary hover:text-white md:hidden"
          aria-label="Scan barcode"
        >
          <Icon name="scan_barcode" size={26} />
        </button>
      </div>

      {/* Right: Cart panel — tablet only */}
      <aside className="hidden min-h-0 flex-1 flex-col bg-card md:flex" data-cart-target>
        <div className="flex shrink-0 items-center justify-between border-b border-border-standard px-4 py-4">
          <h2 className="text-headline-md font-bold text-on-surface">Keranjang</h2>
          {c.items.length > 0 && (
            <button
              onClick={c.clearCart}
              className="flex items-center gap-1 text-label-md font-bold text-danger"
            >
              <Icon name="delete" size={16} />
              Hapus
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {c.items.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <EmptyState
                icon="shopping_cart"
                title="Keranjang kosong"
                description="Ketuk produk untuk menambahkannya ke keranjang."
              />
            </div>
          ) : (
            <div className="divide-y divide-border-standard">
              {c.items.map((item) => (
                <div key={item.productId} className="px-4 py-3">
                  <CartItemRow item={item} />
                </div>
              ))}
            </div>
          )}
        </div>

        {c.items.length > 0 && (
          <div className="shrink-0 space-y-4 border-t border-border-standard bg-surface-container-low px-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-1">
                <span className="text-headline-md text-on-surface">Total</span>
                <span className="text-headline-md font-bold text-secondary">
                  {formatCurrency(c.totalAmount)}
                </span>
              </div>
            </div>
            <PaymentMethod />
            <CustomerSelect />
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
                onClick={() => c.setScannerOpen(true)}
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
        )}

        {/* Empty state: still show scan button even when cart is empty */}
        {c.items.length === 0 && (
          <div className="shrink-0 border-t border-border-standard px-4 py-4">
            <button
              onClick={() => c.setScannerOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-secondary font-semibold text-secondary transition-transform active:scale-[0.98]"
            >
              <Icon name="scan_barcode" size={22} />
              Scan Barcode
            </button>
          </div>
        )}
      </aside>

      {/* CartBar + CartDrawer + FlyingBalls + QRIS Dialog */}
      <CartBar onOpen={() => c.setCartOpen(true)} />
      <CartDrawer
        open={c.cartOpen}
        onClose={() => c.setCartOpen(false)}
        onCheckout={c.handleCheckoutStart}
        onScan={() => {
          c.setCartOpen(false);
          c.setScannerOpen(true);
        }}
      />
      <FlyingBalls />

      {/* Scanner Dialog — cashier mode */}
      <ScannerDialog
        open={c.scannerOpen}
        onClose={() => c.setScannerOpen(false)}
        onScan={c.handleScanResult}
        mode="cashier"
      />

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
        onRepeat={c.repeatLastOrder}
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
