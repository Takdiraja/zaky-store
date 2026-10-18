import { nextDailyNumber } from "./pouch-helpers";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential draft number (PouchDB local counter).
 * Format: DRF-YYYYMMDD-XXX
 */
export async function generateDraftNumber(): Promise<string> {
  const today = getTodayISO();
  const datePart = today.replace(/-/g, "");
  return nextDailyNumber("drafts", "draftNumber", `DRF-${datePart}-`);
}
