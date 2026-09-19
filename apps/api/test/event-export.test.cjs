const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, createHash } = require("node:crypto");
const { Test } = require("@nestjs/testing");
const { ValidationPipe } = require("@nestjs/common");
const { PrismaClient } = require("@prisma/client");
const { EventsService } = require("../dist/events/events.service");
const { EventsController } = require("../dist/events/events.controller");
const { ImageStorageService } = require("../dist/events/image-storage.service");
const { PrismaService } = require("../dist/prisma/prisma.service");
const { AuthService } = require("../dist/auth/auth.service");
const { AuthGuard } = require("../dist/auth/auth.guard");
const { OptionalAuthGuard } = require("../dist/auth/optional-auth.guard");
const {
  canonicalJson,
  exportEventArchive,
} = require("../dist/events/event-archive");
const prisma = new PrismaClient();
process.env.NODE_ENV = "production";
process.env.SEED_DEMO_DATA = "false";

test("exports classify reference-only media and older archives remain valid", async () => {
  const { mediaMode } = require("../dist/events/archive-media");
  for (const [value, mode] of [
    [null, "omitted"],
    ["https://cdn.example.com/a.webp", "external"],
    ["/api/uploads/a.webp", "local"],
    ["http://localhost:9001/bucket/a.webp", "local"],
    ["http://127.0.0.1/a.webp", "local"],
    ["http://minio/a.webp", "local"],
  ])
    assert.equal(mediaMode(value), mode);
  const result = await request("host", { eventIds: [hosted.id, draft.id] });
  assert.deepEqual(
    result.body.manifest.media.find((m) => m.sourceId === hosted.id),
    { sourceId: hosted.id, mode: "external", strategy: "reference-only" },
  );
  assert.equal(
    result.body.manifest.media.find((m) => m.sourceId === draft.id).mode,
    "omitted",
  );
  const {
    validateArchive,
  } = require("../dist/events/import-archive-validation");
  delete result.body.manifest.media;
  assert.equal(
    validateArchive(result.body).archiveId,
    result.body.manifest.archiveId,
  );
  const embedded = await prisma.event.create({
    data: {
      id: randomUUID(),
      ownerId: users.host.id,
      name: "Inline",
      description: "Inline",
      venue: "Venue",
      startsAt: new Date("2099-01-01"),
      priceCents: 0,
      thumbnailUrl: "data:image/png;base64,AAAA",
    },
  });
  try {
    const exported = await request("host", { eventIds: [embedded.id] });
    assert.equal(exported.body.events[0].thumbnailUrl, null);
    assert.equal(exported.body.manifest.media[0].mode, "omitted");
    assert.ok(!JSON.stringify(exported.body).includes("base64"));
  } finally {
    await prisma.event.delete({ where: { id: embedded.id } });
  }
});
const users = {};
let app, url, hosted, foreign, draft, adminDraft, orphan;
before(async () => {
  for (const role of ["host", "other", "admin"])
    users[role] = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${randomUUID()}@example.com`,
        name: role,
        passwordHash: "private-password-hash",
        role: role === "admin" ? "admin" : "user",
      },
    });
  const module = await Test.createTestingModule({
    controllers: [EventsController],
    providers: [
      EventsService,
      AuthGuard,
      OptionalAuthGuard,
      { provide: PrismaService, useValue: prisma },
      {
        provide: AuthService,
        useValue: { verifyToken: async (token) => users[token] ?? null },
      },
      { provide: ImageStorageService, useValue: {} },
    ],
  }).compile();
  app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(0, "127.0.0.1");
  url = await app.getUrl();
  const service = module.get(EventsService);
  const details = {
    name: "Portable",
    description: "Description",
    venue: "Venue",
    startsAt: new Date("2035-01-01"),
    priceCents: 200,
    capacity: 30,
    mapLocation: "Kampala",
    thumbnailUrl: "https://example.com/art.webp",
    booking: {
      kind: "cinema",
      durationMinutes: 90,
      seating: { rows: 2, columns: 3, aisleAfter: 1, blocked: ["A1"] },
    },
    ticketTypes: [
      {
        name: "Standard",
        priceCents: 200,
        capacity: 20,
        maxPerOrder: 3,
        salesStart: new Date("2034-01-01"),
        salesEnd: new Date("2034-12-31"),
      },
    ],
  };
  hosted = await service.create(details, users.host);
  foreign = await service.create(details, users.other);
  draft = await service.createDraft({}, users.host);
  adminDraft = await service.createDraft({}, users.admin);
  orphan = await prisma.event.create({
    data: {
      id: randomUUID(),
      name: "Unowned",
      description: "",
      venue: "",
      startsAt: new Date("2035-01-01"),
      priceCents: 0,
    },
  });
  const ticket = await prisma.ticket.create({
    data: {
      id: randomUUID(),
      code: "private-ticket-code",
      eventId: hosted.id,
      buyerName: "Private Buyer",
      buyerEmail: "private-buyer@example.com",
    },
  });
  await prisma.ticketActivity.create({
    data: {
      id: randomUUID(),
      ticketId: ticket.id,
      kind: "checked_in",
      operatorId: users.host.id,
      operatorName: "Private Operator",
    },
  });
});
after(async () => {
  await app?.close();
  await prisma.$disconnect();
});
async function request(token, body = {}) {
  const response = await fetch(`${url}/events/archives/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json(),
  };
}

