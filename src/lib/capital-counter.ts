import { nextDailyNumber } from "./pouch-helpers";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential capital number (PouchDB local counter).
 * Format: CAP-YYYYMMDD-XXX (e.g. CAP-20260801-001)
 */
export async function generateCapitalNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-08-01"
  const datePart = today.replace(/-/g, ""); // "20260801"
  return nextDailyNumber("capital_transactions", "capitalNumber", `CAP-${datePart}-`);
}
