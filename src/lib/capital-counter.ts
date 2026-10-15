import { doc, runTransaction, increment } from "firebase/firestore";
import { db } from "./firebase";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential capital number using Firestore atomic counter.
 * Format: CAP-YYYYMMDD-XXX (e.g. CAP-20260801-001)
 */
export async function generateCapitalNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-08-01"
  const datePart = today.replace(/-/g, ""); // "20260801"
  const counterId = `capital_${today}`; // "capital_2026-08-01"
  const counterRef = doc(db, "capital_counters", counterId);

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
  return `CAP-${datePart}-${seq}`;
}
