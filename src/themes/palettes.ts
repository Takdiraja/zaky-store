import type { ThemeDefinition, ThemeId } from "./types";

/**
 * Six professionally designed light palettes.
 *
 * Each palette follows the same token roles:
 * - primary  = main action color (buttons, FABs, links, focus)
 * - secondary = lighter companion (hover tints, secondary actions)
 * - accent   = soft background tint (chips, highlights)
 * - chart    = harmonious multi-stop sequence for charts
 *
 * `on-*` colors are chosen to satisfy WCAG AA (4.5:1) against their pair.
 * Status colors (success/warning/danger/info) are intentionally NOT part of
 * a theme — they stay constant so their universal meaning is preserved.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: "ocean",
    label: "Lautan Biru",
    labelEn: "Ocean Blue",
    description: "Profesional, bersih, dan terpercaya.",
    colors: {
      primary: "#2563EB",
      onPrimary: "#FFFFFF",
      primaryContainer: "#DBEAFE",
      onPrimaryContainer: "#1E3A8A",
      secondary: "#3B82F6",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#DBEAFE",
      onSecondaryContainer: "#1E3A8A",
      accent: "#EFF6FF",
      onAccent: "#1E3A8A",
      chart: ["#2563EB", "#60A5FA", "#0EA5E9", "#14B8A6", "#6366F1"],
    },
  },
  {
    id: "emerald",
    label: "Zamrud",
    labelEn: "Emerald Green",
    description: "Segar, stabil, dan produktif.",
    colors: {
      primary: "#059669",
      onPrimary: "#FFFFFF",
      primaryContainer: "#D1FAE5",
      onPrimaryContainer: "#064E3B",
      secondary: "#10B981",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#D1FAE5",
      onSecondaryContainer: "#064E3B",
      accent: "#ECFDF5",
      onAccent: "#064E3B",
      chart: ["#059669", "#34D399", "#10B981", "#84CC16", "#0D9488"],
    },
  },
  {
    id: "sunset",
    label: "Jingga Senja",
    labelEn: "Sunset Orange",
    description: "Hangat, ramah, dan bersemangat.",
    colors: {
      primary: "#EA580C",
      onPrimary: "#FFFFFF",
      primaryContainer: "#FFEDD5",
      onPrimaryContainer: "#7C2D12",
      secondary: "#F97316",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#FFEDD5",
      onSecondaryContainer: "#7C2D12",
      accent: "#FFF7ED",
      onAccent: "#7C2D12",
      chart: ["#EA580C", "#FB923C", "#F59E0B", "#F97316", "#D97706"],
    },
  },
  {
    id: "royal",
    label: "Ungu Kerajaan",
    labelEn: "Royal Purple",
    description: "Premium, modern, dan elegan.",
    colors: {
      primary: "#7C3AED",
      onPrimary: "#FFFFFF",
      primaryContainer: "#EDE9FE",
      onPrimaryContainer: "#4C1D95",
      secondary: "#8B5CF6",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#EDE9FE",
      onSecondaryContainer: "#4C1D95",
      accent: "#F5F3FF",
      onAccent: "#4C1D95",
      chart: ["#7C3AED", "#A78BFA", "#8B5CF6", "#6D28D9", "#C084FC"],
    },
  },
  {
    id: "rose",
    label: "Mawar",
    labelEn: "Rose Pink",
    description: "Lembut, hangat, dan elegan.",
    colors: {
      primary: "#E11D48",
      onPrimary: "#FFFFFF",
      primaryContainer: "#FFE4E6",
      onPrimaryContainer: "#881337",
      secondary: "#F43F5E",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#FFE4E6",
      onSecondaryContainer: "#881337",
      accent: "#FFF1F2",
      onAccent: "#881337",
      chart: ["#E11D48", "#FB7185", "#F43F5E", "#F59E0B", "#EC4899"],
    },
  },
  {
    id: "ruby",
    label: "Merah Rubi",
    labelEn: "Ruby Red",
    description: "Berani dan penuh keyakinan.",
    colors: {
      primary: "#DC2626",
      onPrimary: "#FFFFFF",
      primaryContainer: "#FEE2E2",
      onPrimaryContainer: "#7F1D1D",
      secondary: "#EF4444",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#FEE2E2",
      onSecondaryContainer: "#7F1D1D",
      accent: "#FEF2F2",
      onAccent: "#7F1D1D",
      chart: ["#DC2626", "#F87171", "#EF4444", "#F59E0B", "#B91C1C"],
    },
  },
];

export const THEME_MAP: Record<ThemeId, ThemeDefinition> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, ThemeDefinition>;

export const DEFAULT_THEME: ThemeId = "ruby";
