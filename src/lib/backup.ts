"use client";

import { getLocalDBAsync, fromPouch } from "./pouchdb";
import { saveOrShareFile } from "./file-saver";

const COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
  "expenses",
  "capital",
  "drafts",
  "stock_in_receipts",
] as const;

interface BackupData {
  exportedAt: string;
  version: "1.0";
  data: Record<string, unknown[]>;
}

/**
 * Export all data from PouchDB collections and trigger JSON download or native share.
 */
export async function exportAllData(): Promise<void> {
  const data: Record<string, unknown[]> = {};

  for (const name of COLLECTIONS) {
    const db = await getLocalDBAsync(name);
    const res = await db.allDocs({ include_docs: true });
    data[name] = res.rows
      .filter((r) => r.doc && typeof r.doc === "object")
      .map((r) =>
        fromPouch(r.doc as unknown as { _id: string } & Record<string, unknown>),
      );
  }

  const backup: BackupData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data,
  };

  const filename = `zaky-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await saveOrShareFile({
    filename,
    data: JSON.stringify(backup, null, 2),
    mimeType: "application/json",
    title: "Backup Data Toko",
  });
}

export interface ImportSummary {
  collectionsRestored: number;
  totalRecords: number;
  details: Record<string, number>;
}

/**
 * Import and restore data from a JSON backup file into PouchDB collections.
 */
export async function importBackupData(jsonString: string): Promise<ImportSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("File backup tidak valid (format JSON rusak).");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Format file backup tidak sesuai (harus berupa JSON objek/array).");
  }

  let rawData: Record<string, unknown> = {};
  if (Array.isArray(parsed)) {
    rawData["products"] = parsed;
  } else {
    const record = parsed as Record<string, unknown>;
    if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
      rawData = record.data as Record<string, unknown>;
    } else {
      rawData = record;
    }
  }

  let totalRecords = 0;
  const details: Record<string, number> = {};
  let collectionsRestored = 0;

  for (const name of COLLECTIONS) {
    const matchingKey = Object.keys(rawData).find(
      (k) =>
        k.toLowerCase() === name.toLowerCase() ||
        k.toLowerCase() === `zaky-${name}`.toLowerCase(),
    );

    const itemsRaw = matchingKey ? rawData[matchingKey] : undefined;
    if (!itemsRaw) continue;

    let items: unknown[] = [];
    if (Array.isArray(itemsRaw)) {
      items = itemsRaw;
    } else if (typeof itemsRaw === "object" && itemsRaw !== null) {
      items = Object.values(itemsRaw);
    }

    if (items.length === 0) continue;

    const db = await getLocalDBAsync(name);
    const existing = await db.allDocs({ include_docs: false });
    const revMap = new Map<string, string>();
    for (const row of existing.rows) {
      revMap.set(row.id, row.value.rev);
    }

    const docsToPut: Array<{ _id: string; _rev?: string } & Record<string, unknown>> = [];
    let idx = 0;
    for (const item of items) {
      idx++;
      if (!item || typeof item !== "object") continue;
      const doc = item as Record<string, unknown>;
      const rawId = doc.id ?? doc._id ?? doc.productId ?? doc.code;
      const id = rawId ? String(rawId) : `${name}-${Date.now()}-${idx}`;
      const { id: _ignoreId, _id: _ignoreUnderscoreId, _rev: _ignoreRev, ...rest } = doc;
      const rev = revMap.get(id);
      docsToPut.push({
        ...rest,
        _id: id,
        ...(rev ? { _rev: rev } : {}),
      });
    }

    if (docsToPut.length > 0) {
      await db.bulkDocs(docsToPut);
      details[name] = docsToPut.length;
      totalRecords += docsToPut.length;
      collectionsRestored++;
    }
  }

  if (totalRecords === 0) {
    const foundKeys = Object.keys(rawData).filter(
      (k) => k !== "version" && k !== "exportedAt",
    );
    const counts = foundKeys
      .map(
        (k) =>
          `${k}: ${
            Array.isArray(rawData[k])
              ? (rawData[k] as unknown[]).length
              : typeof rawData[k]
          }`,
      )
      .join(", ");
    throw new Error(
      `File backup ini tidak berisi data yang dapat dipulihkan (${counts || "file kosong"}).`,
    );
  }

  return { collectionsRestored, totalRecords, details };
}

