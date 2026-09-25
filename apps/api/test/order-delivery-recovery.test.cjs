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

async function event(capacity = 5, priceCents = 0) {
  return prisma.event.create({
    data: {
      id: randomUUID(),
      name: "Order lifecycle test",
      description: "Test event",
      venue: "Test venue",
      startsAt: new Date("2030-01-01"),
      priceCents,
      capacity,
    },
  });
}

test("checkout creates a fulfilled order, payment snapshot and delivery outbox entry", async () => {
  const e = await event(5, 2500);
  const issued = await tickets.create({
    eventId: e.id,
    quantity: 2,
    buyerName: "Paid Buyer",
    buyerEmail: "paid@example.test",
    mobileMoneyNumber: "+256700000000",
  });

  assert.equal(issued.length, 2);
  const order = await prisma.order.findFirstOrThrow({
    where: { eventId: e.id, buyerEmail: "paid@example.test" },
    include: { payments: true, deliveries: true, tickets: true },
  });
  assert.equal(order.status, "fulfilled");
  assert.equal(order.paymentStatus, "authorized");
  assert.equal(order.totalCents, 5000);
  assert.equal(order.payments.length, 1);
  assert.equal(order.tickets.length, 2);
  assert.equal(order.deliveries.length, 1);
  assert.equal(order.deliveries[0].status, "sent");
  assert.match(order.deliveries[0].message, /Admission code/);
});

test("recovery request is neutral and redemption is one-time", async () => {
  const e = await event();
  await tickets.create({
    eventId: e.id,
    buyerName: "Guest Buyer",
    buyerEmail: "guest@example.test",
  });

  const missing = await tickets.requestRecovery({
    buyerEmail: "nobody@example.test",
  });
  const existing = await tickets.requestRecovery({
    buyerEmail: "guest@example.test",
  });
  assert.equal(missing.message, existing.message);

  const delivery = await prisma.ticketDelivery.findFirstOrThrow({
    where: {
      recipient: "guest@example.test",
      subject: { contains: "Recover" },
    },
    orderBy: { createdAt: "desc" },
  });
  const token = delivery.message.match(/recoveryToken=([^ \n]+)/)[1];
  const recovered = await tickets.redeemRecovery(decodeURIComponent(token));
  assert.equal(recovered.length, 1);
  await assert.rejects(
    tickets.redeemRecovery(decodeURIComponent(token)),
    /invalid or expired/,
  );
});

test("active orders reserve inventory until they expire", async () => {
  const e = await event(1);
  await prisma.order.create({
    data: {
      id: "ord_reserved_test",
      reference: "PM-RESERVED-TEST",
      eventId: e.id,
      buyerName: "Reserved",
      buyerEmail: "reserved@example.test",
      ticketTypeName: "General admission",
      quantity: 1,
      unitPriceCents: 0,
      totalCents: 0,
      status: "created",
      paymentStatus: "not_required",
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  await assert.rejects(
    tickets.create({
      eventId: e.id,
      buyerName: "Blocked",
      buyerEmail: "blocked@example.test",
    }),
    /Not enough tickets/,
  );
  await prisma.order.update({
    where: { id: "ord_reserved_test" },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const issued = await tickets.create({
    eventId: e.id,
    buyerName: "Allowed",
    buyerEmail: "allowed@example.test",
  });
  assert.equal(issued.length, 1);
});
