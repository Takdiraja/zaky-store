import { DEFAULT_THEME } from "./palettes";
import type { ThemeId } from "./types";

const VALID: ThemeId[] = ["ocean", "emerald", "sunset", "royal", "rose", "ruby"];

const SCRIPT = `(function () {
  try {
    var raw = localStorage.getItem("app-theme");
    var theme = ${JSON.stringify(DEFAULT_THEME)};
    if (raw) {
      var parsed = JSON.parse(raw);
      var t = parsed && parsed.state && parsed.state.theme;
      if (t && ${JSON.stringify(VALID)}.indexOf(t) !== -1) theme = t;
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", ${JSON.stringify(DEFAULT_THEME)});
  }
})();`;

/**
 * Inline script rendered in <head> to apply the persisted theme BEFORE
 * first paint, preventing a flash of the default theme (FOUC).
 */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
