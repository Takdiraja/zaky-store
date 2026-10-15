"use client";

import { useThemeStore } from "@/stores/use-theme-store";
import { THEMES } from "@/themes/palettes";
import ThemeCard from "./theme-card";

/**
 * Grid of theme preview cards. Selecting one applies it instantly and
 * persists via the theme store.
 */
export default function ThemePicker() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map((t) => (
        <ThemeCard
          key={t.id}
          theme={t}
          active={theme === t.id}
          onClick={() => setTheme(t.id)}
        />
      ))}
    </div>
  );
}
