import { doc, runTransaction, increment } from "firebase/firestore";
import { db } from "./firebase";
import { getTodayISO } from "./formatters";

export async function generateDraftNumber(): Promise<string> {
  const today = getTodayISO();
  const datePart = today.replace(/-/g, "");
  const counterId = `draft_${today}`;
  const counterRef = doc(db, "draft_counters", counterId);

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
  return `DRF-${datePart}-${seq}`;
}
