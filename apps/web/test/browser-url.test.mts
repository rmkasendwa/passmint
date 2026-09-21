import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalBrowserUrl,
  hasWildcardBrowserHost,
  publicBrowserUrl,
} from "../browser-url.ts";

test("wildcard browser hosts become localhost without losing navigation state", () => {
  const url = canonicalBrowserUrl(
    "http://0.0.0.0:3050/login?next=%2Fevents#content",
  );

  assert.equal(
    url.toString(),
    "http://localhost:3050/login?next=%2Fevents#content",
  );
  assert.equal(hasWildcardBrowserHost(url), false);
});

test("public browser hosts remain unchanged", () => {
  const value = "https://tickets.example.com/auth/google/callback?code=code";
  assert.equal(canonicalBrowserUrl(value).toString(), value);
  assert.equal(hasWildcardBrowserHost(value), false);
  assert.equal(hasWildcardBrowserHost("not a URL"), false);
});

test("browser redirects use the configured public origin behind a proxy", () => {
  assert.equal(
    publicBrowserUrl(
      "/events?view=owned#content",
      "https://localhost:3050/auth/google/callback?token=token",
      "https://tickets.example.com",
    ).toString(),
    "https://tickets.example.com/events?view=owned#content",
  );

  assert.equal(
    publicBrowserUrl(
      "https://localhost:3050/login?error=failed",
      "https://localhost:3050/auth/google/callback",
      "https://tickets.example.com",
    ).toString(),
    "https://tickets.example.com/login?error=failed",
  );
});
