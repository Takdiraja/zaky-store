import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME } from "@/themes/palettes";
import type { ThemeId } from "@/themes/types";

interface ThemeStore {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "app-theme",
    },
  ),
);
