"use client";

import { useState } from "react";
import { CheckCircle2, Printer, QrCode } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import DynamicQrisImage from "@/components/kasir/dynamic-qris-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useToast } from "@/components/shared/toast-provider";
import {
  PrintProgressDialog,
  printReceiptJob,
  type PrintPhase,
} from "@/components/shared/print-progress-dialog";
import type { ReceiptParams } from "@/lib/receipt-formatter";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * QRIS Manual — buat QR dinamis dengan nominal bebas (tidak ikut keranjang).
 * Alur: input nominal (+ catatan) → QR muncul → customer scan → Tandai Lunas
 * → tercatat sebagai transaksi QRIS lunas → struk sederhana tercetak.
 */
export default function QrisManualDialog({ open, onClose }: Props) {
  const { toast } = useToast();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const [step, setStep] = useState<"input" | "qr" | "done">("input");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<ReceiptParams | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printPhase, setPrintPhase] = useState<PrintPhase>("connecting");
  const [printError, setPrintError] = useState<string | null>(null);

  const amount = Math.round(Number(amountStr.replace(/\D/g, "")) || 0);

  const handleShowQr = () => {
    if (amount < 1000) {
      toast("Nominal minimal Rp1.000.", "error");
      return;
    }
    setStep("qr");
  };

  const handlePaid = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const now = new Date();
      const rn = `QRIS-M-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const itemName = note.trim() ? `QRIS Manual — ${note.trim()}` : "QRIS Manual";
      await addTransaction({
        date: now.toISOString(),
        items: [
          {
            productId: "qris-manual",
            name: itemName,
            quantity: 1,
            buyPrice: 0,
            sellPrice: amount,
            subtotal: amount,
            profit: amount,
          },
        ],
        totalAmount: amount,
        totalProfit: amount,
        paymentMethod: "qris",
        status: "paid",
        customerId: null,
        receiptNumber: rn,
        amountPaid: amount,
        change: 0,
        notes: note.trim() || null,
      });
      const settings = useSettingsStore.getState();
      const printer = usePrinterStore.getState();
      setSavedReceipt({
        items: [
          {
            productId: "qris-manual",
            name: itemName,
            quantity: 1,
            buyPrice: 0,
            sellPrice: amount,
            subtotal: amount,
            profit: amount,
          },
        ],
        totalAmount: amount,
        amountPaid: amount,
        change: 0,
        paymentMethod: "qris",
        receiptNumber: rn,
        date: now.toISOString(),
        paperWidth: printer.paperWidth ?? 58,
        storeName: settings.storeName,
        storeAddress: settings.storeAddress,
        storePhone: printer.storePhone ?? "",
      });
      setStep("done");
    } catch {
      toast("Gagal menyimpan transaksi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (!savedReceipt) return;
    setPrintOpen(true);
    setPrintPhase("connecting");
    setPrintError(null);
    try {
      await printReceiptJob(savedReceipt, (phase) => setPrintPhase(phase));
    } catch (err) {
      setPrintPhase("error");
      setPrintError(err instanceof Error ? err.message : "Gagal mencetak nota.");
    }
  };

  const handleClose = () => {
    setStep("input");
    setAmountStr("");
    setNote("");
    setSavedReceipt(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90dvh] max-w-[400px] overflow-y-auto">
        {step === "input" ? (
          <>
            <DialogHeader className="items-center text-center">
              <span className="mx-auto mb-1 flex size-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <QrCode className="size-7" />
              </span>
              <DialogTitle className="text-headline-md font-bold">QRIS Manual</DialogTitle>
              <DialogDescription className="text-body-md text-on-surface-variant">
                Buat QR dengan nominal bebas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-label-md text-on-surface-variant block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ""))}
                  placeholder="50000"
                  className="h-14 w-full rounded-lg border border-border-standard bg-surface px-4 text-xl font-bold outline-none focus:border-secondary"
                  autoFocus
                />
                {amount > 0 && (
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    = {formatCurrency(amount)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-label-md text-on-surface-variant block mb-1">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="cth: ongkir, jasa, ..."
                  maxLength={40}
                  className="h-12 w-full rounded-lg border border-border-standard bg-surface px-4 outline-none focus:border-secondary"
                />
              </div>
              <button
                onClick={handleShowQr}
                disabled={amount < 1000}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <QrCode className="size-5" />
                Tampilkan QR
              </button>
            </div>
          </>
        ) : step === "qr" ? (
          <>
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-headline-md font-bold">Scan untuk Bayar</DialogTitle>
              <DialogDescription className="text-body-md text-on-surface-variant">
                {note.trim() ? note.trim() : "QRIS Manual"}
              </DialogDescription>
            </DialogHeader>
            <div className="mx-auto flex w-full max-w-[300px] items-center justify-center overflow-hidden rounded-md border-2 border-border-standard bg-card p-1.5">
              <DynamicQrisImage amount={amount} size={300} className="h-auto w-full object-contain" />
            </div>
            <div className="rounded-md bg-surface-container p-3 text-center">
              <p className="text-label-md text-on-surface-variant">Nominal</p>
              <p className="text-headline-md font-extrabold text-secondary">
                {formatCurrency(amount)}
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={handlePaid}
                disabled={saving}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-success font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <QrCode className="size-5" />
                {saving ? "Menyimpan..." : "Tandai Lunas"}
              </button>
              <button
                onClick={() => setStep("input")}
                className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border-standard font-semibold text-on-surface-variant"
              >
                Ubah Nominal
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="items-center text-center">
              <span className="mx-auto mb-1 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </span>
              <DialogTitle className="text-headline-md font-bold">Pembayaran Tercatat</DialogTitle>
              <DialogDescription className="text-body-md text-on-surface-variant">
                {savedReceipt?.receiptNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md bg-surface-container p-3 text-center">
              <p className="text-label-md text-on-surface-variant">Nominal</p>
              <p className="text-headline-md font-extrabold text-secondary">
                {formatCurrency(amount)}
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={handlePrint}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98]"
              >
                <Printer className="size-5" />
                Cetak Struk
              </button>
              <button
                onClick={handleClose}
                className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border-standard font-semibold text-on-surface-variant"
              >
                Selesai
              </button>
            </div>
          </>
        )}
      </DialogContent>

      <PrintProgressDialog
        open={printOpen}
        state={{ phase: printPhase, error: printError }}
        onClose={() => setPrintOpen(false)}
        onRetry={handlePrint}
      />
    </Dialog>
  );
}
