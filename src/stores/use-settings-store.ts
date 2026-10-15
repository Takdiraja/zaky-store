import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_EDIT_PIN = "1205";

interface SettingsStore {
  editPin: string;
  setEditPin: (pin: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      editPin: DEFAULT_EDIT_PIN,
      setEditPin: (pin) => set({ editPin: pin }),
    }),
    {
      name: "app-settings",
    },
  ),
);
