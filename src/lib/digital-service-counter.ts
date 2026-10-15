import { doc, runTransaction, increment } from "firebase/firestore";
import { db } from "./firebase";
import { getTodayISO } from "./formatters";

/**
 * Generates a daily sequential digital-service transaction number using
 * Firestore atomic counter. Format: DSV-YYYYMMDD-XXX (e.g. DSV-20260814-001)
 */
export async function generateDigitalServiceNumber(): Promise<string> {
  const today = getTodayISO(); // "2026-08-14"
  const datePart = today.replace(/-/g, ""); // "20260814"
  const counterId = `digital_service_${today}`; // "digital_service_2026-08-14"
  const counterRef = doc(db, "digital_service_counters", counterId);

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
  return `DSV-${datePart}-${seq}`;
}

/** Prefix used to recognize digital-service numbers in the receipt QR. */
export const DIGITAL_SERVICE_NUMBER_PREFIX = "DSV-";
