const WILDCARD_HOSTS = new Set(["0.0.0.0", "[::]", "::"]);

export function hasWildcardBrowserHost(value: URL | string) {
  try {
    return WILDCARD_HOSTS.has(new URL(value.toString()).hostname);
  } catch {
    return false;
  }
}

export function canonicalBrowserUrl(value: URL | string) {
  const url = new URL(value.toString());
  if (WILDCARD_HOSTS.has(url.hostname)) url.hostname = "localhost";
  return url;
}
