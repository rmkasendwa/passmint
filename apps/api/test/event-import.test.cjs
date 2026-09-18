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
const { importEventArchive } = require("../dist/events/import-event-archive");
const prisma = new PrismaClient();
// Exercise production bootstrap without racing other test apps' demo seeding.
process.env.NODE_ENV = "production";
process.env.SEED_DEMO_DATA = "false";
const users = {};
let app, url, source;
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
  source = await service.create(
    {
      name: "Portable",
      description: "Description",
      venue: "Venue",
      startsAt: new Date("2099-01-01"),
      priceCents: 200,
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
          capacity: null,
          maxPerOrder: 3,
          salesStart: new Date("2098-01-01"),
          salesEnd: new Date("2098-12-31"),
        },
      ],
    },
    users.host,
  );
});
after(async () => {
  await app?.close();
  await prisma.$disconnect();
});

test("operator CLI exports a real archive and dry-runs it through the authenticated API", async () => {
  const { mkdtemp, readFile, rm } = require("node:fs/promises");
  const { tmpdir } = require("node:os");
  const { join, resolve } = require("node:path");
  const { spawn } = require("node:child_process");
  const directory = await mkdtemp(join(tmpdir(), "passmint-cli-api-"));
  const run = (args) =>
    new Promise((done, reject) => {
      const child = spawn(
        process.execPath,
        [resolve(__dirname, "../../../scripts/event-archives.mjs"), ...args],
        { env: { ...process.env, PASSMINT_TOKEN: "host" } },
      );
      let output = "";
      child.stdout.on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
      child.on("error", reject);
      child.on("close", (code) => done({ code, output }));
    });
  try {
    const file = join(directory, "archive.json");
    const reportFile = join(directory, "dry-run.json");
    const baseline = await counts();
    const exported = await run([
      "export",
      "--api-url",
      url,
      "--file",
      file,
      "--event-id",
      source.id,
      "--source-environment",
      "cli-test",
    ]);
    assert.equal(exported.code, 0, exported.output);
    const archive = JSON.parse(await readFile(file, "utf8"));
    assert.equal(archive.events[0].sourceId, source.id);
    const imported = await run([
      "import",
      "--api-url",
      url,
      "--file",
      file,
      "--report",
      reportFile,
    ]);
    assert.equal(imported.code, 0, imported.output);
    const report = JSON.parse(await readFile(reportFile, "utf8"));
    assert.equal(report.dryRun, true);
    assert.equal(report.counts.valid, 1);
    assert.equal(report.records[0].targetId, undefined);
    assert.deepEqual(await counts(), baseline);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
async function archive() {
  return exportEventArchive(prisma, users.host, {
    eventIds: [source.id],
    sourceEnvironment: randomUUID(),
  });
}
function resign(value) {
  const copy = structuredClone(value);
  copy.manifest.counts = {
    events: copy.events.length,
    ticketTypes: copy.events.reduce(
      (n, e) => n + (Array.isArray(e.ticketTypes) ? e.ticketTypes.length : 0),
      0,
    ),
  };
  const digest = createHash("sha256")
    .update(
      canonicalJson({
        schemaVersion: copy.schemaVersion,
        sourceEnvironment: copy.sourceEnvironment,
        events: copy.events,
      }),
    )
    .digest("hex");
  copy.manifest.checksum.value = digest;
  copy.manifest.archiveId = `sha256:${digest}`;
  return copy;
}
async function request(token, body) {
  const response = await fetch(`${url}/events/archives/import`, {
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
async function counts() {
  const ownerId = { in: Object.values(users).map((user) => user.id) };
  return Promise.all([
    prisma.event.count({ where: { ownerId } }),
    prisma.ticketType.count({ where: { event: { ownerId } } }),
    prisma.eventImport.count({ where: { ownerId } }),
  ]);
}

test("HTTP authentication, explicit owner remapping and dry-run default do not write", async () => {
  const data = await archive();
  const baseline = await counts();
  assert.equal((await request(undefined, { archive: data })).status, 401);
  assert.equal((await request("invalid", { archive: data })).status, 401);
  assert.equal(
    (await request("host", { archive: data, targetOwnerId: users.other.id }))
      .status,
    403,
  );
  const preview = await request("host", { archive: data });
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get("cache-control"), "no-store");
  assert.equal(preview.body.dryRun, true);
  assert.equal(preview.body.counts.valid, 1);
  assert.equal(preview.body.records[0].targetId, undefined);
  assert.equal(preview.body.records[0].targetOwnerId, users.host.id);
  assert.equal(preview.body.records[0].verification.status, "not_imported");
  assert.equal(preview.body.records[0].verification.checks.capacity, null);
  assert.equal(preview.body.verification.notImported, 1);
  assert.deepEqual(await counts(), baseline);
  const missing = structuredClone(data);
  missing.events[0].owner.email = "missing@example.com";
  const rejected = await request("admin", { archive: resign(missing) });
  assert.equal(rejected.body.counts.failed, 1);
  assert.match(rejected.body.records[0].error, /missing in the target/);
  assert.equal(
    (await request("other", { archive: data })).body.counts.failed,
    1,
  );
  const remapped = await request("other", {
    archive: data,
    targetOwnerId: users.other.id,
  });
  assert.equal(remapped.body.counts.valid, 1);
  assert.match(remapped.body.records[0].warnings.join(" "), /remapped/);
  assert.equal(
    (await request("admin", { archive: data, targetOwnerId: "missing" }))
      .status,
    404,
  );
  const orphan = structuredClone(data);
  orphan.events[0].owner = null;
  assert.equal(
    (await request("host", { archive: resign(orphan) })).body.counts.failed,
    1,
  );
  assert.equal(
    (
      await request("host", {
        archive: resign(orphan),
        targetOwnerId: users.host.id,
      })
    ).body.counts.valid,
    1,
  );
  assert.deepEqual(await counts(), baseline);
});

test("bulk round trip creates new event/category IDs, preserves definitions and scopes duplicate receipts", async () => {
  const data = await archive();
  const draft = structuredClone(data.events[0]);
  Object.assign(draft, {
    sourceId: "source_draft",
    status: "draft",
    name: "",
    description: "",
    venue: "",
    startsAt: "1970-01-01T00:00:00.000Z",
    ticketTypes: [],
    booking: null,
    capacity: null,
    thumbnailUrl: null,
  });
  data.events.push(draft);
  const bulk = resign(data);
  const imported = await request("admin", {
    archive: bulk,
    dryRun: false,
    targetOwnerId: users.other.id,
  });
  assert.equal(imported.body.counts.imported, 2);
  assert.equal(imported.body.verification.matched, 2);
  assert.deepEqual(imported.body.verification.expectedByStatus, {
    draft: 1,
    published: 1,
    scheduled: 0,
    cancelled: 0,
  });
  assert.deepEqual(
    imported.body.verification.actualByStatus,
    imported.body.verification.expectedByStatus,
  );
  assert.deepEqual(imported.body.verification.categories, {
    expected: 1,
    actual: 1,
  });
  assert.equal(
    imported.body.records[0].verification.media,
    "reference_preserved",
  );
  assert.equal(imported.body.records[1].verification.media, "absent");
  assert.equal(imported.body.records[0].verification.checks.ownerId, true);
  const record = imported.body.records[0];
  assert.notEqual(record.targetId, source.id);
  assert.match(record.targetId, /^evt_/);
  assert.match(record.ticketTypes[0].targetId, /^typ_/);
  assert.notEqual(
    record.ticketTypes[0].sourceId,
    record.ticketTypes[0].targetId,
  );
  const target = await prisma.event.findUnique({
    where: { id: record.targetId },
    include: { ticketTypes: true, tickets: true },
  });
  assert.equal(target.ownerId, users.other.id);
  for (const field of [
    "name",
    "description",
    "venue",
    "mapLocation",
    "thumbnailUrl",
    "capacity",
    "priceCents",
    "status",
  ])
    assert.deepEqual(target[field], bulk.events[0][field]);
  assert.equal(target.startsAt.toISOString(), bulk.events[0].startsAt);
  assert.deepEqual(target.booking, bulk.events[0].booking);
  assert.equal(target.tickets.length, 0);
  assert.equal(target.ticketTypes.length, 1);
  for (const field of ["name", "capacity", "priceCents", "maxPerOrder"])
    assert.equal(
      target.ticketTypes[0][field],
      bulk.events[0].ticketTypes[0][field],
    );
  assert.equal(
    target.ticketTypes[0].salesStart.toISOString(),
    bulk.events[0].ticketTypes[0].salesStart,
  );
  assert.equal(
    target.ticketTypes[0].salesEnd.toISOString(),
    bulk.events[0].ticketTypes[0].salesEnd,
  );
  assert.equal(target.ticketTypes[0].eventId, target.id);
  const baseline = await counts();
  for (const dryRun of [true, false]) {
    const repeated = await request("admin", {
      archive: bulk,
      dryRun,
      targetOwnerId: users.other.id,
    });
    assert.equal(repeated.body.counts.skipped, 2);
    assert.equal(repeated.body.records[0].targetId, target.id);
    assert.deepEqual(repeated.body.records[0].ticketTypes, record.ticketTypes);
  }
  const conflict = await request("admin", {
    archive: bulk,
    dryRun: false,
    targetOwnerId: users.other.id,
    onDuplicate: "error",
  });
  assert.equal(conflict.body.counts.failed, 2);
  assert.deepEqual(await counts(), baseline);
  // Another owner's copy cannot suppress this user's import or disclose its IDs.
  const own = await request("host", { archive: bulk, dryRun: false });
  assert.equal(own.body.counts.imported, 2);
  assert.notEqual(own.body.records[0].targetId, target.id);
});

test("archive envelope and options reject tampering, unsupported versions and malformed data before writing", async () => {
  const data = await archive();
  const baseline = await counts();
  for (const options of [
    { dryRun: "false" },
    { dryRun: null },
    { targetOwnerId: null },
    { onDuplicate: "overwrite" },
    { onDuplicate: null },
    { extra: true },
  ])
    assert.equal(
      (await request("host", { archive: data, ...options })).status,
      400,
    );
  const invalid = [
    null,
    [],
    {},
    { ...data, schemaVersion: 2 },
    { ...data, events: null },
    { ...data, manifest: null },
  ];
  const changed = structuredClone(data);
  changed.events[0].name = "tampered";
  invalid.push(changed);
  const badCount = structuredClone(data);
  badCount.manifest.counts.events = 99;
  invalid.push(badCount);
  const duplicate = structuredClone(data);
  duplicate.events.push(duplicate.events[0]);
  invalid.push(resign(duplicate));
  const deep = structuredClone(data);
  let cursor = deep;
  for (let i = 0; i < 20; i++) cursor = cursor.nested = {};
  invalid.push(deep);
  for (const input of invalid)
    assert.equal(
      (await request("host", { archive: input, dryRun: false })).status,
      400,
    );
  assert.deepEqual(await counts(), baseline);
});

test("per-record validation reports failures while valid records import without partial categories", async () => {
  const data = await archive();
  const bad = structuredClone(data.events[0]);
  bad.sourceId = "bad";
  bad.ticketTypes[0].maxPerOrder = 0;
  data.events.push(bad);
  const preview = await request("host", { archive: resign(data) });
  assert.equal(preview.body.counts.valid, 1);
  assert.equal(preview.body.counts.failed, 1);
  const result = await request("host", {
    archive: resign(data),
    dryRun: false,
  });
  assert.equal(result.body.counts.imported, 1);
  assert.equal(result.body.counts.failed, 1);
  assert.equal(result.body.records[1].verification.status, "not_checked");
  assert.equal(result.body.verification.notChecked, 1);
  assert.equal(
    await prisma.eventImport.count({
      where: { archiveId: result.body.archiveId },
    }),
    1,
  );
  for (const change of [
    (e) => {
      e.priceCents = 2147483648;
    },
    (e) => {
      e.capacity = 6;
    },
    (e) => {
      e.startsAt = "tomorrow";
    },
    (e) => {
      e.status = "unknown";
    },
    (e) => {
      e.publishAt = "2020-01-01T00:00:00.000Z";
      e.status = "draft";
    },
    (e) => {
      e.ticketTypes[0].salesEnd = e.ticketTypes[0].salesStart;
    },
    (e) => {
      e.ticketTypes.push({ ...e.ticketTypes[0], sourceId: "duplicate-name" });
    },
    (e) => {
      e.ticketTypes.push({ ...e.ticketTypes[0], name: "Other" });
    },
    (e) => {
      e.booking.secret = "not-supported";
    },
    (e) => {
      e.tickets = [];
    },
    (e) => {
      e.owner = {};
    },
    (e) => {
      delete e.booking;
    },
    (e) => {
      e.booking.seating = null;
    },
  ]) {
    const invalid = await archive();
    change(invalid.events[0]);
    const response = await request("host", {
      archive: resign(invalid),
      dryRun: false,
    });
    assert.equal(response.body.counts.failed, 1);
    assert.equal(response.body.counts.imported, 0);
    assert.equal(
      await prisma.eventImport.count({
        where: { archiveId: response.body.archiveId },
      }),
      0,
    );
  }
});

test("scheduled and cancelled events preserve lifecycle without silently publishing expired schedules", async () => {
  const data = await archive();
  const scheduled = data.events[0];
  scheduled.status = "draft";
  scheduled.publishAt = "2098-06-01T00:00:00.000Z";
  const cancelled = structuredClone(scheduled);
  Object.assign(cancelled, {
    sourceId: "cancelled",
    status: "cancelled",
    publishAt: null,
    cancelledAt: "2026-01-01T00:00:00.000Z",
  });
  const explicit = structuredClone(scheduled);
  explicit.sourceId = "scheduled";
  explicit.status = "scheduled";
  data.events.push(cancelled, explicit);
  const input = resign(data);
  const result = await request("host", { archive: input, dryRun: false });
  assert.equal(result.body.counts.imported, 3);
  assert.equal(result.body.verification.actualByStatus.scheduled, 2);
  assert.equal(result.body.verification.actualByStatus.cancelled, 1);
  for (const record of result.body.records) {
    const target = await prisma.event.findUnique({
      where: { id: record.targetId },
    });
    assert.equal(
      target.status,
      record.sourceId === "cancelled" ? "cancelled" : "draft",
    );
    assert.equal(
      target.publishAt?.toISOString() ?? null,
      record.sourceId === "cancelled" ? null : scheduled.publishAt,
    );
    if (record.sourceId === "cancelled")
      assert.equal(target.cancelledAt.toISOString(), cancelled.cancelledAt);
  }
  // Retries still find receipts after the imported schedule has elapsed.
  const retry = await importEventArchive(
    prisma,
    users.host,
    { archive: input, dryRun: true },
    new Date("2100-01-01"),
  );
  assert.equal(retry.counts.skipped, 3);
});

test("concurrent imports create one event/category set and receipt", async () => {
  const data = await archive();
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      request("host", { archive: data, dryRun: false }),
    ),
  );
  assert.equal(
    results.reduce((n, r) => n + r.body.counts.imported, 0),
    1,
  );
  assert.equal(
    results.reduce((n, r) => n + r.body.counts.skipped, 0),
    3,
  );
  const ids = new Set(results.map((r) => r.body.records[0].targetId));
  assert.equal(ids.size, 1);
  assert.equal(
    await prisma.eventImport.count({
      where: { archiveId: data.manifest.archiveId },
    }),
    1,
  );
  assert.equal(
    await prisma.ticketType.count({ where: { eventId: [...ids][0] } }),
    1,
  );
});

test("verification reads edited target state on skipped retries and never overwrites drift", async () => {
  const data = await archive();
  const first = await request("host", { archive: data, dryRun: false });
  const record = first.body.records[0];
  assert.equal(record.verification.status, "match");
  assert.ok(
    Object.values(record.verification.checks).every((value) => value === true),
  );
  await prisma.event.update({
    where: { id: record.targetId },
    data: { venue: "Changed venue", priceCents: 500, thumbnailUrl: null },
  });
  await prisma.ticketType.update({
    where: { id: record.ticketTypes[0].targetId },
    data: { maxPerOrder: 1 },
  });
  for (const dryRun of [true, false]) {
    const retry = await request("host", { archive: data, dryRun });
    assert.equal(retry.body.counts.skipped, 1);
    assert.equal(retry.body.verification.mismatched, 1);
    const verification = retry.body.records[0].verification;
    assert.equal(verification.status, "mismatch");
    assert.equal(verification.checks.venue, false);
    assert.equal(verification.checks.priceCents, false);
    assert.equal(verification.checks.startsAt, true);
    assert.equal(verification.checks.booking, true);
    assert.equal(verification.categories.matches, false);
    assert.equal(verification.ticketTypes[0].matches, false);
    assert.equal(verification.media, "changed");
    assert.match(retry.body.records[0].warnings.join(" "), /Duplicate skipped/);
    assert.match(retry.body.summary, /1 mismatched/);
  }
  await prisma.ticketType.delete({
    where: { id: record.ticketTypes[0].targetId },
  });
  const missing = await request("host", { archive: data });
  assert.deepEqual(missing.body.records[0].verification.categories, {
    expected: 1,
    actual: 0,
    matches: false,
  });
  assert.equal(
    (await prisma.event.findUnique({ where: { id: record.targetId } })).venue,
    "Changed venue",
  );
});

test("verification failure after commit retains import success and is recoverable by retry", async () => {
  const data = await archive();
  const unreadable = {
    user: prisma.user,
    $transaction: (work) => prisma.$transaction(work),
    event: {
      findFirst: async () => {
        throw new Error("private database failure");
      },
    },
  };
  const first = await importEventArchive(unreadable, users.host, {
    archive: data,
    dryRun: false,
  });
  assert.equal(first.counts.imported, 1);
  assert.equal(first.counts.failed, 0);
  assert.equal(first.verification.unavailable, 1);
  assert.ok(!JSON.stringify(first).includes("private database failure"));
  const retry = await request("host", { archive: data });
  assert.equal(retry.body.counts.skipped, 1);
  assert.equal(retry.body.verification.matched, 1);
  assert.equal(retry.body.records[0].targetId, first.records[0].targetId);
});

test("admin email matching handles multiple owners and changed ownership hides old mappings", async () => {
  const data = await archive();
  const other = structuredClone(data.events[0]);
  other.sourceId = "other-source";
  other.owner = {
    sourceId: "foreign-database-id",
    email: users.other.email,
    name: "Other",
  };
  data.events.push(other);
  const input = resign(data);
  const result = await request("admin", { archive: input, dryRun: false });
  assert.equal(result.body.counts.imported, 2);
  assert.deepEqual(
    result.body.records.map((r) => r.targetOwnerId),
    [users.host.id, users.other.id],
  );
  const originalTargetId = result.body.records[0].targetId;
  await prisma.event.update({
    where: { id: originalTargetId },
    data: { ownerId: users.other.id },
  });
  const retry = await request("host", { archive: input, dryRun: false });
  assert.equal(retry.body.counts.failed, 2);
  assert.equal(retry.body.records[0].targetId, undefined);
  assert.match(retry.body.records[0].error, /ownership has changed/);
  assert.ok(!JSON.stringify(retry.body).includes(originalTargetId));
});

test("a database failure after event creation rolls back event and categories; retry recovers", async () => {
  const data = await archive();
  const baseline = await counts();
  const faulty = {
    user: prisma.user,
    $transaction: (work) =>
      prisma.$transaction((tx) =>
        work(
          new Proxy(tx, {
            get(target, key) {
              if (key === "eventImport")
                return {
                  findUnique: target.eventImport.findUnique.bind(
                    target.eventImport,
                  ),
                  create: async () => {
                    throw new Error("private connection details");
                  },
                };
              return target[key];
            },
          }),
        ),
      ),
  };
  const report = await importEventArchive(faulty, users.host, {
    archive: data,
    dryRun: false,
  });
  assert.equal(report.counts.failed, 1);
  assert.ok(!JSON.stringify(report).includes("private connection details"));
  assert.deepEqual(await counts(), baseline);
  const retry = await request("host", { archive: data, dryRun: false });
  assert.equal(retry.body.counts.imported, 1);
});
