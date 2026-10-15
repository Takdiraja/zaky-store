import { doc, runTransaction, increment } from "firebase/firestore";
import { db } from "./firebase";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential expense number using Firestore atomic counter.
 * Format: EXP-YYYYMMDD-XXX (e.g. EXP-20260801-001)
 */
export async function generateExpenseNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-08-01"
  const datePart = today.replace(/-/g, ""); // "20260801"
  const counterId = `expense_${today}`; // "expense_2026-08-01"
  const counterRef = doc(db, "expense_counters", counterId);

  const newSeq = await runTransaction<number>(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    if (!snap.exists()) {
      transaction.set(counterRef, { counter: 1, date: today });
      return 1;
    }
    const current = snap.data().counter ?? 0;
    transaction.update(counterRef, { counter: increment(1) });
    return current + 1;
  });

  const seq = String(newSeq).padStart(3, "0");
  return `EXP-${datePart}-${seq}`;
}
