"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  quantity: number;
  maxStock?: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

export default function QuantityControl({
  quantity,
  maxStock,
  onDecrement,
  onIncrement,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-container p-1">
      <button
        onClick={onDecrement}
        disabled={quantity <= 1}
        className="flex size-10 items-center justify-center rounded-md border border-border-standard bg-card text-on-surface shadow-sm transition-opacity disabled:opacity-40"
        aria-label="Kurangi jumlah"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-[20px] text-center text-body-md font-bold text-on-surface">
        {quantity}
      </span>
      <button
        onClick={onIncrement}
        disabled={maxStock !== undefined && quantity >= maxStock}
        className="flex size-10 items-center justify-center rounded-md border border-border-standard bg-card text-on-surface shadow-sm transition-opacity disabled:opacity-40"
        aria-label="Tambah jumlah"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
