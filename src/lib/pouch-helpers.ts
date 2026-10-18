"use client";

import { getLocalDBAsync, startSync, fromPouch } from "@/lib/pouchdb";

/** ISO timestamp — pengganti Firestore serverTimestamp(). */
export function nowISO(): string {
  return new Date().toISOString();
}

type SortFn<T> = (a: T, b: T) => number;

/**
 * Langganan live ke satu koleksi PouchDB.
 * - Load awal via allDocs, lalu live update via changes feed.
 * - Perubahan di-apply incremental (tambah/update/hapus 1 dokumen),
 *   tanpa baca ulang seluruh koleksi — ringan untuk HP.
 * - Mengembalikan fungsi unsubscribe.
 */
export function subscribeCollection<T extends { id: string }>(
  collection: string,
  onDocs: (docs: (T & { id: string })[]) => void,
  sort?: SortFn<T & { id: string }>,
): () => void {
  let cancelled = false;
  let changes: PouchDB.Core.Changes<{}> | null = null;
  let cache: (T & { id: string })[] = [];

  const push = () => {
    const docs = [...cache];
    if (sort) docs.sort(sort);
    onDocs(docs);
  };

  (async () => {
    await startSync(collection);
    if (cancelled) return;
    const db = await getLocalDBAsync(collection);

    try {
      const res = await db.allDocs({ include_docs: true });
      if (cancelled) return;
      cache = res.rows
        .map((r) =>
          fromPouch<T>(r.doc as unknown as { _id: string } & Record<string, unknown>),
        )
        .filter((d) => d && typeof d.id === "string") as (T & { id: string })[];
      push();
    } catch {
      // Biarkan kosong; changes feed akan mengisi saat ada update.
    }
    if (cancelled) return;

    changes = db
      .changes({ live: true, since: "now", include_docs: true })
      .on("change", (change) => {
        if (cancelled) return;
        const raw = change.doc as unknown as
          | ({ _id: string; _deleted?: boolean } & Record<string, unknown>)
          | undefined;
        if (!raw) return;
        const id = raw._id;
        if (raw._deleted) {
          cache = cache.filter((d) => d.id !== id);
        } else {
          const doc = fromPouch<T>(raw as { _id: string } & Record<string, unknown>) as T & { id: string };
          const idx = cache.findIndex((d) => d.id === id);
          if (idx >= 0) cache[idx] = doc;
          else cache.push(doc);
        }
        push();
      });
  })();

  return () => {
    cancelled = true;
    changes?.cancel();
  };
}

/** Tambah dokumen baru dengan id acak (UUID). Mengembalikan id. */
export async function pouchAdd<T extends Record<string, unknown>>(
  collection: string,
  data: T,
): Promise<string> {
  const db = await getLocalDBAsync(collection);
  const id = crypto.randomUUID();
  const { id: _drop, ...rest } = data as T & { id?: string };
  await db.put({ ...rest, _id: id } as PouchDB.Core.PutDocument<{}>);
  return id;
}

/** Update dokumen: baca rev terbaru lalu put. */
export async function pouchUpdate(
  collection: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const db = await getLocalDBAsync(collection);
  const existing = (await db.get(id)) as unknown as Record<string, unknown>;
  const { id: _dropId, _id: _dropUnderscore, _rev: _dropRev, ...clean } = patch;
  await db.put({
    ...existing,
    ...clean,
    _id: id,
    _rev: (existing as { _rev: string })._rev,
  } as PouchDB.Core.PutDocument<{}>);
}

/**
 * Mutasi atomik-ish: baca → hitung patch dari dokumen terbaru → put.
 * Retry otomatis saat konflik 409 (mis. dua tab nulis bersamaan).
 */
export async function pouchMutate(
  collection: string,
  id: string,
  fn: (doc: Record<string, unknown>) => Record<string, unknown>,
  retries = 3,
): Promise<void> {
  const db = await getLocalDBAsync(collection);
  for (let attempt = 0; attempt <= retries; attempt++) {
    const existing = (await db.get(id)) as unknown as Record<string, unknown>;
    const patch = fn(existing);
    try {
      await db.put({
        ...existing,
        ...patch,
        _id: id,
        _rev: (existing as { _rev: string })._rev,
      } as PouchDB.Core.PutDocument<{}>);
      return;
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 409 && attempt < retries) continue;
      throw e;
    }
  }
}

/** Hapus dokumen. */
export async function pouchRemove(collection: string, id: string): Promise<void> {
  const db = await getLocalDBAsync(collection);
  const existing = (await db.get(id)) as unknown as PouchDB.Core.RemoveDocument;
  await db.remove(existing);
}

/**
 * Nomor dokumen harian berurutan: PREFIX-YYYYMMDD-XXX.
 * Menghitung max+1 dari dokumen lokal yang nomornya diawali prefix hari ini.
 * (Beta: satu perangkat/kasir; cukup untuk sekarang.)
 */
export async function nextDailyNumber(
  collection: string,
  field: string,
  prefix: string,
): Promise<string> {
  const db = await getLocalDBAsync(collection);
  const res = await db.allDocs({ include_docs: true });
  let max = 0;
  for (const row of res.rows) {
    const doc = row.doc as unknown as Record<string, unknown> | undefined;
    const num = String(doc?.[field] ?? "");
    if (num.startsWith(prefix)) {
      const seq = parseInt(num.slice(prefix.length), 10);
      if (!Number.isNaN(seq) && seq > max) max = seq;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

/** Prefix nomor hari ini: mis. nextDailyNumber("transactions","receiptNumber", dailyPrefix("TRX")) */
export function dailyPrefix(tag: string, date = new Date()): string {
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${tag}-${ymd}-`;
}
