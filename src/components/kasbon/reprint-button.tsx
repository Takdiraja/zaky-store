"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useToast } from "@/components/shared/toast-provider";
import { APP_NAME } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PrintProgressDialog,
  printReceiptJob,
  type PrintJobState,
  type PrintPhase,
} from "@/components/shared/print-progress-dialog";

interface Props {
  transaction: Transaction;
}

export default function ReprintButton({ transaction }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [printState, setPrintState] = useState<PrintJobState>({ phase: "idle" as PrintPhase, error: null });
  const [printOpen, setPrintOpen] = useState(false);
  const { paperWidth } = usePrinterStore();
  const { getCustomerById } = useCustomerStore();
  const { toast } = useToast();

  const customer = transaction.customerId ? getCustomerById(transaction.customerId) : null;
  const customerPhone = customer?.phone;

  const params = {
    items: transaction.items,
    totalAmount: transaction.totalAmount,
    amountPaid: transaction.amountPaid,
    change: transaction.change,
    paymentMethod: transaction.paymentMethod,
    receiptNumber: transaction.receiptNumber ?? "",
    date: transaction.date,
    customerName: customer?.name,
    paperWidth,
    storeName: APP_NAME,
  };

  const handlePrint = async () => {
    setOpen(false);
    setLoading("print");
    setPrintOpen(true);
    setPrintState({ phase: "connecting", error: null });
    try {
      await printReceiptJob(params, (phase) => setPrintState({ phase, error: null }));
    } catch (err) {
      setPrintState({
        phase: "error",
        error: err instanceof Error ? err.message : "Gagal mencetak nota.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRetry = async () => {
    setPrintState({ phase: "connecting", error: null });
    try {
      await printReceiptJob(params, (phase) => setPrintState({ phase, error: null }));
    } catch (err) {
      setPrintState({
        phase: "error",
        error: err instanceof Error ? err.message : "Gagal mencetak nota.",
      });
    }
  };

  const handleWhatsApp = () => {
    if (!customerPhone) {
      toast("Nomor WhatsApp pelanggan belum tersedia.", "error");
      return;
    }

    sendWhatsAppReceipt(customerPhone, {
      items: transaction.items,
      totalAmount: transaction.totalAmount,
      amountPaid: transaction.amountPaid,
      change: transaction.change,
      paymentMethod: transaction.paymentMethod,
      receiptNumber: transaction.receiptNumber ?? "",
      date: transaction.date,
      customerName: customer?.name,
      paperWidth,
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-secondary font-bold text-label-md flex items-center gap-1"
      >
        <Icon name="receipt_long" size={16} />
        Cetak Ulang
      </button>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-headline-md font-bold">
              Cetak Ulang Nota
            </DialogTitle>
            <DialogDescription className="text-label-md text-on-surface-variant font-mono">
              {transaction.receiptNumber || "Tanpa nomor nota"}
            </DialogDescription>
          </DialogHeader>

          {/* Customer info */}
          {customer && (
            <div className="bg-surface-container-low rounded-xl p-3 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Icon name="account_circle" size={16} className="text-outline shrink-0" />
                <span className="font-medium">{customer.name}</span>
              </div>
              {customer.phone ? (
                <a
                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-secondary hover:underline"
                >
                  <Icon name="message_circle" size={16} className="shrink-0" />
                  <span>{customer.phone}</span>
                </a>
              ) : (
                <p className="text-xs text-outline flex items-center gap-1">
                  <Icon name="warning" size={14} />
                  Tambahkan nomor telepon di menu Pelanggan
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handlePrint}
              disabled={loading === "print"}
              className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <Icon name="print" size={20} />
              {loading === "print" ? "Mencetak..." : "Cetak Nota"}
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={loading === "wa" || !customerPhone}
              className={`w-full h-touch-target-min rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 ${
                customerPhone
                  ? "border-2 border-secondary text-secondary"
                  : "border border-border-standard text-on-surface-variant cursor-not-allowed"
              }`}
            >
              <Icon name="message_circle" size={20} />
              Kirim WhatsApp
            </button>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="w-full h-12 text-on-surface-variant font-bold active:opacity-80"
          >
            Tutup
          </button>
        </DialogContent>
      </Dialog>

      {/* Print progress + retry */}
      <PrintProgressDialog
        open={printOpen}
        state={printState}
        onRetry={handleRetry}
        onClose={() => {
          setPrintOpen(false);
          setPrintState({ phase: "idle" as PrintPhase, error: null });
        }}
      />
    </>
  );
}
