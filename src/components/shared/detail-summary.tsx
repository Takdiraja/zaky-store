import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  value: ReactNode;
}

interface Props {
  items: Item[];
  className?: string;
}

/**
 * Horizontal grid of summary values used in tablet detail panes.
 */
export default function DetailSummary({ items, className }: Props) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border-standard bg-card p-4 shadow-card"
        >
          <div className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
            {item.label}
          </div>
          <div className="mt-1.5 text-label-xl font-bold text-on-surface">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
