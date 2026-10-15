"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Error state with an explanation and a retry action.
 */
export default function ErrorState({
  title = "Terjadi kesalahan",
  description = "Data gagal dimuat. Silakan coba lagi.",
  onRetry,
  retryLabel = "Coba Lagi",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-danger/15 bg-danger/5 px-6 py-10 text-center">
      <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertCircle className="size-8" />
      </span>
      <h3 className="text-headline-md font-bold text-on-surface">{title}</h3>
      <p className="mt-1 max-w-sm text-body-sm text-on-surface-variant">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-md bg-secondary px-6 font-semibold text-white transition-all active:scale-[0.98]"
        >
          <RotateCcw className="size-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
