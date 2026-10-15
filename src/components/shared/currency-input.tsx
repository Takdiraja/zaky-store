"use client";

import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Numeric currency input. Formats the raw number with Indonesian
 * thousands separators while typing; keeps the numeric value in sync.
 */
export default function CurrencyInput({ value, onChange, placeholder = "0", className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body-md font-semibold text-on-surface-variant">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9.,]*"
        value={value === 0 ? "" : value.toLocaleString("id-ID")}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(digits ? parseInt(digits, 10) : 0);
        }}
        placeholder={placeholder}
        className="h-14 w-full rounded-md border border-border-standard bg-card pl-12 pr-4 text-right text-2xl font-bold tabular-nums text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-secondary focus:ring-4 focus:ring-secondary/15"
      />
    </div>
  );
}
