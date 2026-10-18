import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME } from "@/themes/palettes";
import type { ThemeId } from "@/themes/types";

interface ThemeStore {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      darkMode: false,
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    {
      name: "app-theme",
    },
  ),
);
