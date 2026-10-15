"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import Image from "next/image";
import QrisFullscreenDialog from "@/components/transaksi/qris-fullscreen-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  amount?: number;
  receiptNumber?: string | null;
}

/** Displays the store's QRIS image for re-scanning (e.g. from the Transaksi page). */
export default function QrisImageDialog({ open, onClose, amount, receiptNumber }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-[400px] overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <span className="mx-auto mb-1 flex size-14 items-center justify-center rounded-full bg-info/10 text-info">
            <QrCode className="size-7" />
          </span>
          <DialogTitle className="text-headline-md font-bold">Scan Ulang QRIS</DialogTitle>
          {receiptNumber && (
            <DialogDescription className="font-mono text-label-md text-on-surface-variant">
              {receiptNumber}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* QR Code Image — click to open fullscreen */}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="mx-auto flex w-full max-w-[300px] cursor-zoom-in items-center justify-center overflow-hidden rounded-md border-2 border-border-standard bg-card p-1.5 transition-transform active:scale-[0.99]"
          aria-label="Perbesar QRIS"
        >
          <Image
            src="/images/QRIS.jpg"
            alt="QRIS"
            width={300}
            height={300}
            className="h-auto w-full object-contain"
            unoptimized
          />
        </button>
        <p className="-mt-1 text-center text-caption text-on-surface-variant">
          Ketuk gambar untuk memperbesar
        </p>

        {amount !== undefined && (
          <div className="rounded-md bg-surface-container p-4 text-center">
            <p className="text-label-md text-on-surface-variant">Total Pembayaran</p>
            <p className="text-headline-md font-extrabold text-secondary">{formatCurrency(amount)}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-transform active:scale-[0.98]"
        >
          Tutup
        </button>
      </DialogContent>

      {/* Fullscreen QRIS */}
      <QrisFullscreenDialog open={fullscreen} onClose={() => setFullscreen(false)} />
    </Dialog>
  );
}
