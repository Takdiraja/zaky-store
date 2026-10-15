import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
  "expenses",
  "capital",
  "drafts",
  "digital_services",
] as const;

interface BackupData {
  exportedAt: string;
  version: "1.0";
  data: Record<string, unknown[]>;
}

/**
 * Export all data from Firestore collections and trigger a JSON download.
 */
export async function exportAllData(): Promise<void> {
  const data: Record<string, unknown[]> = {};

  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    data[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const backup: BackupData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zaky-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
