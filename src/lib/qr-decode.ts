"use client";

import { BarcodeDetector } from "barcode-detector";

/**
 * Decode QR/barcode dari file foto menjadi string.
 * Dipakai untuk input QRIS via foto: user foto QR tokonya,
 * string payload otomatis terisi.
 */
export async function decodeQrFromFile(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const results = await detector.detect(bitmap);
    if (results.length === 0) {
      throw new Error("QR tidak terbaca dari foto. Coba foto lebih dekat & fokus.");
    }
    const raw = results[0].rawValue?.trim();
    if (!raw) throw new Error("QR terbaca tapi kosong.");
    return raw;
  } finally {
    bitmap.close();
  }
}
