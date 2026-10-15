"use client";

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
  className?: string;
}

/**
 * Full business insights list — the analytical view on the Reports page.
 * Each row is a tappable insight with a tone-colored icon, title, and
 * one-to-two line description.
 */
export default function InsightList({ insights, className }: Props) {
  return (
    <ul className={cn("space-y-2", className)}>
      {insights.map((insight, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-md border border-border-standard bg-card p-3"
        >
          <span
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
              toneClasses[insight.tone]
            )}
          >
            <Icon name={insight.icon} size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-on-surface">{insight.title}</p>
            <p className="text-body-sm text-on-surface-variant">{insight.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
