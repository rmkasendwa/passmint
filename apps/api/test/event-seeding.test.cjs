const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventSeedService } = require("../dist/events/event-seed.service");
const { buildSeedEvents } = require("../dist/events/seed-data/events");

function fakePrisma(initialEvents = []) {
  const records = new Map(initialEvents.map((event) => [event.id, event]));
  const created = [];
  const updated = [];

  return {
    records,
    created,
    updated,
    event: {
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
          ownerId: null,
          thumbnailUrl: data.thumbnailUrl,
          mapLocation: data.mapLocation,
          startsAt: data.startsAt,
        };
        records.set(event.id, event);
        created.push(data);
        return event;
      },
      async update({ where, data }) {
        const event = { ...records.get(where.id), ...data };
        records.set(where.id, event);
        updated.push({ where, data });
        return event;
      },
    },
  };
}

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
  const service = new EventSeedService(prisma, images);
  const now = new Date("2026-09-21T15:00:00.000Z");

  await service.seed(now);
  const uploadsAfterFirstRun = images.uploads.length;
  await service.seed(now);

  assert.equal(prisma.created.length, 21);
  assert.equal(prisma.records.size, 21);
  assert.equal(images.uploads.length, uploadsAfterFirstRun);
  assert.ok(
    prisma.created.every((event) => event.thumbnailUrl.includes("/uploads/")),
  );
});

test("legacy seed names are reused while organizer-owned events stay untouched", async () => {
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
  const service = new EventSeedService(prisma, images);

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
  assert.deepEqual(prisma.records.get(owned.id), owned);
});
