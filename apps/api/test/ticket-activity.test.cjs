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
async function setup() {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Host', email: `${randomUUID()}@example.com`, passwordHash: 'test' } });
  const event = await events.create({ name: 'Activity', description: 'Test', venue: 'Test', startsAt: new Date('2030-01-01'), priceCents: 0, capacity: null }, owner);
  const [ticket] = await tickets.create({ eventId: event.id, buyerName: 'Buyer', buyerEmail: `${randomUUID()}@example.com` });
  return { owner, event, ticket };
}

test('concurrent scans retain one acceptance and every duplicate after errors return', async () => {
  const { owner, ticket } = await setup();
  const attempts = await Promise.allSettled(Array.from({ length: 4 }, () => tickets.scan(ticket.code, owner, 'Test browser')));
  assert.equal(attempts.filter(item => item.status === 'fulfilled').length, 1);
  const history = await tickets.activity(ticket.id, owner);
  assert.equal(history.activities.length, 4);
  assert.equal(history.activities.filter(row => row.kind === 'accepted').length, 1);
  assert.equal(history.activities.filter(row => row.kind === 'duplicate').length, 3);
  assert.equal(history.legacyCheckedInAt, null);
  assert.equal(history.hasMore, false);
  for (const row of history.activities) {
    assert.equal(row.operatorId, owner.id);
    assert.equal(row.operatorName, owner.name);
    assert.equal(row.device, 'Test browser');
    assert.ok(row.createdAt >= history.issuedAt);
    assert.ok(!Object.hasOwn(row, 'code'));
  }
});

test('rejected scans persist while unknown codes do not create orphan history', async () => {
  const { owner, event, ticket } = await setup();
  const other = await setup();
  await assert.rejects(tickets.scan(ticket.code, other.owner, 'x'.repeat(600)), /only validate/);
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'cancelled' } });
  await assert.rejects(tickets.scan(ticket.code, owner), /has been cancelled/);
  await events.cancel(event.id, owner);
  await assert.rejects(tickets.scan(ticket.code, owner), /event has been cancelled/);
  const history = await tickets.activity(ticket.id, owner);
  assert.deepEqual(history.activities.map(row => row.kind).sort(), ['cancelled', 'event_cancelled', 'forbidden']);
  assert.equal(history.activities.find(row => row.kind === 'forbidden').device.length, 500);
  await assert.rejects(tickets.scan(randomUUID(), owner), /does not exist/);
  assert.equal(await prisma.ticketActivity.count({ where: { ticketId: ticket.id } }), 3);
  await assert.rejects(tickets.activity(ticket.id, other.owner), /events you manage/);
});

test('history pages are bounded and preserve legacy issuance and check-in timestamps', async () => {
  const { owner, ticket } = await setup();
  const checkedInAt = new Date('2026-09-01T10:00:00Z');
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'checked_in', checkedInAt } });
  await prisma.ticketActivity.createMany({ data: Array.from({ length: 53 }, () => ({ id: randomUUID(), ticketId: ticket.id, kind: 'duplicate', operatorId: owner.id, operatorName: owner.name, createdAt: new Date('2026-09-02T10:00:00Z') })) });
  const first = await tickets.activity(ticket.id, owner);
  const second = await tickets.activity(ticket.id, owner, 2);
  assert.equal(first.activities.length, 50);
  assert.equal(first.hasMore, true);
  assert.equal(second.activities.length, 3);
  assert.equal(second.hasMore, false);
  assert.equal(new Set([...first.activities, ...second.activities].map(row => row.id)).size, 53);
  assert.deepEqual(first.legacyCheckedInAt, checkedInAt);
  for (const page of [0, -1, 1.5, 100001]) await assert.rejects(tickets.activity(ticket.id, owner, page), /Invalid activity page/);
});
