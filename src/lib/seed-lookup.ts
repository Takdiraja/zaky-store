/**
 * Seed barcode kelontong — database referensi offline.
 * Berisi barcode asli + nama + kategori + harga + gambar lokal.
 * Dipakai sebagai lookup saat scan: produk lokal -> seed -> Open Food Facts.
 */

export interface SeedProduct {
  barcode: string;
  name: string;
  category: string;
  sellPrice: number;
  image_url?: string;
}

let cache: SeedProduct[] | null = null;
let index: Map<string, SeedProduct> | null = null;

async function loadSeed(): Promise<Map<string, SeedProduct>> {
  if (index) return index;
  const res = await fetch("/seed-barcode-kelontong.json");
  if (!res.ok) throw new Error("seed tidak ditemukan");
  cache = (await res.json()) as SeedProduct[];
  index = new Map(cache.map((p) => [p.barcode, p]));
  return index;
}

/** Cari produk di seed berdasarkan barcode. Return null kalau tidak ada. */
export async function findInSeed(barcode: string): Promise<SeedProduct | null> {
  try {
    const idx = await loadSeed();
    return idx.get(barcode.trim()) ?? null;
  } catch {
    return null;
  }
}

/** Jumlah produk di seed (untuk info/debug). */
export async function seedCount(): Promise<number> {
  try {
    const idx = await loadSeed();
    return idx.size;
  } catch {
    return 0;
  }
}
