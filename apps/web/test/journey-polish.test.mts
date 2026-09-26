import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const webRoot = join(import.meta.dirname, "..");

function read(path: string) {
  return readFileSync(join(webRoot, path), "utf8");
}

test("discovery event links preserve return context for browser back navigation", () => {
  const home = read("app/page.tsx");

  assert.match(home, /function eventHref/);
  assert.match(home, /returnTo=\$\{encodeURIComponent\(returnTo\)\}/);
  assert.match(home, /\/\?\$\{query\}#events/);
});

test("event checkout separates pending payment, total price and confirmed ticket access", () => {
  const detail = read("components/event-detail.tsx");
  const provider = read("components/app-provider.tsx");

  assert.match(detail, /Fees:/);
  assert.match(detail, /Total due:/);
  assert.match(detail, /purchaseStatus === "processing"/);
  assert.match(detail, /Bring the QR code below/);
  assert.match(provider, /Payment is pending approval/);
  assert.match(provider, /Tickets are not issued until confirmation completes/);
});

test("organizer cards connect management, public page, check-in and reports", () => {
  const dashboard = read("components/dashboard-workbench.tsx");
  const checkIn = read("app/check-in/page.tsx");

  assert.match(dashboard, /Public page/);
  assert.match(dashboard, /Check in guests/);
  assert.match(dashboard, /\/reports\?eventId=/);
  assert.match(dashboard, /Publish this event before sharing/);
  assert.match(checkIn, /focusEventId/);
});

test("public showcase is product-facing and separated from repository details", () => {
  const showcase = read("app/showcase/page.tsx");
  const shell = read("components/app-shell.tsx");

  assert.match(showcase, /PASSMINT PRODUCT SHOWCASE/);
  assert.match(showcase, /Open controlled demo/);
  assert.match(showcase, /source repository/);
  assert.match(shell, /Showcase/);
});
