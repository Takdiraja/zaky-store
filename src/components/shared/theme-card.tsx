"use client";

import { Check } from "lucide-react";
import type { ThemeDefinition } from "@/themes/types";
import { cn } from "@/lib/utils";

interface Props {
  theme: ThemeDefinition;
  active: boolean;
  onClick: () => void;
}

/**
 * A preview card for a theme: shows the primary/secondary/surface swatches,
 * a mini button, a mini card, and a mini nav strip so users understand the
 * look before selecting.
 */
export default function ThemeCard({ theme, active, onClick }: Props) {
  const { colors } = theme;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-card transition-all hover:shadow-card-hover active:scale-[0.98]",
        active ? "border-secondary ring-2 ring-secondary/40" : "border-border-standard",
      )}
    >
      {/* Mini preview mock */}
      <div
        className="overflow-hidden rounded-md border border-border-standard"
        style={{ background: "var(--wr-surface-container-low)" }}
      >
        {/* Mini nav strip */}
        <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: "var(--wr-surface)" }}>
          <span className="size-2 rounded-full" style={{ background: colors.primary }} />
          <span className="h-1.5 w-12 rounded-full" style={{ background: "var(--wr-surface-container-high)" }} />
        </div>
        {/* Mini body */}
        <div className="space-y-1.5 p-2">
          <div
            className="flex h-6 items-center justify-center rounded-[5px] text-[9px] font-semibold"
            style={{ background: colors.primary, color: colors.onPrimary }}
          >
            Tombol
          </div>
          <div
            className="space-y-1 rounded-[5px] border p-1.5"
            style={{ background: "var(--wr-card)", borderColor: "var(--wr-border-standard)" }}
          >
            <div className="h-1.5 w-16 rounded-full" style={{ background: "var(--wr-on-surface)" }} />
            <div className="h-1.5 w-10 rounded-full" style={{ background: "var(--wr-on-surface-variant)" }} />
          </div>
          {/* Color swatches */}
          <div className="flex items-center gap-1 pt-0.5">
            <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: colors.primary }} title="Primary" />
            <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: colors.secondary }} title="Secondary" />
            <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: colors.accent }} title="Accent" />
            <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: "var(--wr-card)" }} title="Card" />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-body-sm font-bold text-on-surface">{theme.label}</p>
          <p className="truncate text-caption text-on-surface-variant">{theme.labelEn}</p>
        </div>
        {active && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
            <Check className="size-3.5" />
          </span>
        )}
      </div>
    </button>
  );
}
