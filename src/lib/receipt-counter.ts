import { doc, runTransaction, getDoc, setDoc, increment } from "firebase/firestore";
import { db } from "./firebase";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential receipt number using Firestore atomic counter.
 * Format: TRX-YYYYMMDD-XXX (e.g. TRX-20260710-001)
 */
export async function generateReceiptNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-07-10"
  const datePart = today.replace(/-/g, ""); // "20260710"
  const counterId = `receipt_${today}`; // "receipt_2026-07-10"
  const counterRef = doc(db, "receipt_counters", counterId);

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
  return `TRX-${datePart}-${seq}`;
}
