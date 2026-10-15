"use client";

import { useState } from "react";
import { useSettingsStore } from "@/stores/use-settings-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PinDialog({ open, onOpenChange, onSuccess }: Props) {
  const editPin = useSettingsStore((s) => s.editPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (pin === editPin) {
      setError(false);
      setPin("");
      onOpenChange(false);
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setError(false);
          setPin("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[320px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-headline-md font-bold">
            Masukkan PIN Keamanan
          </DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-variant">
            Diperlukan untuk mengedit transaksi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify();
            }}
            className={`h-14 w-full rounded-md border text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all ${
              error
                ? "border-danger focus:border-danger focus:ring-4 focus:ring-danger/15"
                : "border-border-standard focus:border-secondary focus:ring-4 focus:ring-secondary/15"
            }`}
            placeholder="••••"
            maxLength={4}
          />
          {error && (
            <p className="text-center text-body-sm font-medium text-danger">
              PIN salah. Silakan coba lagi.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
            >
              Batal
            </button>
            <button
              onClick={handleVerify}
              disabled={pin.length < 4}
              className="h-12 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Verifikasi
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
