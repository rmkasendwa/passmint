const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { EventsService } = require('../dist/events/events.service');
const { TicketsService } = require('../dist/tickets/tickets.service');
const prisma = new PrismaClient();
const events = new EventsService(prisma);
const tickets = new TicketsService(prisma, events);
after(() => prisma.$disconnect());
async function setup(capacity = null) {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Host', email: `${randomUUID()}@example.com`, passwordHash: 'test', role: 'user' } });
  const event = await events.create({ name: 'Categories', description: 'Test', venue: 'Test', startsAt: new Date('2030-01-01'), priceCents: 1500, capacity }, owner);
  return { owner, event };
}
const buy = (eventId, ticketTypeId, quantity = 1) => tickets.create({ eventId, ticketTypeId, quantity, buyerName: 'Buyer', buyerEmail: `${randomUUID()}@example.com` });

test('category inventory serializes concurrent purchases and retains issue-time price/name', async () => {
  const { owner, event } = await setup();
  const type = await events.saveTicketType(event.id, { name: 'VIP', priceCents: 2500, capacity: 2, maxPerOrder: 2 }, owner);
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => buy(event.id, type.id)));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 2);
  const issued = results.find(result => result.status === 'fulfilled').value[0];
  const view = (await events.findOne(event.id)).ticketTypes[0];
  assert.equal(view.remainingCapacity, 0);
  assert.equal(view.available, false);
  await assert.rejects(events.saveTicketType(event.id, { name: 'VIP', priceCents: 2500, capacity: 1 }, owner, type.id), /below active sales/);
  await events.saveTicketType(event.id, { name: 'Renamed', priceCents: 5000 }, owner, type.id);
  const retained = await tickets.findOne(issued.id, owner);
  assert.equal(retained.ticketTypeName, 'VIP');
  assert.equal(retained.unitPriceCents, 2500);
  const scan = await tickets.scan(issued.code, owner);
  assert.equal(scan.ticket.ticketTypeName, 'VIP');
  await prisma.ticket.update({ where: { id: issued.id }, data: { status: 'cancelled' } });
  const [replacement] = await buy(event.id, type.id);
  assert.equal(replacement.ticketTypeName, 'Renamed');
  assert.equal(replacement.unitPriceCents, 5000);
});

test('category limits combine with event capacity and legacy events retain general admission', async () => {
  const { owner, event } = await setup(3);
  const [legacy] = await buy(event.id);
  assert.equal(legacy.ticketTypeName, 'General admission');
  assert.equal(legacy.unitPriceCents, 1500);
  const type = await events.saveTicketType(event.id, { name: 'Free', priceCents: 0, maxPerOrder: 2 }, owner);
  await assert.rejects(buy(event.id), /valid ticket category/);
  await assert.rejects(buy(event.id, type.id, 3), /at most 2/);
  const issued = await buy(event.id, type.id, 2);
  assert.equal(issued[0].unitPriceCents, 0);
  await assert.rejects(buy(event.id, type.id), /Not enough tickets/);
  assert.equal(await prisma.ticket.count({ where: { eventId: event.id } }), 3);
});

test('category scope, windows and event lifecycle are enforced', async () => {
  const { owner, event } = await setup();
  const other = await setup();
  const data = { name: 'Early bird', priceCents: 1000 };
  await assert.rejects(events.saveTicketType(event.id, data, other.owner), /own events/);
  const type = await events.saveTicketType(event.id, { ...data, salesStart: new Date('2090-01-01') }, owner);
  await assert.rejects(buy(other.event.id, type.id), /valid ticket category/);
  await assert.rejects(events.saveTicketType(other.event.id, data, other.owner, type.id), /Ticket type not found/);
  await assert.rejects(buy(event.id, type.id), /sales window/);
  await assert.rejects(events.saveTicketType(event.id, { ...data, salesEnd: new Date('2080-01-01') }, owner, type.id), /after they start/);
  await events.saveTicketType(event.id, { ...data, salesStart: null, salesEnd: new Date('2000-01-01') }, owner, type.id);
  await assert.rejects(buy(event.id, type.id), /sales window/);
  await events.saveTicketType(event.id, { ...data, salesEnd: null }, owner, type.id);
  await buy(event.id, type.id);
  await events.cancel(event.id, owner);
  await assert.rejects(events.saveTicketType(event.id, data, owner), /Cancelled events/);
  assert.equal((await events.findOne(event.id)).ticketTypes[0].available, false);
});
