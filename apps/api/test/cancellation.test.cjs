const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { EventsService } = require('../dist/events/events.service');
const { TicketsService } = require('../dist/tickets/tickets.service');
const { CancelEventDto } = require('../dist/events/dto/cancel-event.dto');
const { validate } = require('class-validator');
const prisma = new PrismaClient();
const events = new EventsService(prisma);
const tickets = new TicketsService(prisma, events);
after(() => prisma.$disconnect());
async function fixture() {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Host', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } });
  const event = await prisma.event.create({ data: { id: randomUUID(), ownerId: owner.id, name: 'Test', description: 'Test', venue: 'Test', startsAt: new Date('2030-01-01'), priceCents: 0, capacity: 10 } });
  return { owner, event };
}
const buy = eventId => tickets.create({ eventId, buyerName: 'Buyer', buyerEmail: `${randomUUID()}@example.com` });
test('only owner or admin can cancel; history is retained and sales/entry stop', async () => {
  const { owner, event } = await fixture();
  const [ticket] = await buy(event.id);
  await assert.rejects(events.cancel(event.id, { id: 'stranger', role: 'user' }), /only cancel events/);
  const cancelled = await events.cancel(event.id, owner);
  assert.equal(cancelled.status, 'cancelled');
  assert.ok(cancelled.cancelledAt);
  assert.equal((await events.findOne(event.id)).status, 'cancelled');
  assert.equal(await prisma.ticket.count({ where: { eventId: event.id } }), 1);
  await assert.rejects(buy(event.id), /cancelled/);
  await assert.rejects(tickets.scan(ticket.code, owner), /cancelled/);
  await assert.rejects(events.update(event.id, { name: 'New' }, owner), /cannot be edited/);
  assert.equal((await events.cancel(event.id, owner)).cancelledAt.getTime(), cancelled.cancelledAt.getTime());
  const another = await fixture();
  assert.equal((await events.cancel(another.event.id, { id: 'admin', role: 'admin' })).status, 'cancelled');
});
test('confirmation must be explicit true', async () => {
  for (const confirm of [undefined, false, 'true']) {
    assert.ok((await validate(Object.assign(new CancelEventDto(), { confirm }))).length);
  }
  assert.equal((await validate(Object.assign(new CancelEventDto(), { confirm: true }))).length, 0);
});
test('cancellation and purchases serialize; no purchases succeed after cancellation', async () => {
  const { owner, event } = await fixture();
  await Promise.allSettled([buy(event.id), events.cancel(event.id, owner), buy(event.id)]);
  assert.equal((await events.findOne(event.id)).status, 'cancelled');
  await assert.rejects(buy(event.id), /cancelled/);
});
