import { nextDailyNumber } from "./pouch-helpers";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential expense number (PouchDB local counter).
 * Format: EXP-YYYYMMDD-XXX (e.g. EXP-20260801-001)
 */
export async function generateExpenseNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-08-01"
  const datePart = today.replace(/-/g, ""); // "20260801"
  return nextDailyNumber("expenses", "expenseNumber", `EXP-${datePart}-`);
}