test("export authentication, owner scoping, admin filters and draft privacy", async () => {
  assert.equal((await request()).status, 401);
  assert.equal((await request("invalid")).status, 401);
  const owned = await request("host");
  assert.equal(owned.status, 200);
  assert.equal(owned.headers.get("cache-control"), "no-store");
  assert.match(owned.headers.get("content-disposition"), /attachment/);
  assert.deepEqual(
    owned.body.events.map((e) => e.sourceId).sort(),
    [hosted.id, draft.id].sort(),
  );
  assert.equal(
    (await request("host", { ownerId: users.other.id })).status,
    403,
  );
  for (const token of ["host", "admin"]) {
    assert.equal((await request(token, { eventIds: ["missing"] })).status, 404);
  }
  assert.equal(
    (await request("host", { eventIds: [hosted.id, foreign.id] })).status,
    404,
  );
  assert.equal((await request("admin", { eventIds: [draft.id] })).status, 404);
  const all = (await request("admin")).body.events;
  for (const id of [hosted.id, foreign.id, adminDraft.id, orphan.id])
    assert.ok(all.some((e) => e.sourceId === id));
  assert.ok(!all.some((e) => e.sourceId === draft.id));
  assert.equal(all.find((e) => e.sourceId === orphan.id).owner, null);
  assert.deepEqual(
    (await request("admin", { ownerId: users.host.id })).body.events.map(
      (e) => e.sourceId,
    ),
    [hosted.id],
  );
});

test("versioned archive preserves definitions and excludes operational/private data", async () => {
  const { body: archive } = await request("host", {
    eventIds: [hosted.id],
    sourceEnvironment: "local",
  });
  assert.equal(archive.schemaVersion, 1);
  assert.equal(archive.sourceEnvironment, "local");
  assert.deepEqual(archive.manifest.counts, { events: 1, ticketTypes: 1 });
  const event = archive.events[0];
  assert.deepEqual(
    Object.keys(event).sort(),
    [
      "sourceId",
      "name",
      "description",
      "venue",
      "mapLocation",
      "startsAt",
      "capacity",
      "priceCents",
      "thumbnailUrl",
      "status",
      "publishAt",
      "cancelledAt",
      "booking",
      "createdAt",
      "updatedAt",
      "owner",
      "ticketTypes",
    ].sort(),
  );
  assert.deepEqual(event.owner, {
    sourceId: users.host.id,
    email: users.host.email,
    name: "host",
  });
  assert.equal(event.startsAt, "2035-01-01T00:00:00.000Z");
  assert.equal(event.booking.seating.blocked[0], "A1");
  assert.equal(event.capacity, 5); // Six seats minus the blocked seat.
  assert.equal(event.thumbnailUrl, "https://example.com/art.webp");
  const category = await prisma.ticketType.findFirst({
    where: { eventId: hosted.id },
  });
  assert.equal(event.ticketTypes[0].sourceId, category.id);
  assert.deepEqual(
    Object.keys(event.ticketTypes[0]).sort(),
    [
      "sourceId",
      "name",
      "priceCents",
      "capacity",
      "maxPerOrder",
      "salesStart",
      "salesEnd",
    ].sort(),
  );
  assert.equal(event.ticketTypes[0].salesEnd, "2034-12-31T00:00:00.000Z");
  for (const secret of [
    "private-password-hash",
    "private-ticket-code",
    "Private Buyer",
    "private-buyer@example.com",
    "Private Operator",
    "passwordHash",
    "activities",
    "tickets",
    "DATABASE_URL",
    "S3_SECRET_ACCESS_KEY",
  ])
    assert.ok(!JSON.stringify(archive).includes(secret));
  const payload = {
    schemaVersion: archive.schemaVersion,
    sourceEnvironment: archive.sourceEnvironment,
    events: archive.events,
  };
  const checksum = createHash("sha256")
    .update(canonicalJson(payload))
    .digest("hex");
  assert.equal(archive.manifest.checksum.value, checksum);
  assert.equal(archive.manifest.archiveId, `sha256:${checksum}`);
  const repeated = (
    await request("host", { sourceEnvironment: "local", eventIds: [hosted.id] })
  ).body;
  assert.equal(repeated.manifest.archiveId, archive.manifest.archiveId);
});

