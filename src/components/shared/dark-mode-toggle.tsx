"use client";

import { useThemeStore } from "@/stores/use-theme-store";

/**
 * Toggle Mode Gelap — terhubung ke theme store (tersimpan otomatis).
 * Mengaktifkan class `dark` + `data-mode="dark"` di <html> via ThemeProvider.
 */
export default function DarkModeToggle() {
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label="Mode Gelap"
      onClick={toggleDarkMode}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
        darkMode ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${
          darkMode ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}
