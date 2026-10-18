import { DEFAULT_THEME } from "./palettes";
import type { ThemeId } from "./types";

const VALID: ThemeId[] = ["ocean", "emerald", "sunset", "royal", "rose", "ruby"];

const SCRIPT = `(function () {
  try {
    var raw = localStorage.getItem("app-theme");
    var theme = ${JSON.stringify(DEFAULT_THEME)};
    var darkMode = false;
    if (raw) {
      var parsed = JSON.parse(raw);
      var state = parsed && parsed.state;
      var t = state && state.theme;
      if (t && ${JSON.stringify(VALID)}.indexOf(t) !== -1) theme = t;
      darkMode = !!(state && state.darkMode);
    }
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", darkMode ? "dark" : "light");
    if (darkMode) root.classList.add("dark");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", ${JSON.stringify(DEFAULT_THEME)});
    document.documentElement.setAttribute("data-mode", "light");
  }
})();`;

/**
 * Inline script rendered in <head> to apply the persisted theme BEFORE
 * first paint, preventing a flash of the default theme (FOUC).
 */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
