import { cookies } from "next/headers";
import { parseThemePreference, THEME_KEY } from "./theme";

export async function getInitialThemePreference() {
  const cookieStore = await cookies();
  return parseThemePreference(cookieStore.get(THEME_KEY)?.value) ?? "dark";
}
