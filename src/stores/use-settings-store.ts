import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APP_NAME, STORE_ADDRESS } from "@/lib/constants";

export const DEFAULT_EDIT_PIN = "1205";

interface SettingsStore {
  editPin: string;
  setEditPin: (pin: string) => void;
  /** Nama toko yang tampil di nota/struk. Bisa diubah di Pengaturan. */
  storeName: string;
  setStoreName: (name: string) => void;
  /** Alamat toko yang tampil di nota/struk. Bisa diubah di Pengaturan. */
  storeAddress: string;
  setStoreAddress: (addr: string) => void;
  /** String payload QRIS statis merchant (hasil scan QR). Dipakai untuk generate QRIS dinamis per nominal. */
  qrisPayload: string;
  setQrisPayload: (payload: string) => void;
  /** Mode tampilan laporan: sederhana vs lengkap. */
  reportMode: "simple" | "full";
  setReportMode: (mode: "simple" | "full") => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      editPin: DEFAULT_EDIT_PIN,
      setEditPin: (pin) => set({ editPin: pin }),
      storeName: APP_NAME,
      setStoreName: (name) => set({ storeName: name.trim() || APP_NAME }),
      storeAddress: STORE_ADDRESS,
      setStoreAddress: (addr) => set({ storeAddress: addr.trim() }),
      qrisPayload: "",
      setQrisPayload: (payload) => set({ qrisPayload: payload.trim() }),
      reportMode: "simple",
      setReportMode: (mode) => set({ reportMode: mode }),
    }),
    {
      name: "app-settings",
    },
  ),
);
