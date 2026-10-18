"use client";

/**
 * PouchDB layer — database lokal (IndexedDB di WebView) dengan sync
 * dua arah ke CouchDB. Aplikasi tetap jalan 100% offline; saat online,
 * perubahan otomatis tersinkron.
 *
 * PouchDB di-load lazy (hanya di browser) agar build SSR/prerender
 * Next.js tidak mencoba load native binding di server.
 */

type PouchDBConstructor = new (name: string) => PouchDB.Database;
type PouchDBModule = { default: PouchDBConstructor };

let PouchCtor: PouchDBConstructor | null = null;
async function getPouchCtor(): Promise<PouchDBConstructor> {
  if (!PouchCtor) {
    const mod = (await import("pouchdb")) as unknown as PouchDBModule;
    PouchCtor = mod.default;
  }
  return PouchCtor;
}

const COUCH_URL = "https://couchdb.zbo.my.id";
/** Sync ke CouchDB DINONAKTIFKAN — aplikasi jalan offline-only (keputusan user 2026-10-15). */
const SYNC_ENABLED = false;

/** Semua koleksi PouchDB aplikasi. */
export const ALL_COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
  "drafts",
  "expenses",
  "capital",
  "stock_in_receipts",
];
// Satu database per toko. Untuk sekarang satu toko ("zaky"), nanti bisa
// diganti per-toko mis. `zaky-toko-{id}` untuk multi-tenant.
const REMOTE_DB = "zaky-store";

const localDbs = new Map<string, PouchDB.Database>();
const pendingDbs = new Map<string, Promise<PouchDB.Database>>();

/** Versi sync — untuk kode lama yang butuh DB langsung (hanya aman di browser). */
export function getLocalDB(name: string): PouchDB.Database {
  const key = `zaky-${name}`;
  const db = localDbs.get(key);
  if (!db) throw new Error(`PouchDB ${key} belum diinisialisasi — pakai getLocalDBAsync.`);
  return db;
}

/** Versi async — lazy-load PouchDB, aman dipanggil di mana saja. */
export async function getLocalDBAsync(name: string): Promise<PouchDB.Database> {
  const key = `zaky-${name}`;
  const existing = localDbs.get(key);
  if (existing) return existing;
  let pending = pendingDbs.get(key);
  if (!pending) {
    pending = (async () => {
      const Ctor = await getPouchCtor();
      const db = new Ctor(key);
      localDbs.set(key, db);
      pendingDbs.delete(key);
      return db;
    })();
    pendingDbs.set(key, pending);
  }
  return pending;
}

export interface SyncStatus {
  state: "idle" | "syncing" | "offline" | "error";
  lastError?: string;
  pendingPush?: number;
  pendingPull?: number;
}

type StatusListener = (s: SyncStatus) => void;
const listeners = new Set<StatusListener>();
let currentStatus: SyncStatus = { state: "idle" };

function emit(s: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...s };
  listeners.forEach((l) => l(currentStatus));
}

export function onSyncStatus(l: StatusListener): () => void {
  listeners.add(l);
  l(currentStatus);
  return () => {
    listeners.delete(l);
  };
}

/**
 * Mulai sync live dua arah untuk satu koleksi. Aman dipanggil sekali
 * per koleksi — panggilan berikutnya no-op.
 */
const activeSyncs = new Map<string, PouchDB.Replication.Sync<{}>>();

export async function startSync(collection: string): Promise<void> {
  if (!SYNC_ENABLED) return; // offline-only
  if (activeSyncs.has(collection)) return;
  const local = await getLocalDBAsync(collection);
  const remote = `${COUCH_URL}/${REMOTE_DB}-${collection}`;

  emit({ state: "syncing" });
  const sync = local.sync(remote, { live: true, retry: true });

  sync.on("change", () => emit({ state: "syncing" }));
  sync.on("paused", () => emit({ state: "idle" }));
  sync.on("active", () => emit({ state: "syncing" }));
  sync.on("denied", (err: unknown) => emit({ state: "error", lastError: String(err) }));
  sync.on("error", (err: unknown) => emit({ state: "error", lastError: String(err) }));

  // Deteksi offline via browser online/offline events
  if (typeof window !== "undefined") {
    const goOffline = () => emit({ state: "offline" });
    const goOnline = () => emit({ state: "syncing" });
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
  }

  activeSyncs.set(collection, sync);
}

/** Hentikan semua sync (mis. saat logout / ganti toko). */
export function stopAllSync(): void {
  activeSyncs.forEach((s) => s.cancel());
  activeSyncs.clear();
}

/**
 * HAPUS SEMUA DATA lokal (8 koleksi). Tidak bisa dibatalkan!
 * Dipakai dari Pengaturan > Data > Reset Data (dengan konfirmasi + PIN).
 */
export async function resetAllDatabases(collections: string[]): Promise<void> {
  stopAllSync();
  const Pouch = await getPouchCtor();
  for (const name of collections) {
    try {
      // Nama DB aktual memakai prefix "zaky-" (lihat getLocalDBAsync)
      const db = new Pouch(`zaky-${name}`);
      await db.destroy();
    } catch {
      // DB tidak ada / sudah dihapus — lanjut
    }
  }
  // Bersihkan cache instance agar DB dibuat ulang kosong
  localDbs.clear();
  pendingDbs.clear();
}

/**
 * Warmup: preload PouchDB + buka semua database di awal (background).
 * Dipanggil sekali saat app start agar navigasi antar halaman tidak
 * menunggu buka IndexedDB.
 */
export async function warmupDatabases(collections: string[]): Promise<void> {
  // Preload constructor dulu (sekali), lalu buka semua DB paralel.
  await getPouchCtor();
  await Promise.all(collections.map((c) => getLocalDBAsync(c).catch(() => null)));
}

/** Map dokumen Firestore-ish <-> PouchDB (_id). */
export function toPouch<T extends { id: string }>(doc: T): T & { _id: string } {
  const { id, ...rest } = doc;
  return { ...rest, _id: id } as T & { _id: string };
}

export function fromPouch<T>(doc: { _id: string } & Record<string, unknown>): T & { id: string } {
  const { _id, _rev, ...rest } = doc;
  return { ...rest, id: _id } as T & { id: string };
}
