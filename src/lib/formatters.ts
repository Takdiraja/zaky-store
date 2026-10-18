export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formats currency without space after Rp, for compact receipt lines. */
export function formatCurrencyInline(amount: number): string {
  return formatCurrency(amount).replace("Rp ", "Rp");
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return formatCurrency(amount);
}

/**
 * Parses a stored date string in LOCAL time.
 *
 * A bare "YYYY-MM-DD" string (the legacy transaction/expense convention) is
 * interpreted by the JS engine as UTC midnight, which renders as 07:00 WIB
 * in UTC+7 — never the intended value. Appending an explicit local midnight
 * (`T00:00:00`) keeps date-only values on the right day and hour. Full ISO
 * timestamps already carry their zone and pass through unchanged.
 */
export function parseLocalDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T00:00:00`);
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function formatTime(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} • ${formatTime(dateStr)}`;
}

/**
 * Combines a date-only "YYYY-MM-DD" value with the current local clock time,
 * producing a full ISO timestamp. Used when a form collects only a date but
 * the record should remember when the sale actually happened.
 */
export function withCurrentTime(dateOnly: string): string {
  const now = new Date();
  const d = parseLocalDate(dateOnly);
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return d.toISOString();
}

/**
 * Applies a new date-only "YYYY-MM-DD" value to an existing timestamp while
 * keeping its local time-of-day (for edits where the time isn't editable).
 * A date-only reference is treated as 00:00 local, not UTC midnight.
 */
export function withDate(timestamp: string, dateOnly: string): string {
  const ref = parseLocalDate(timestamp);
  if (Number.isNaN(ref.getTime())) return dateOnly;
  const d = parseLocalDate(dateOnly);
  d.setHours(
    ref.getHours(),
    ref.getMinutes(),
    ref.getSeconds(),
    ref.getMilliseconds(),
  );
  return d.toISOString();
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return formatDate(dateStr);
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
