import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "success" | "warning" | "danger" | "info";

interface Props {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Standard status pill. Use semantic variants:
 * success = paid/lunas/available, warning = debt/unpaid/low stock,
 * danger = overdue/out of stock, info = neutral-informational.
 */
export default function StatusBadge({ label, variant = "info", className }: Props) {
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
