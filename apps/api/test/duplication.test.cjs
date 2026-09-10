require('reflect-metadata');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { DuplicateEventDto } = require('../dist/events/dto/duplicate-event.dto');
const { EventsService } = require('../dist/events/events.service');
const prisma = new PrismaClient();
const events = new EventsService(prisma);
after(() => prisma.$disconnect());
async function setup() {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Host', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } });
  const event = await events.create({ name: 'Original', description: 'Description', venue: 'Venue', startsAt: new Date('2030-01-10'), priceCents: 1000, capacity: 20, mapLocation: 'Kampala', thumbnailUrl: 'https://example.com/banner.jpg' }, owner);
  return { owner, event };
}

test('duplication copies settings and categories into an independent private draft', async () => {
  const { owner, event } = await setup();
  const type = await events.saveTicketType(event.id, { name: 'VIP', priceCents: 2000, capacity: 5, maxPerOrder: 2, salesStart: new Date('2030-01-01'), salesEnd: new Date('2030-01-09') }, owner);
  const originalTicket = await prisma.ticket.create({ data: { id: randomUUID(), code: randomUUID(), eventId: event.id, ticketTypeId: type.id, buyerName: 'Buyer', buyerEmail: 'buyer@example.com', status: 'checked_in', checkedInAt: new Date() } });
  await events.cancel(event.id, owner);
  const copy = await events.duplicate(event.id, new Date('2030-02-10'), owner);
  assert.notEqual(copy.id, event.id);
  assert.equal(copy.status, 'draft');
  assert.equal(copy.cancelledAt, null);
  assert.equal(copy.publishAt, null);
  assert.equal(copy.owner.id, owner.id);
  for (const field of ['name', 'description', 'venue', 'capacity', 'priceCents', 'mapLocation', 'thumbnailUrl']) assert.equal(copy[field], event[field]);
  assert.equal(copy.ticketsSold, 0);
  assert.equal(copy.remainingCapacity, 20);
  assert.equal(copy.ticketTypes.length, 1);
  const copiedType = copy.ticketTypes[0];
  assert.notEqual(copiedType.id, type.id);
  assert.equal(copiedType.eventId, copy.id);
  for (const field of ['name', 'priceCents', 'capacity', 'maxPerOrder']) assert.equal(copiedType[field], type[field]);
  assert.equal(copiedType.salesStart.toISOString(), '2030-02-01T00:00:00.000Z');
  assert.equal(copiedType.salesEnd.toISOString(), '2030-02-09T00:00:00.000Z');
  assert.equal(copiedType.ticketsSold, 0);
  assert.equal(copiedType.available, false);
  assert.equal(await prisma.ticket.count({ where: { eventId: copy.id } }), 0);
  assert.deepEqual(await prisma.ticket.findUnique({ where: { id: originalTicket.id } }), originalTicket);
  assert.ok(!(await events.findAll()).some(item => item.id === copy.id));
  await assert.rejects(events.findOne(copy.id), /Event not found/);
  await events.update(copy.id, { name: 'New name' }, owner);
  assert.equal((await events.findOne(event.id)).name, 'Original');
});

test('duplication enforces ownership and future dates, including draft and legacy sources', async () => {
  const { owner, event } = await setup();
  const future = new Date('2030-03-01');
  for (const role of ['user', 'admin']) await assert.rejects(events.duplicate(event.id, future, { id: 'other', role }), /only duplicate events/);
  await assert.rejects(events.duplicate('missing', future, owner), /Event not found/);
  for (const date of [new Date(0), new Date('invalid'), null]) await assert.rejects(events.duplicate(event.id, date, owner), /future date/);
  const draft = await events.createDraft({ name: 'Scheduled', description: 'Description', venue: 'Venue', startsAt: future }, owner);
  await events.update(draft.id, { publishAt: new Date('2030-02-01') }, owner);
  const copy = await events.duplicate(draft.id, new Date('2030-04-01'), owner);
  assert.equal(copy.publishAt, null);
  assert.equal(copy.capacity, null);
  assert.equal(copy.ticketTypes.length, 0);
  assert.equal((await events.findOne(draft.id, owner)).publishAt.toISOString(), '2030-02-01T00:00:00.000Z');
});

test('duplicate request rejects missing, invalid, null and past dates', async () => {
  for (const startsAt of [undefined, null, '', 'invalid', '2000-01-01']) {
    assert.ok((await validate(plainToInstance(DuplicateEventDto, { startsAt }))).length > 0);
  }
  assert.equal((await validate(plainToInstance(DuplicateEventDto, { startsAt: '2030-01-01T00:00:00Z' }))).length, 0);
});
