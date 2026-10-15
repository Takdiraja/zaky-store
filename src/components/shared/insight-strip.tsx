"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icon-map";
import type { Insight } from "@/lib/insights";

const toneClasses: Record<Insight["tone"], string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

interface Props {
  insights: Insight[];
  /** Rows to show before the "View All" link. Defaults to all (≤3). */
  max?: number;
  className?: string;
}

/**
 * Compact single-line business insights — the Dashboard's summary strip.
 * Never dominates the page: a small header, up to `max` one-line rows,
 * and a "View All" link to the Reports page.
 */
export default function InsightStrip({ insights, max = 3, className }: Props) {
  const shown = insights.slice(0, max);

  return (
    <section
      className={cn(
        "rounded-lg border border-border-standard bg-card p-4 shadow-card",
        className
      )}
      aria-label="Wawasan bisnis"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="lightbulb" size={18} className="text-secondary" />
          <h4 className="text-label-md font-bold text-on-surface">Wawasan Bisnis</h4>
        </div>
        <Link
          href="/laporan"
          className="flex items-center gap-0.5 text-label-md font-semibold text-secondary hover:underline"
          aria-label="Lihat semua wawasan"
        >
          View All
          <Icon name="chevron_right" size={16} />
        </Link>
      </div>

      {shown.length === 0 ? (
        <p className="py-2 text-body-sm text-on-surface-variant/70">
          Belum ada cukup data untuk menghasilkan wawasan.
        </p>
      ) : (
        <ul className="space-y-1">
          {shown.map((insight, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-container-low"
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                  toneClasses[insight.tone]
                )}
              >
                <Icon name={insight.icon} size={14} />
              </span>
              <p className="min-w-0 flex-1 truncate text-body-sm text-on-surface">
                {insight.title}
                <span className="text-on-surface-variant"> — {insight.text}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
