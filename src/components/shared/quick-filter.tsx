"use client";

import { useReportStore } from "@/stores/use-report-store";
import { Icon } from "@/lib/icon-map";
import { PERIOD_OPTIONS } from "@/lib/constants";
import type { PeriodFilter } from "@/types";

interface Props {
  /** Compact variant for the Dashboard — tighter chips, no custom date row. */
  compact?: boolean;
  className?: string;
}

export default function QuickFilter({ compact = false, className = "" }: Props) {
  const period = useReportStore((s) => s.period);
  const customStart = useReportStore((s) => s.customStart);
  const customEnd = useReportStore((s) => s.customEnd);
  const setPeriod = useReportStore((s) => s.setPeriod);
  const setCustomRange = useReportStore((s) => s.setCustomRange);

  const handleCustomStart = (val: string) => {
    setCustomRange(val, customEnd || val);
  };

  const handleCustomEnd = (val: string) => {
    setCustomRange(customStart || val, val);
  };

  return (
    <div className={className}>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value as PeriodFilter)}
            className={`shrink-0 rounded-full whitespace-nowrap text-label-md font-medium transition-all active:scale-95 ${
              compact ? "px-3.5 py-2" : "px-4 py-2"
            } ${
              period === option.value
                ? "bg-secondary text-white shadow-card"
                : "border border-border-standard bg-card text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {option.value === "custom" && (
              <Icon name="calendar_month" size={16} className="mr-1 inline-block align-middle" />
            )}
            {option.label}
          </button>
        ))}
      </div>

      {period === "custom" && !compact && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-label-md text-on-surface-variant">Dari</label>
            <input
              type="date"
              value={customStart || ""}
              onChange={(e) => handleCustomStart(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-standard px-4 text-body-md outline-none focus:border-secondary"
            />
          </div>
          <span className="mt-6 text-on-surface-variant">—</span>
          <div className="flex-1">
            <label className="mb-1 block text-label-md text-on-surface-variant">Sampai</label>
            <input
              type="date"
              value={customEnd || ""}
              onChange={(e) => handleCustomEnd(e.target.value)}
              className="h-12 w-full rounded-xl border border-border-standard px-4 text-body-md outline-none focus:border-secondary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
