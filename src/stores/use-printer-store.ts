import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaperWidth } from "@/types";

export type PrintDensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface PrinterStore {
  printerName: string;
  paperWidth: PaperWidth;
  savedDeviceId: string | null;
  savedDeviceName: string | null;
  /** Print darkness level (1 = lightest, 10 = darkest). Default 6. */
  density: PrintDensity;
  /** Store info shown on receipts (optional). */
  storeAddress: string;
  storePhone: string;
  setPrinterName: (name: string) => void;
  setPaperWidth: (width: PaperWidth) => void;
  setSavedDevice: (id: string | null, name: string | null) => void;
  setDensity: (d: PrintDensity) => void;
  setStoreInfo: (address: string, phone: string) => void;
}

export const usePrinterStore = create<PrinterStore>()(
  persist(
    (set) => ({
      printerName: "",
      paperWidth: 58,
      savedDeviceId: null,
      savedDeviceName: null,
      density: 8,
      storeAddress: "",
      storePhone: "",

      setPrinterName: (name) => set({ printerName: name }),
      setPaperWidth: (width) => set({ paperWidth: width }),
      setSavedDevice: (id, name) => set({ savedDeviceId: id, savedDeviceName: name }),
      setDensity: (d) => set({ density: d }),
      setStoreInfo: (address, phone) => set({ storeAddress: address, storePhone: phone }),
    }),
    {
      name: "printer-config",
    },
  ),
);
