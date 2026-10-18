"use client";

/**
 * Katalog barcode global (shared antar HP).
 *
 * - Koleksi PouchDB lokal "zaky-catalog", sync live dua arah (silent,
 *   tanpa indikator UI) ke https://couchdb.zbo.my.id/zaky-catalog.
 * - Isi: barcode -> nama, merek, kategori, gambar. Harga & stok TIDAK
 *   ikut — tetap lokal per HP.
 * - Saat user menambah produk manual (barcode tidak ada di seed),
 *   entri otomatis ditulis ke katalog sehingga HP lain yang scan
 *   barcode yang sama langsung kenal namanya.
 */

import { getLocalDBAsync } from "@/lib/pouchdb";

const REMOTE_CATALOG = "https://couchdb.zbo.my.id/zaky-catalog";

export interface CatalogEntry {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  updatedAt: string;
}

let syncStarted = false;

async function ensureSync(): Promise<void> {
  if (syncStarted || typeof window === "undefined") return;
  syncStarted = true;
  try {
    const local = await getLocalDBAsync("catalog");
    // Silent: tidak emit status ke UI, retry otomatis saat offline.
    local.sync(REMOTE_CATALOG, { live: true, retry: true }).on("error", () => {
      /* diam — coba lagi otomatis via retry */
    });
  } catch {
    syncStarted = false; // coba lagi di panggilan berikutnya
  }
}

/** Cari entri katalog berdasarkan barcode (lokal dulu, sudah termasuk hasil sync). */
export async function findInCatalog(barcode: string): Promise<CatalogEntry | null> {
  try {
    await ensureSync();
    const db = await getLocalDBAsync("catalog");
    const doc = (await db.get(barcode.trim()).catch(() => null)) as
      | (CatalogEntry & { _id: string; _rev: string })
      | null;
    if (!doc) return null;
    return {
      barcode: doc.barcode,
      name: doc.name,
      brand: doc.brand,
      category: doc.category,
      image_url: doc.image_url,
      updatedAt: doc.updatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Simpan/update entri katalog. Dipanggil saat produk ditambahkan manual.
 * Idempotent berdasarkan barcode.
 */
export async function upsertCatalogEntry(entry: Omit<CatalogEntry, "updatedAt">): Promise<void> {
  try {
    await ensureSync();
    const db = await getLocalDBAsync("catalog");
    const id = entry.barcode.trim();
    if (!id) return;
    const existing = (await db.get(id).catch(() => null)) as
      | { _id: string; _rev: string }
      | null;
    const doc = {
      _id: id,
      ...(existing ? { _rev: existing._rev } : {}),
      barcode: id,
      name: entry.name,
      brand: entry.brand ?? "",
      category: entry.category ?? "",
      image_url: entry.image_url ?? "",
      updatedAt: new Date().toISOString(),
    };
    await db.put(doc);
  } catch {
    /* katalog gagal ditulis — produk lokal tetap kesimpen, sync nyusul */
  }
}
