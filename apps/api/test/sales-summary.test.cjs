const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { EventsService } = require('../dist/events/events.service');
const prisma = new PrismaClient();
const events = new EventsService(prisma);
after(() => prisma.$disconnect());
async function user(role = 'user') {
  return prisma.user.create({ data: { id: randomUUID(), email: `${randomUUID()}@example.com`, name: 'Host', passwordHash: 'unused', role } });
}
async function event(owner, capacity = 6) {
  return events.create({ name: 'Report', description: 'Test', venue: 'Venue', startsAt: new Date('2031-01-01'), priceCents: 99999, capacity }, owner);
}
function ticket(eventId, unitPriceCents, createdAt, extra = {}) {
  return { id: randomUUID(), code: randomUUID(), eventId, buyerName: 'Private Buyer', buyerEmail: 'private@example.com', unitPriceCents, createdAt: new Date(createdAt), ...extra };
}

test('sales reports preserve price snapshots, cancelled history and UTC daily boundaries', async () => {
  const owner = await user(), other = await user();
  const finite = await event(owner), unlimited = await event(owner, null), cancelled = await event(owner, 99), foreign = await event(other);
  await events.createDraft({ capacity: 50 }, owner);
  await events.cancel(cancelled.id, owner);
  await prisma.ticket.createMany({ data: [
    ticket(finite.id, 2500, '2030-04-01T23:59:59.999Z'),
    ticket(finite.id, 4000, '2030-04-02T00:00:00.000Z', { status: 'checked_in', checkedInAt: new Date('2030-05-01') }),
    ticket(finite.id, 1000, '2030-04-30T23:59:59.999Z', { status: 'cancelled' }),
    ticket(finite.id, 0, '2030-05-01T00:00:00.000Z'),
    ticket(finite.id, null, '2030-05-01T12:00:00.000Z'),
    ticket(unlimited.id, 200, '2030-05-01T12:00:00.000Z'),
    ticket(cancelled.id, 500, '2030-05-01T12:00:00.000Z'),
    ticket(foreign.id, 999999, '2030-05-01T12:00:00.000Z'),
  ] });
  const now = new Date('2030-05-01T23:00:00Z');
  const report = await events.salesSummary(owner, undefined, now);
  assert.equal(report.events, 4);
  assert.equal(report.ticketsIssued, 7);
  assert.equal(report.ticketsCancelled, 1);
  assert.equal(report.checkedIn, 1);
  assert.equal(report.faceValueCents, 8200);
  assert.equal(report.unpricedTickets, 1);
  assert.equal(report.remainingCapacity, 2);
  assert.equal(report.unlimitedEvents, 1);
  assert.equal(report.verifiedRevenueCents, null);
  assert.equal(report.daily.length, 30);
  assert.deepEqual(report.daily[0], { day: '2030-04-02', ticketsIssued: 1 });
  assert.deepEqual(report.daily[29], { day: '2030-05-01', ticketsIssued: 4 });
  assert.equal(report.daily.reduce((sum, day) => sum + day.ticketsIssued, 0), 6);
  assert.equal(report.generatedAt, now.toISOString());
  assert.ok(!JSON.stringify(report).includes('private@example.com'));
  await events.update(finite.id, { priceCents: 10 }, owner);
  const single = await events.salesSummary(owner, finite.id, now);
  assert.equal(single.faceValueCents, 7500);
  assert.equal(single.ticketsIssued, 5);
  assert.equal(single.unlimitedEvents, 0);
  await prisma.ticket.create({ data: ticket(finite.id, 100, '2030-05-01T12:00:00Z') });
  assert.equal((await events.salesSummary(owner, finite.id, now)).ticketsIssued, 6);
});

test('sales access is owner scoped with explicit admin access and private drafts', async () => {
  const owner = await user(), other = await user(), admin = await user('admin');
  const hosted = await event(owner);
  const draft = await events.createDraft({}, owner);
  await assert.rejects(events.salesSummary(other, hosted.id), /own events/);
  await assert.rejects(events.salesSummary(admin, draft.id), /Event not found/);
  await assert.rejects(events.salesSummary(other, draft.id), /Event not found/);
  await assert.rejects(events.salesSummary(owner, 'missing'), /Event not found/);
  assert.equal((await events.salesSummary(admin, hosted.id)).events, 1);
  const empty = await events.salesSummary(admin);
  assert.equal(empty.events, 0);
  assert.equal(empty.faceValueCents, 0);
  assert.equal(empty.remainingCapacity, 0);
  assert.equal(empty.daily.every(day => day.ticketsIssued === 0), true);
  assert.equal((await events.salesSummary(owner, draft.id)).ticketsIssued, 0);
});
