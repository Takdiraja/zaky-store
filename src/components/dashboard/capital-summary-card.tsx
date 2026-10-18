"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  /** Current capital. */
  currentCapital: number;
}

/**
 * Dashboard capital card — shows the current total capital.
 */
export default function CapitalSummaryCard({ currentCapital }: Props) {
  return (
    <section className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary/10 text-secondary">
            <Icon name="account_balance_wallet" size={20} />
          </span>
          <h4 className="text-label-xl font-bold text-on-surface">Modal Aktif</h4>
        </div>
        <Link
          href="/capital"
          className="text-label-md font-semibold text-secondary hover:underline"
        >
          Kelola Modal
        </Link>
      </div>

      <div>
        <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">
          Total Modal Aktif
        </p>
        <p className="mt-0.5 text-numeric-display font-bold tracking-tight text-on-surface">
          {formatCurrency(currentCapital)}
        </p>
      </div>
    </section>
  );
}
