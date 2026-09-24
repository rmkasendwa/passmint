const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventSeedService } = require("../dist/events/event-seed.service");
const { buildSeedEvents } = require("../dist/events/seed-data/events");

function fakePrisma(initialEvents = [], rootAdminId = "usr_root") {
  const records = new Map(initialEvents.map((event) => [event.id, event]));
  const created = [];
  const updated = [];

  return {
    records,
    created,
    updated,
    user: {
      async findFirst({ where }) {
        return where.role === "root_admin" && rootAdminId
          ? { id: rootAdminId }
          : null;
      },
    },
    event: {
      async count({ where }) {
        return [...records.values()].filter((event) =>
          where.OR.some((condition) =>
            condition.id
              ? event.id === condition.id
              : event.name === condition.name,
          ),
        ).length;
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const [id, event] of records) {
          if (
            where.OR.some((condition) =>
              condition.id
                ? event.id === condition.id
                : event.name === condition.name,
            )
          ) {
            records.set(id, { ...event, ...data });
            count += 1;
          }
        }
        return { count };
      },
      async findMany() {
        return [];
      },
      async findFirst({ where }) {
        return [...records.values()].find((event) =>
          where.OR.some((condition) =>
            condition.id
              ? event.id === condition.id
              : event.name === condition.name,
          ),
        );
      },
      async create({ data }) {
        assert.equal(records.has(data.id), false);
        const event = {
          id: data.id,
          name: data.name,
          ownerId: data.ownerId,
          thumbnailUrl: data.thumbnailUrl,
          mapLocation: data.mapLocation,
          startsAt: data.startsAt,
        };
        records.set(event.id, event);
        created.push(data);
        return event;
      },
      async update({ where, data }) {
        const event = {
          ...records.get(where.id),
          ...data,
          ...(data.owner?.connect?.id
            ? { ownerId: data.owner.connect.id, owner: undefined }
            : {}),
        };
        records.set(where.id, event);
        updated.push({ where, data });
        return event;
      },
    },
  };
}

const fakeAuth = {
  async reconcileRootAdmin() {},
};

function fakeImageStorage() {
  const uploads = [];
  return {
    uploads,
    seedImageUrl: (slug) =>
      `https://api.example/uploads/event-images/seed/${slug}.webp`,
    async uploadSeedImage(slug, input) {
      uploads.push({ slug, input });
      return { url: this.seedImageUrl(slug) };
    },
  };
}

test("production startup never seeds demo events", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSeedSetting = process.env.SEED_DEMO_DATA;
  process.env.NODE_ENV = "production";
  process.env.SEED_DEMO_DATA = "true";

  try {
    const prisma = fakePrisma();
    const images = fakeImageStorage();
    const service = new EventSeedService(prisma, images, fakeAuth);

    await service.onApplicationBootstrap();

    assert.equal(prisma.records.size, 0);
    assert.equal(images.uploads.length, 0);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSeedSetting === undefined) delete process.env.SEED_DEMO_DATA;
    else process.env.SEED_DEMO_DATA = previousSeedSetting;
  }
});

test("startup repairs existing seed event ownership when demo mode is off", async () => {
  const [definition] = buildSeedEvents(new Date("2026-09-21T15:00:00.000Z"));
  const prisma = fakePrisma([
    {
      id: definition.id,
      name: definition.name,
      ownerId: "usr_previous_owner",
      thumbnailUrl: "https://organizer.example/art.jpg",
      mapLocation: "Custom venue pin",
    },
  ]);
  const previousDemoMode = process.env.PASSMINT_DEMO_MODE;
  delete process.env.PASSMINT_DEMO_MODE;

  try {
    const service = new EventSeedService(prisma, fakeImageStorage(), fakeAuth);
    await service.onApplicationBootstrap();

    assert.equal(prisma.records.get(definition.id).ownerId, "usr_root");
    assert.equal(
      prisma.records.get(definition.id).thumbnailUrl,
      "https://organizer.example/art.jpg",
    );
  } finally {
    if (previousDemoMode === undefined) delete process.env.PASSMINT_DEMO_MODE;
    else process.env.PASSMINT_DEMO_MODE = previousDemoMode;
  }
});

test("seed events are varied, local, and scheduled more than one month ahead", () => {
  const now = new Date("2026-09-21T15:00:00.000Z");
  const oneMonthAhead = new Date(now);
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);
  const events = buildSeedEvents(now);

  assert.equal(events.length, 21);
  assert.equal(new Set(events.map((event) => event.id)).size, events.length);
  assert.ok(events.every((event) => event.startsAt > oneMonthAhead));
  assert.ok(events.every((event) => event.imageFile.endsWith(".jpg")));
  assert.deepEqual(
    new Set(events.map((event) => event.booking?.kind).filter(Boolean)),
    new Set(["bus", "cinema", "event"]),
  );
});

test("seeding twice creates each event once and does not upload artwork again", async () => {
  const prisma = fakePrisma();
  const images = fakeImageStorage();
  const service = new EventSeedService(prisma, images, fakeAuth);
  const now = new Date("2026-09-21T15:00:00.000Z");

  await service.seed(now);
  const uploadsAfterFirstRun = images.uploads.length;
  await service.seed(now);

  assert.equal(prisma.created.length, 21);
  assert.equal(prisma.records.size, 21);
  assert.equal(images.uploads.length, uploadsAfterFirstRun);
  assert.ok(
    [...prisma.records.values()].every((event) => event.ownerId === "usr_root"),
  );
  assert.ok(
    prisma.created.every((event) => event.thumbnailUrl.includes("/uploads/")),
  );
});

test("existing seed events are always assigned to the root administrator", async () => {
  const [legacyDefinition, ownedDefinition] = buildSeedEvents(
    new Date("2026-09-21T15:00:00.000Z"),
  );
  const legacy = {
    id: "evt_legacy",
    name: legacyDefinition.name,
    ownerId: null,
    thumbnailUrl: "https://external.example/old.jpg",
    mapLocation: null,
  };
  const owned = {
    id: "evt_owned",
    name: ownedDefinition.name,
    ownerId: "usr_owner",
    thumbnailUrl: "https://organizer.example/art.jpg",
    mapLocation: "Custom venue pin",
  };
  const prisma = fakePrisma([legacy, owned]);
  const images = fakeImageStorage();
  const service = new EventSeedService(prisma, images, fakeAuth);

  await service.seed(new Date("2026-09-21T15:00:00.000Z"));

  assert.equal(
    prisma.created.some((event) => event.name === legacy.name),
    false,
  );
  assert.equal(
    prisma.created.some((event) => event.name === owned.name),
    false,
  );
  assert.match(prisma.records.get(legacy.id).thumbnailUrl, /\/seed\//);
  assert.equal(
    prisma.records.get(legacy.id).mapLocation,
    legacyDefinition.mapLocation,
  );
  assert.equal(prisma.records.get(legacy.id).ownerId, "usr_root");
  assert.equal(prisma.records.get(owned.id).ownerId, "usr_root");
  assert.equal(
    prisma.records.get(owned.id).thumbnailUrl,
    "https://organizer.example/art.jpg",
  );
});

test("demo seeding refuses to create ownerless events without a root account", async () => {
  const prisma = fakePrisma([], null);
  const service = new EventSeedService(prisma, fakeImageStorage(), fakeAuth);

  await assert.rejects(
    service.seed(new Date("2026-09-21T15:00:00.000Z")),
    /requires an existing account matching ROOT_ADMIN_EMAIL/,
  );
  assert.equal(prisma.records.size, 0);
});
