export type ThemePreference = "system" | "light" | "black";
export type LegacyThemePreference = ThemePreference | "dark";
export type ResolvedWorkbenchTheme = "light" | "black";

export function normalizeThemePreference(value: unknown): ThemePreference {
  if (value === "system" || value === "light") return value;
  if (value === "black" || value === "dark") return "black";
  return "black";
}

export function resolveWorkbenchTheme(
  preference: unknown,
  systemTheme: ResolvedWorkbenchTheme | "dark" = "black",
): ResolvedWorkbenchTheme {
  const normalized = normalizeThemePreference(preference);
  if (normalized === "light") return "light";
  if (normalized === "system") return systemTheme === "light" ? "light" : "black";
  return "black";
}

export function themeClassName(preference: unknown, systemTheme: ResolvedWorkbenchTheme | "dark" = "black"): string {
  return `theme-${resolveWorkbenchTheme(preference, systemTheme)}`;
}
