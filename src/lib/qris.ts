/**
 * QRIS dinamis (EMVCo) — generate QR payload dengan nominal ter-encode.
 *
 * Cara pakai: ambil string QRIS statis merchant (hasil scan QR), lalu
 * makeDynamicQris(payload, nominal) untuk dapat payload dinamis yang
 * bisa di-render jadi QR code. Pembeli scan → nominal sudah terisi.
 */

/** Parse TLV EMVCo jadi Map<tag, value>. */
export function parseTLV(payload: string): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = parseInt(payload.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len) || i + 4 + len > payload.length) break;
    map.set(tag, payload.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return map;
}

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) → 4 hex uppercase. */
export function crc16ccitt(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(tag: string, value: string): string {
  return tag + String(value.length).padStart(2, "0") + value;
}

/**
 * Ubah QRIS statis jadi dinamis dengan nominal (Rupiah, dibulatkan).
 * - Field 01: "11" → "12" (dynamic)
 * - Field 54: diisi nominal
 * - Field 63: CRC dihitung ulang
 * Urutan field dijaga menaik sesuai standar EMVCo.
 */
export function makeDynamicQris(staticPayload: string, amount: number): string {
  const fields = parseTLV(staticPayload);
  const rounded = Math.max(1, Math.round(amount));
  fields.set("01", "12");
  fields.set("54", String(rounded));
  fields.delete("63");

  const order = ["00", "01", ...Array.from({ length: 26 }, (_, i) => String(26 + i)), "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "64"];
  const seen = new Set<string>();
  let out = "";
  for (const tag of order) {
    const v = fields.get(tag);
    if (v !== undefined) {
      out += tlv(tag, v);
      seen.add(tag);
    }
  }
  // Field lain yang tidak umum (jaga-jaga) — urutkan sisanya
  for (const [tag, v] of [...fields.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!seen.has(tag)) out += tlv(tag, v);
  }

  out += "6304";
  return out + crc16ccitt(out);
}

/** Validasi CRC payload QRIS — kembalikan alasan bila tidak valid. */
export function qrisInvalidReason(payload: string): string | null {
  // Hanya buang line-break dari copy-paste; spasi di dalam (mis. nama merchant) dipertahankan.
  const v = payload.replace(/[\r\n]+/g, "").trim();
  if (v.length < 8) return "String terlalu pendek — hasil scan kepotong.";
  const body = v.slice(0, -4);
  if (!body.endsWith("6304"))
    return "String tidak utuh (tidak berakhiran field CRC). Coba foto ulang lebih dekat & fokus.";
  if (crc16ccitt(body) !== v.slice(-4).toUpperCase())
    return "CRC tidak cocok — hasil scan korup. Coba foto ulang dengan pencahayaan lebih baik.";
  return null;
}

/** Validasi CRC payload QRIS. */
export function isValidQris(payload: string): boolean {
  return qrisInvalidReason(payload) === null;
}

/** Ambil nama merchant dari payload (field 59). */
export function qrisMerchantName(payload: string): string {
  return parseTLV(payload).get("59") ?? "";
}
