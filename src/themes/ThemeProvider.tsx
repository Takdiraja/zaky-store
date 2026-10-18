"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "@/stores/use-theme-store";
import { THEME_MAP } from "./palettes";

/**
 * Applies the active theme to <html data-theme="…"> so every token-driven
 * utility updates instantly. Also applies dark mode via the `dark` class
 * (for `dark:` utilities) and `data-mode="dark"` (for token overrides),
 * adds a temporary transition class for a smooth color cross-fade, and
 * syncs the browser theme-color meta.
 */
export default function ThemeProvider() {
  const theme = useThemeStore((s) => s.theme);
  const darkMode = useThemeStore((s) => s.darkMode);
  const firstRun = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", darkMode ? "dark" : "light");
    root.classList.toggle("dark", darkMode);

    if (firstRun.current) {
      firstRun.current = false;
    } else if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("theme-transition");
      const t = window.setTimeout(() => root.classList.remove("theme-transition"), 250);
      return () => window.clearTimeout(t);
    }

    // Sync browser chrome color with the theme primary.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_MAP[theme].colors.primary);
  }, [theme, darkMode]);

  return null;
}
