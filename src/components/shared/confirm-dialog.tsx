"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  confirmDisabled?: boolean;
  /**
   * May return a promise; the dialog stays open with a busy label
   * until it settles, then closes.
   */
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  confirmDisabled = false,
  onConfirm,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy || confirmDisabled) return;
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-headline-md font-bold">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-body-md text-on-surface-variant">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="h-12 flex-1 rounded-md border border-border-standard font-semibold text-on-surface-variant transition-colors active:bg-surface-container disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy || confirmDisabled}
            className={cn(
              "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
              variant === "danger" ? "bg-danger text-white" : "bg-secondary"
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
