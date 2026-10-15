import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  /** Right-aligned legend / badge (e.g. a colored dot + "Pendapatan"). */
  legend?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Standard card wrapper for charts and analytical blocks. Title + optional
 * legend/actions on one row, content below — used by every chart and
 * metric section so spacing stays consistent across the app.
 */
export default function ChartCard({ title, subtitle, legend, actions, className, children }: Props) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border-standard bg-card p-5 shadow-card",
        className
      )}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-label-xl font-bold text-on-surface">{title}</h4>
          {subtitle && (
            <p className="mt-0.5 text-body-sm text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {(legend || actions) && (
          <div className="flex items-center gap-3">
            {legend}
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
