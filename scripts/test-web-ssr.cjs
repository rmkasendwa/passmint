const { createServer } = require("node:http");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const assert = require("node:assert/strict");
const path = require("node:path");
const event = {
  id: "ssr-fixture",
  name: "Server Rendered Festival",
  description: "Server rendering fixture",
  venue: "SSR Test Venue",
  startsAt: "2030-09-14T18:00:00Z",
  capacity: 100,
  priceCents: 1000,
  owner: { id: "ssr-user", name: "SSR Organizer" },
  status: "published",
  ticketsSold: 7,
  remainingCapacity: 93,
  ticketTypes: [],
};
const sales = {
  ticketsIssued: 7,
  ticketsCancelled: 0,
  checkedIn: 3,
  faceValueCents: 7000,
  unpricedTickets: 0,
  events: 1,
  remainingCapacity: 93,
  unlimitedEvents: 0,
  verifiedRevenueCents: null,
  daily: [{ day: "2030-09-14", ticketsIssued: 7 }],
  generatedAt: new Date().toISOString(),
};
const scans = {
  day: new Date().toISOString().slice(0, 10),
  attempts: 3,
  accepted: 3,
  failed: 0,
  duplicates: 0,
  timedScans: 3,
  averageDecisionMs: 5,
  peakCheckInHour: null,
  peakCheckIns: 0,
  hourly: [],
  generatedAt: new Date().toISOString(),
};
const api = createServer((req, res) => {
  let value;
  if (req.url === "/auth/me") {
    if (req.headers.authorization !== "Bearer fixture-token") {
      res.writeHead(401);
      res.end("{}");
      return;
    }
    value = {
      id: "ssr-user",
      name: "SSR Organizer",
      email: "fixture@example.test",
      role: "organizer",
    };
  } else if (req.url.includes("sales-summary")) value = sales;
  else if (req.url.includes("scan-metrics")) value = scans;
  else if (req.url.includes("attendees"))
    value = {
      attendees: [
        {
          id: "fixture-ticket",
          buyerName: "SSR Attendee",
          buyerEmail: "attendee@example.test",
          ticketTypeName: "General",
          status: "issued",
          createdAt: new Date().toISOString(),
          checkedInAt: null,
        },
      ],
      page: 1,
      hasMore: false,
    };
  else if (req.url === "/events" || req.url === "/events/mine") value = [event];
  else if (req.url === "/events/ssr-fixture") value = event;
  else value = [];
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(value));
});
(async () => {
  api.listen(3053, "127.0.0.1");
  await once(api, "listening");
  const web = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3062"],
    {
      cwd: path.resolve(__dirname, "../apps/web"),
      env: {
        ...process.env,
        PASSMINT_BUILD_DIR: ".next/production-check",
        API_INTERNAL_URL: "http://127.0.0.1:3053",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  web.stderr.on("data", (d) => process.stderr.write(d));
  try {
    await new Promise((resolve, reject) => {
      web.stdout.on("data", (d) => {
        if (d.toString().includes("Ready")) resolve();
      });
      web.once("exit", (code) => reject(Error("web exited " + code)));
      setTimeout(() => reject(Error("start timeout")), 20000).unref();
    });
    for (const [route, expected] of [
      ["/", "Server Rendered Festival"],
      ["/events", "Server Rendered Festival"],
      ["/reports", "Tickets issued"],
      ["/events/new", "Event name"],
      ["/check-in", "Check-in"],
      ["/events/ssr-fixture", "SSR Attendee"],
      ["/event/ssr-fixture", "SSR Attendee"],
    ]) {
      const response = await fetch("http://localhost:3062" + route, {
        headers: { cookie: "passmint-server-session=fixture-token" },
      });
      const html = (await response.text()).replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        "",
      );
      assert.equal(response.status, 200, route);
      assert.ok(
        html.toLowerCase().includes(expected.toLowerCase()),
        route + " missing server HTML: " + expected,
      );
      assert.ok(
        !html.includes("NEXT_HTTP_ERROR_FALLBACK"),
        route + " render error",
      );
      console.log("SSR HTML passed:", route);
    }
    const intercepted = await fetch("http://localhost:3062/events/new", {
      headers: {
        cookie: "passmint-server-session=fixture-token",
        RSC: "1",
        "Next-Url": "/events",
        "Next-Router-State-Tree": encodeURIComponent(
          JSON.stringify([
            "",
            {
              children: ["events", { children: ["__PAGE__", {}] }],
              modal: ["__DEFAULT__", {}],
            },
            null,
            null,
            true,
          ]),
        ),
      },
    });
    const modalPayload = await intercepted.text();
    assert.ok(
      modalPayload.includes("CreateEventModal"),
      "Client navigation must intercept creation into the modal",
    );
    console.log("Create-event modal interception passed");
    for (const [oldPath, newPath] of [
      ["/dashboard", "/events"],
      ["/dashboard/events", "/events"],
      ["/dashboard/events/new", "/events/new"],
      ["/dashboard/reports", "/reports"],
      ["/dashboard/check-in", "/check-in"],
    ]) {
      const redirect = await fetch("http://localhost:3062" + oldPath, {
        redirect: "manual",
      });
      assert.equal(redirect.status, 308);
      assert.equal(redirect.headers.get("location"), newPath);
    }
    console.log("Legacy organizer redirects passed");
    const guest = await fetch("http://localhost:3062/reports", {
      redirect: "manual",
    });
    const body = await guest.text();
    assert.ok(
      guest.headers.get("location")?.includes("/login?next=") ||
        body.includes("/login?next="),
    );
    console.log("Guest server redirect passed");
  } finally {
    web.kill();
    api.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
