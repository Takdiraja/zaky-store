"use client";

import { useState } from "react";
import { ScanLine, Search } from "lucide-react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { parseReceiptQrPayload } from "@/lib/receipt-qr";
import { Icon } from "@/lib/icon-map";
import ScannerDialog from "@/components/shared/scanner-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/shared/toast-provider";

interface Props {
  onFound: (transactionId: string) => void;
  onSearchManually: () => void;
}

/**
 * "Scan Receipt" — opens the camera, reads the QR on a printed receipt,
 * looks up the transaction by receipt number, and expands it. If the
 * transaction isn't found (another device / deleted), shows an error sheet
 * with Cari Manual / Scan Lagi / Batal.
 */
export default function ScanReceiptButton({ onFound, onSearchManually }: Props) {
  const transactions = useTransactionStore((s) => s.transactions);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleScan = (raw: string) => {
    const parsed = parseReceiptQrPayload(raw);
    if (!parsed) {
      toast("QR tidak dikenali. Pindai QR pada nota yang dicetak.", "error");
      return;
    }

    const match = transactions.find(
      (t) => t.receiptNumber === parsed.transactionId,
    );
    if (match) {
      setScannerOpen(false);
      onFound(match.id);
      toast(`Transaksi ${match.receiptNumber} ditemukan.`, "success");
      return;
    }

    // Not found — stop scanning and show the error sheet.
    setScannerOpen(false);
    setNotFound(true);
  };

  const openScanner = () => {
    setScannerOpen(true);
  };

  const handleScanAgain = () => {
    setNotFound(false);
    // Small delay so the dialog fully closes before the camera reopens.
    setTimeout(() => setScannerOpen(true), 250);
  };

  const handleSearchManually = () => {
    setNotFound(false);
    onSearchManually();
  };

  return (
    <>
      <button
        onClick={openScanner}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-border-standard bg-card px-3 text-label-md font-semibold text-secondary transition-all active:scale-[0.98]"
      >
        <ScanLine className="size-4" />
        Scan Receipt
      </button>

      <ScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        mode="receipt"
      />

      {/* Not-found sheet */}
      <Dialog open={notFound} onOpenChange={(o) => !o && setNotFound(false)}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader className="items-center text-center">
            <span className="mx-auto mb-1 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
              <Icon name="search_off" size={26} />
            </span>
            <DialogTitle className="text-headline-md font-bold">
              Transaksi tidak ditemukan
            </DialogTitle>
            <DialogDescription className="text-body-sm text-on-surface-variant">
              Nota mungkin berasal dari perangkat lain atau telah dihapus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <button
              onClick={handleSearchManually}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-secondary bg-card font-semibold text-secondary transition-all active:scale-[0.98]"
            >
              <Search className="size-5" />
              Cari Manual
            </button>
            <button
              onClick={handleScanAgain}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98]"
            >
              <ScanLine className="size-5" />
              Scan Lagi
            </button>
            <button
              onClick={() => setNotFound(false)}
              className="h-12 w-full text-body-md font-semibold text-on-surface-variant transition-opacity active:opacity-80"
            >
              Batal
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
