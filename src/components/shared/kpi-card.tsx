import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icon-map";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, { icon: string; value: string }> = {
  default: { icon: "bg-surface-container text-on-surface-variant", value: "text-on-surface" },
  success: { icon: "bg-success/10 text-success", value: "text-success" },
  warning: { icon: "bg-warning/10 text-warning", value: "text-warning" },
  danger: { icon: "bg-danger/10 text-danger", value: "text-danger" },
  info: { icon: "bg-info/10 text-info", value: "text-info" },
};

interface Props {
  label: string;
  value: string;
  icon: string;
  tone?: Tone;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * KPI / stat card used across dashboard, laporan, and list summary rows.
 */
export default function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  footer,
  onClick,
  className,
}: Props) {
  const t = toneClasses[tone];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border-standard bg-card p-5 text-left shadow-card transition-shadow",
        onClick && "hover:shadow-card-hover active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
          {label}
        </span>
        <span className={cn("flex size-10 items-center justify-center rounded-md", t.icon)}>
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div className={cn("text-3xl font-bold tracking-tight tabular-nums", t.value)}>{value}</div>
      {footer && <div className="text-caption text-on-surface-variant">{footer}</div>}
    </Comp>
  );
}
