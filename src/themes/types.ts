export type ThemeId = "ocean" | "emerald" | "sunset" | "royal" | "rose" | "ruby";

export interface ThemeColors {
  /** Main action color */
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  /** Action companion (lighter) */
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  /** Soft accent (backgrounds, highlights) */
  accent: string;
  onAccent: string;
  /** Chart sequence */
  chart: [string, string, string, string, string];
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  labelEn: string;
  description: string;
  colors: ThemeColors;
}

export type ThemeMode = "light" | "dark";
