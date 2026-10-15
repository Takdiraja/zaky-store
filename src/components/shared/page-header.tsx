import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Standard page header. Replaces the duplicated `<h1>` rows every page
 * rendered on top of the TopAppBar title.
 */
export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-headline-md font-bold text-on-surface">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-body-sm text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
