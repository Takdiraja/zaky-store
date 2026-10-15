"use client";

import { useState, useRef, useEffect } from "react";
import { Banknote } from "lucide-react";
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
  totalAmount: number;
  onConfirm: (amountPaid: number) => void;
  onCancel: () => void;
}

const QUICK_NOMINALS = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];

export default function CashPaymentDialog({ open, totalAmount, onConfirm, onCancel }: Props) {
  const [amount, setAmount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const change = Math.max(0, amount - totalAmount);
  const isValid = amount >= totalAmount;

  // Reset + focus shortly after the dialog mounts (parent remounts via key on open).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader className="items-center text-center">
          <span className="mx-auto mb-1 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Banknote className="size-7" />
          </span>
          <DialogTitle className="text-headline-md font-bold">Pembayaran Tunai</DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-variant">
            Total: {formatCurrency(totalAmount)}
          </DialogDescription>
        </DialogHeader>

        {/* Amount Input */}
        <div>
          <label className="mb-1 block text-label-md text-on-surface-variant">Jumlah Tunai</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body-md font-semibold text-on-surface-variant">
              Rp
            </span>
            <input
              ref={inputRef}
              value={amount === 0 ? "" : amount.toLocaleString("id-ID")}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^\d]/g, "");
                setAmount(digits ? parseInt(digits, 10) : 0);
              }}
              className="h-14 w-full rounded-md border border-border-standard bg-card pl-12 pr-4 text-right text-2xl font-bold tabular-nums text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              placeholder="0"
              inputMode="numeric"
              type="text"
            />
          </div>
        </div>

        {/* Change Display */}
        {amount > 0 && (
          <div className={`rounded-md p-4 text-center ${isValid ? "bg-success/10" : "bg-danger/10"}`}>
            <p className="text-label-md text-on-surface-variant">Kembali</p>
            <p className={`text-headline-md font-extrabold ${isValid ? "text-success" : "text-danger"}`}>
              {formatCurrency(change)}
            </p>
            {!isValid && (
              <p className="mt-1 text-caption text-danger">Jumlah tunai kurang</p>
            )}
          </div>
        )}

        {/* Quick Nominals */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_NOMINALS.map((nominal) => (
            <button
              key={nominal}
              onClick={() => setAmount(nominal)}
              className="h-11 rounded-md border border-border-standard bg-card text-caption font-semibold text-on-surface transition-all hover:bg-surface-container active:scale-[0.98]"
            >
              {formatCurrency(nominal)}
            </button>
          ))}
          <button
            onClick={() => setAmount(totalAmount)}
            className="col-span-3 h-11 rounded-md border border-dashed border-secondary bg-secondary/5 text-label-md font-semibold text-secondary transition-all active:scale-[0.98]"
          >
            Uang Pas
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => onConfirm(amount)}
            disabled={!isValid}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-md font-semibold transition-all active:scale-[0.98] ${
              isValid
                ? "bg-secondary text-white shadow-fab"
                : "cursor-not-allowed bg-surface-container text-on-surface-variant"
            }`}
          >
            <Banknote className="size-5" />
            Bayar {amount ? formatCurrency(amount) : ""}
          </button>
          <button
            onClick={onCancel}
            className="h-12 w-full text-body-md font-semibold text-on-surface-variant transition-opacity active:opacity-80"
          >
            Batal
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
