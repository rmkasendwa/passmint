const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { EventsService } = require("../dist/events/events.service");
const { TicketsService } = require("../dist/tickets/tickets.service");
const prisma = new PrismaClient();
const events = new EventsService(prisma);
const tickets = new TicketsService(prisma, events);
after(() => prisma.$disconnect());
const owner = { id: "host", role: "admin" };
async function event(capacity) {
  return prisma.event.create({
    data: {
      id: randomUUID(),
      name: "Test",
      description: "Test event",
      venue: "Test venue",
      startsAt: new Date("2030-01-01"),
      priceCents: 0,
      capacity,
    },
  });
}
const buy = (eventId, quantity = 1) =>
  tickets.create({
    eventId,
    quantity,
    buyerName: "Buyer",
    buyerEmail: `${randomUUID()}@example.com`,
  });

test("concurrent purchases never exceed capacity", async () => {
  const e = await event(3);
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () => buy(e.id)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
  assert.equal(await prisma.ticket.count({ where: { eventId: e.id } }), 3);
  const view = await events.findOne(e.id);
  assert.equal(view.remainingCapacity, 0);
  assert.equal(view.soldOut, true);
  await assert.rejects(buy(e.id), /Not enough tickets/);
});
test("unlimited capacity and cancelled inventory", async () => {
  const unlimited = await event(null);
  await buy(unlimited.id, 10);
  assert.equal((await events.findOne(unlimited.id)).remainingCapacity, null);
  const limited = await event(1);
  const [issued] = await buy(limited.id);
  await prisma.ticket.update({
    where: { id: issued.id },
    data: { status: "cancelled" },
  });
  await buy(limited.id);
  assert.equal((await events.findOne(limited.id)).ticketsSold, 1);
});
test("overlarge orders are atomic and capacity cannot drop below sales", async () => {
  const e = await event(2);
  await assert.rejects(buy(e.id, 3), /Not enough tickets/);
  assert.equal(await prisma.ticket.count({ where: { eventId: e.id } }), 0);
  await buy(e.id, 2);
  await assert.rejects(
    events.update(e.id, { capacity: 1 }, owner),
    /Capacity cannot be lower/,
  );
  assert.equal(
    (await events.update(e.id, { capacity: null }, owner)).capacity,
    null,
  );
});
