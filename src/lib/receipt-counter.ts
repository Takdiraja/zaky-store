import { nextDailyNumber } from "./pouch-helpers";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential receipt number (PouchDB local counter).
 * Format: TRX-YYYYMMDD-XXX (e.g. TRX-20260710-001)
 */
export async function generateReceiptNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-07-10"
  const datePart = today.replace(/-/g, ""); // "20260710"
  return nextDailyNumber("transactions", "receiptNumber", `TRX-${datePart}-`);
}
