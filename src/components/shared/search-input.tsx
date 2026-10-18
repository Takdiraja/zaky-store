"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Unified search input used across every page that needs one.
 */
const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { value, onChange, placeholder = "Cari…", autoFocus, className },
  ref,
) {
  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-12 w-full rounded-md border border-border-standard bg-card pl-12 pr-12 text-base text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-4 focus:ring-secondary/15"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Bersihkan pencarian"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
});

export default SearchInput;
