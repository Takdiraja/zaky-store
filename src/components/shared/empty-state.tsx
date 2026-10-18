"use client";

import { Icon } from "@/lib/icon-map";

interface Props {
  icon: string;
  title?: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state with icon, title/description, and an optional CTA.
 * Backwards-compatible: `message` renders as the description.
 */
export default function EmptyState({
  icon,
  title,
  message,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
        <Icon name={icon} size={32} className="[&_svg]:stroke-[1.75]" />
      </span>
      <h3 className="text-headline-md font-bold text-on-surface">
        {title ?? "Belum ada data"}
      </h3>
      {(description ?? message) && (
        <p className="mt-1 max-w-xs text-body-sm text-on-surface-variant">
          {description ?? message}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex h-12 items-center justify-center rounded-md bg-secondary px-6 font-semibold text-white transition-all active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
