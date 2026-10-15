"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useToast } from "@/components/shared/toast-provider";
import { formatCurrency } from "@/lib/formatters";
import { APP_NAME } from "@/lib/constants";
import { generateReceiptNumber } from "@/lib/receipt-counter";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import {
  printReceiptJob,
  type PrintJobState,
  type PrintPhase,
} from "@/components/shared/print-progress-dialog";

/**
 * Shared checkout logic for the Kasir page and the /cart page.
 * Business logic is identical to the original implementation — only the
 * presentation moved out. `onAfterDone` lets a page run navigation after
 * the flow completes (e.g. /cart redirects back to "/").
 */
export function useCheckout(opts?: { onAfterDone?: () => void }) {
  const { items, paymentMethod, selectedCustomerId, clearCart } = useCartStore();
  const products = useProductStore((s) => s.products);
  const productsLoading = useProductStore((s) => s.loading);
  const productsInitialized = useProductStore((s) => s.initialized);
  const reduceStock = useProductStore((s) => s.reduceStock);
  const findProductByBarcode = useProductStore((s) => s.findProductByBarcode);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransactionStatus = useTransactionStore((s) => s.updateTransactionStatus);
  const updateDebt = useCustomerStore((s) => s.updateDebt);
  const { toast } = useToast();
  const { paperWidth } = usePrinterStore();

  const [cartOpen, setCartOpen] = useState(false);
  const [showQris, setShowQris] = useState(false);
  const [qrisTransactionId, setQrisTransactionId] = useState<string | null>(null);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [showReceiptSuccess, setShowReceiptSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [change, setChange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printState, setPrintState] = useState<PrintJobState>({ phase: "idle" as PrintPhase, error: null });
  const [printOpen, setPrintOpen] = useState(false);
  const printParamsRef = useRef<Parameters<typeof printReceiptJob>[0] | null>(null);
  /** Timestamp captured when the transaction is confirmed — used both for
   *  the stored record and the printed receipt so they always agree. */
  const transactionTimeRef = useRef(new Date().toISOString());

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);

  // Auto-recover cart on mount, then apply "new kasbon" navigation intent.
  useEffect(() => {
    useCartStore.getState().recoverCart();
    useCartStore.getState().consumeKasbon();
  }, []);

  const getSelectedCustomer = () => {
    if (!selectedCustomerId) return undefined;
    return useCustomerStore.getState().customers.find((c) => c.id === selectedCustomerId);
  };

  const customerPhone = getSelectedCustomer()?.phone;

  const handleCheckoutStart = () => {
    if (items.length === 0) return;
    if (paymentMethod === "kasbon" && !selectedCustomerId) {
      setCheckoutError("Silakan pilih pelanggan untuk transaksi kasbon.");
      setConfirmCheckout(true);
      return;
    }
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        setCheckoutError(`Stok ${item.name} tidak mencukupi.`);
        setConfirmCheckout(true);
        return;
      }
    }
    setCheckoutError("");
    setConfirmCheckout(true);
  };

  const handleConfirmTransaction = async () => {
    setConfirmCheckout(false);
    if (checkoutError) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Generate receipt number
      const rn = await generateReceiptNumber();
      setReceiptNumber(rn);
      setAmountPaid(0);
      setChange(0);
      // Capture the transaction time once — shared by storage + printed receipt.
      transactionTimeRef.current = new Date().toISOString();

      if (paymentMethod === "cash") {
        setShowCashPayment(true);
        return;
      }

      if (paymentMethod === "qris") {
        // QRIS: save as unpaid (debt). Stock is reduced only when the
        // cashier confirms the payment has been received.
        const txnId = await addTransaction({
            date: transactionTimeRef.current,
          items: items.map((i) => ({ ...i })),
          totalAmount,
          totalProfit,
          paymentMethod,
          status: "debt",
          customerId: selectedCustomerId,
          receiptNumber: rn,
          amountPaid: 0,
          change: 0,
        });
        setQrisTransactionId(txnId);
        setShowQris(true);
        return;
      }

      // Non-cash (kasbon): reduce stock and save
      for (const item of items) {
        const ok = await reduceStock(item.productId, item.quantity);
        if (!ok) {
          toast(`Stok ${item.name} tidak mencukupi.`, "error");
          return;
        }
      }

      await addTransaction({
          date: transactionTimeRef.current,
        items: items.map((i) => ({ ...i })),
        totalAmount,
        totalProfit,
        paymentMethod,
        status: paymentMethod === "kasbon" ? "debt" : "paid",
        customerId: selectedCustomerId,
        receiptNumber: rn,
        amountPaid: 0,
        change: 0,
      });

      if (paymentMethod === "kasbon" && selectedCustomerId) {
        await updateDebt(selectedCustomerId, totalAmount);
      }

      toast("Transaksi berhasil disimpan!");
      setShowReceiptSuccess(true);
    } catch {
      toast("Gagal menyimpan transaksi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashPaymentConfirm = async (paid: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      setShowCashPayment(false);
      const chg = paid - totalAmount;
      setAmountPaid(paid);
      setChange(chg);

      for (const item of items) {
        const ok = await reduceStock(item.productId, item.quantity);
        if (!ok) {
          toast(`Stok ${item.name} tidak mencukupi.`, "error");
          return;
        }
      }

      await addTransaction({
          date: transactionTimeRef.current,
        items: items.map((i) => ({ ...i })),
        totalAmount,
        totalProfit,
        paymentMethod: "cash",
        status: "paid",
        customerId: selectedCustomerId,
        receiptNumber,
        amountPaid: paid,
        change: chg,
      });

      toast("Transaksi berhasil disimpan!");
      setShowReceiptSuccess(true);
    } catch {
      toast("Gagal menyimpan transaksi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrisConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Stock is reduced inside updateTransactionStatus (qris debt → paid).
      if (!qrisTransactionId) return;
      await updateTransactionStatus(qrisTransactionId, "paid");
      setShowQris(false);
      setShowReceiptSuccess(true);
    } catch {
      toast("Gagal mengonfirmasi pembayaran.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrisClose = () => {
    setShowQris(false);
    clearCart();
    setCartOpen(false);
    setQrisTransactionId(null);
    toast("Transaksi QRIS disimpan sebagai Belum Dibayar.", "info");
    opts?.onAfterDone?.();
  };

  const handleReceiptDone = () => {
    clearCart();
    setShowReceiptSuccess(false);
    setCartOpen(false);
    opts?.onAfterDone?.();
  };

  const handlePrint = async () => {
    const customer = getSelectedCustomer();
    const params = {
      items,
      totalAmount,
      amountPaid,
      change,
      paymentMethod,
      receiptNumber,
      date: transactionTimeRef.current,
      customerName: customer?.name,
      paperWidth,
      storeName: APP_NAME,
    };
    printParamsRef.current = params;

    const run = async () => {
      setPrintOpen(true);
      setPrintState({ phase: "connecting", error: null });
      try {
        await printReceiptJob(params, (phase) =>
          setPrintState({ phase, error: null }),
        );
      } catch (err) {
        setPrintState({
          phase: "error",
          error: err instanceof Error ? err.message : "Gagal mencetak nota.",
        });
      }
    };
    await run();
  };

  const retryPrint = useCallback(async () => {
    const params = printParamsRef.current;
    if (!params) return;
    setPrintState({ phase: "connecting", error: null });
    try {
      await printReceiptJob(params, (phase) =>
        setPrintState({ phase, error: null }),
      );
    } catch (err) {
      setPrintState({
        phase: "error",
        error: err instanceof Error ? err.message : "Gagal mencetak nota.",
      });
    }
  }, []);

  const closePrint = useCallback(() => {
    setPrintOpen(false);
    setPrintState({ phase: "idle" as PrintPhase, error: null });
    printParamsRef.current = null;
  }, []);

  const handleWhatsApp = () => {
    if (!customerPhone) {
      toast("Nomor WhatsApp pelanggan belum tersedia.", "error");
      return;
    }
    const customer = getSelectedCustomer();
    sendWhatsAppReceipt(customerPhone, {
      items,
      totalAmount,
      amountPaid,
      change,
      paymentMethod,
      receiptNumber,
      date: transactionTimeRef.current,
      customerName: customer?.name,
      paperWidth,
    });
  };

  const handleScanResult = useCallback(
    (barcode: string) => {
      const code = barcode.trim();
      // Data produk belum selesai dimuat (mis. internet lambat) — jangan
      // langsung bilang "tidak ada", suruh tunggu sebentar.
      if (productsLoading || !productsInitialized) {
        toast("Data produk masih dimuat, coba scan lagi sebentar...", "error");
        return;
      }
      const product = findProductByBarcode(code);
      if (!product) {
        toast(
          `Kode "${code}" tidak ditemukan. Tambahkan dulu di menu Produk.`,
          "error"
        );
        return;
      }
      if (product.stock <= 0) {
        toast("Stok produk habis.", "error");
        return;
      }
      useCartStore.getState().addToCart(product);
      toast(`${product.name} ditambahkan ke keranjang.`, "success");
    },
    [findProductByBarcode, productsLoading, productsInitialized, toast]
  );

  const checkoutMessage =
    checkoutError ||
    (paymentMethod === "qris"
      ? `Lanjutkan pembayaran QRIS sebesar ${formatCurrency(totalAmount)}?`
      : paymentMethod === "kasbon"
      ? `Simpan transaksi kasbon sebesar ${formatCurrency(totalAmount)}?`
      : `Simpan transaksi tunai sebesar ${formatCurrency(totalAmount)}?`);

  /**
   * Repeat the most recent completed transaction: restore its items into the
   * cart (skipping products that are no longer active or out of stock).
   */
  const repeatLastOrder = useCallback(() => {
    const txns = useTransactionStore.getState().transactions;
    const last = txns.find((t) => t.status === "paid") ?? txns[0];
    if (!last || last.items.length === 0) {
      toast("Belum ada transaksi untuk diulang.", "info");
      return;
    }
    const cart = useCartStore.getState();
    const products = useProductStore.getState().products;
    for (const item of last.items) {
      const product = products.find((p) => p.id === item.productId && p.isActive);
      if (!product || product.stock <= 0) continue;
      // Add the same quantity, capped at available stock.
      const qty = Math.min(item.quantity, product.stock);
      cart.addToCart(product);
      for (let i = 1; i < qty; i++) {
        useCartStore.getState().updateQuantity(item.productId, i + 1);
      }
    }
    toast("Transaksi terakhir diulang ke keranjang.", "success");
  }, [toast]);

  return {
    // data
    items,
    totalItems,
    totalAmount,
    paymentMethod,
    customerPhone,
    clearCart,
    repeatLastOrder,
    // dialog visibility
    cartOpen,
    setCartOpen,
    scannerOpen,
    setScannerOpen,
    showCashPayment,
    setShowCashPayment,
    showQris,
    showReceiptSuccess,
    confirmCheckout,
    setConfirmCheckout,
    checkoutError,
    checkoutMessage,
    receiptNumber,
    amountPaid,
    change,
    isSubmitting,
    // actions
    handleCheckoutStart,
    handleConfirmTransaction,
    handleCashPaymentConfirm,
    handleQrisConfirm,
    handleQrisClose,
    handleReceiptDone,
    handlePrint,
    retryPrint,
    closePrint,
    printState,
    printOpen,
    handleWhatsApp,
    handleScanResult,
  };
}
