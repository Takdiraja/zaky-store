"use client";

import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
}

/**
 * Standardized bottom-sheet header: drag handle + title + close button.
 */
export default function BottomSheetHeader({ title, onClose }: Props) {
  return (
    <div className="relative shrink-0 border-b border-border-standard px-5 pb-4 pt-3">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-outline-variant" />
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md font-bold text-on-surface">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="flex size-11 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
