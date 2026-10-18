import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";

export interface PickedContact {
  name: string;
  phone: string;
}

/**
 * Pilih kontak dari HP (native saja).
 * Membuka pemilih kontak bawaan Android, mengembalikan nama + nomor pertama.
 * Nomor dibersihkan: hanya digit, prefix 0/62 dihapus (form pakai +62 tetap).
 */
export async function pickPhoneContact(): Promise<PickedContact | null> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Pilih kontak hanya tersedia di aplikasi Android.");
  }
  const perm = await Contacts.requestPermissions();
  if (perm.contacts !== "granted") {
    throw new Error("Izin kontak ditolak. Aktifkan di Pengaturan > Aplikasi > ZAKY STORE.");
  }
  const result = await Contacts.pickContact({ projection: { name: true, phones: true } });
  const contact = result.contact;
  const rawPhone = contact.phones?.[0]?.number ?? "";
  // Ambil digit saja; buang prefix negara agar cocok dengan format form (+62 tetap)
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return {
    name: contact.name?.display ?? "",
    phone: digits,
  };
}

/** True kalau fitur pilih kontak tersedia (APK Android). */
export function canPickContact(): boolean {
  return Capacitor.isNativePlatform();
}
