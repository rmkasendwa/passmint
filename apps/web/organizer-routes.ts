// Restrict post-auth navigation to supported organizer routes on this site.
export function organizerReturnPath(value?: string | null): string {
  if (!value) return "/events";
  try {
    const url = new URL(value, "https://passmint.local");
    if (url.origin !== "https://passmint.local") return "/events";
    const path =
      url.pathname === "/dashboard"
        ? "/events"
        : url.pathname.replace(/^\/dashboard(?=\/)/, "");
    if (
      !/^\/events(?:\/[^/]+)?$/.test(path) &&
      !["/reports", "/check-in"].includes(path)
    )
      return "/events";
    return path + url.search + url.hash;
  } catch {
    return "/events";
  }
}
