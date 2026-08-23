export const THEME_KEY = "passmint-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function parseThemePreference(value: string | undefined | null) {
  return value === "light" || value === "system" || value === "dark"
    ? value
    : null;
}
