"use client";

import { CheckCircle2, Printer, MessageCircle, RefreshCw } from "lucide-react";
import type { PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  receiptNumber: string;
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  onPrint: () => void;
  onWhatsApp: () => void;
  onRepeat?: () => void;
  onDone: () => void;
}

export default function ReceiptSuccessDialog({
  open,
  receiptNumber,
  totalAmount,
  amountPaid,
  change,
  paymentMethod,
  customerPhone,
  onPrint,
  onWhatsApp,
  onRepeat,
  onDone,
}: Props) {
  const isKasbon = paymentMethod === "kasbon";
  const hasPhone = !!customerPhone;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDone()}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader className="items-center text-center">
          <span className="mx-auto mb-1 flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </span>
          <DialogTitle className="text-headline-md font-bold">Transaksi Berhasil!</DialogTitle>
          <DialogDescription className="font-mono text-label-md text-on-surface-variant">
            {receiptNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Status badge for kasbon */}
        {isKasbon && (
          <div className="rounded-md bg-warning/10 p-3 text-center">
            <p className="text-label-md font-bold uppercase tracking-wider text-warning">Kasbon</p>
          </div>
        )}

        {/* Total */}
        <div className="rounded-md bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant">Total Pembayaran</span>
            <span className="text-headline-md font-extrabold text-secondary">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {paymentMethod === "cash" && amountPaid > 0 && (
            <>
              <div className="mt-2 flex items-center justify-between border-t border-border-standard pt-2">
                <span className="text-label-md text-on-surface-variant">Tunai</span>
                <span className="text-body-md font-bold">{formatCurrency(amountPaid)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-label-md text-on-surface-variant">Kembali</span>
                <span className="text-body-md font-bold text-success">{formatCurrency(change)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {onRepeat && (
            <button
              onClick={onRepeat}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-secondary bg-card font-semibold text-secondary transition-all active:scale-[0.98]"
            >
              <RefreshCw className="size-5" />
              Ulangi Pesanan
            </button>
          )}
          <button
            onClick={onPrint}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98]"
          >
            <Printer className="size-5" />
            Cetak Nota
          </button>
          {hasPhone && (
            <button
              onClick={onWhatsApp}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-secondary font-semibold text-secondary transition-all active:scale-[0.98]"
            >
              <MessageCircle className="size-5" />
              Kirim WhatsApp
            </button>
          )}
          <button
            onClick={onDone}
            className="h-12 w-full text-body-md font-semibold text-on-surface-variant transition-opacity active:opacity-80"
          >
            Selesai
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
