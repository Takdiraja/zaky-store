import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Consistent KPI grid: 2 columns on phones (so all four primary KPIs sit
 * above the fold), 4 columns on desktop. Use for dashboard + reports
 * summary rows.
 */
export default function KpiGrid({ children, className }: Props) {
  return (
    <section
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </section>
  );
}
