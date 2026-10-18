import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Standard list row used across pelanggan/kasbon/capital/pengeluaran:
 * leading tile + title/subtitle + trailing value/chevron.
 */
export default function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  className,
}: Props) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-border-standard bg-card p-4 text-left shadow-card transition-shadow",
        onClick && "hover:shadow-card-hover active:scale-[0.99]",
        className
      )}
    >
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-md font-semibold text-on-surface">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-body-sm text-on-surface-variant">
            {subtitle}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      {onClick && <ChevronRight className="size-5 shrink-0 text-outline" />}
    </Comp>
  );
}