test("request validation rejects null, malformed, empty, duplicate and oversized selections", async () => {
  for (const body of [
    { eventIds: null },
    { eventIds: [] },
    { eventIds: "id" },
    { eventIds: [1] },
    { eventIds: [hosted.id, hosted.id] },
    { eventIds: Array.from({ length: 1001 }, (_, i) => String(i)) },
    { ownerId: null },
    { ownerId: "" },
    { sourceEnvironment: null },
    { sourceEnvironment: "x".repeat(101) },
    { includeTickets: true },
  ]) {
    assert.equal(
      (await request("host", body)).status,
      400,
      JSON.stringify(body),
    );
  }
});

test("stable ordering, lifecycle metadata, empty archives and export bounds", async () => {
  const now = new Date("2030-01-01");
  const options = { eventIds: [hosted.id, draft.id] };
  const first = await exportEventArchive(prisma, users.host, options, now);
  const second = await exportEventArchive(
    prisma,
    users.host,
    { eventIds: [...options.eventIds].reverse() },
    now,
  );
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  await prisma.event.update({
    where: { id: hosted.id },
    data: { status: "scheduled", publishAt: now },
  });
  const scheduled = await exportEventArchive(prisma, users.host, options, now);
  assert.equal(
    scheduled.events.find((e) => e.sourceId === hosted.id).publishAt,
    now.toISOString(),
  );
  assert.notEqual(scheduled.manifest.archiveId, first.manifest.archiveId);
  await prisma.event.update({
    where: { id: hosted.id },
    data: { status: "cancelled", cancelledAt: now },
  });
  assert.equal(
    (await exportEventArchive(prisma, users.host, options, now)).events.find(
      (e) => e.sourceId === hosted.id,
    ).cancelledAt,
    now.toISOString(),
  );
  const empty = await exportEventArchive(
    prisma,
    { id: randomUUID(), role: "user" },
    {},
    now,
  );
  assert.deepEqual(empty.manifest.counts, { events: 0, ticketTypes: 0 });
  await assert.rejects(
    exportEventArchive(
      { event: { findMany: async () => Array(1001).fill({}) } },
      users.host,
      {},
    ),
    /at most 1000/,
  );
  const row = await prisma.event.findUnique({
    where: { id: hosted.id },
    include: { owner: true, ticketTypes: true },
  });
  // Supply the same projection that the real Prisma query enforces.
  delete row.ownerId;
  row.owner = {
    id: row.owner.id,
    email: row.owner.email,
    name: row.owner.name,
  };
  row.description = "x".repeat(6 * 1024 * 1024);
  await assert.rejects(
    exportEventArchive(
      { event: { findMany: async () => [row] } },
      users.host,
      {},
    ),
    /exceeds 6 MiB/,
  );
});
