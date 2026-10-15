"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icon-map";
import InsightList from "@/components/shared/insight-list";
import type { Insight } from "@/lib/insights";

interface Props {
  insights: Insight[];
  score?: { score: number; label: string };
  className?: string;
}

/**
 * Full business insights section (header + optional health score) that
 * renders the shared InsightList body. Used on the Reports page; the
 * Dashboard uses the compact InsightStrip instead.
 */
export default function InsightCard({ insights, score, className }: Props) {
  return (
    <section className={cn("rounded-lg border border-border-standard bg-card p-5 shadow-card", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
            <Icon name="lightbulb" size={20} />
          </span>
          <h4 className="text-label-xl font-bold text-on-surface">Wawasan Bisnis</h4>
        </div>
        {score && (
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <span
              className={cn(
                "text-label-md font-bold",
                score.score >= 75 ? "text-success" : score.score >= 50 ? "text-warning" : "text-danger",
              )}
            >
              {score.score}
            </span>
            <span className="text-caption text-on-surface-variant">{score.label}</span>
          </div>
        )}
      </div>

      {insights.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-on-surface-variant/70">
          Belum ada cukup data untuk menghasilkan wawasan.
        </p>
      ) : (
        <InsightList insights={insights} />
      )}
    </section>
  );
}
