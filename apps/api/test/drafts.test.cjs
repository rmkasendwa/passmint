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
test('incomplete drafts remain private until valid publication', async () => {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Host', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } });
  const draft = await events.createDraft({}, owner);
  assert.equal(draft.status, 'draft');
  assert.equal((await events.findOne(draft.id, owner)).id, draft.id);
  assert.ok((await events.findMine(owner.id)).some(e => e.id === draft.id));
  assert.ok(!(await events.findAll()).some(e => e.id === draft.id));
  for (const user of [undefined, { id: 'other', role: 'user' }, { id: 'admin', role: 'admin' }]) {
    await assert.rejects(events.findOne(draft.id, user), /Event not found/);
  }
  await assert.rejects(events.update(draft.id, { name: 'Intrusion' }, { id: 'other', role: 'user' }), /only edit events/);
  await assert.rejects(events.update(draft.id, { status: 'published' }, owner), /before publishing/);
  await assert.rejects(tickets.create({ eventId: draft.id, buyerName: 'Buyer', buyerEmail: 'buyer@example.com' }), /Event not found/);
  assert.equal((await events.update(draft.id, { name: 'Work in progress' }, owner)).status, 'draft');
  await events.update(draft.id, { description: 'Description', venue: 'Venue', startsAt: new Date('2030-01-01') }, owner);
  const published = await events.update(draft.id, { status: 'published' }, owner);
  assert.equal(published.status, 'published');
  assert.ok((await events.findAll()).some(e => e.id === draft.id));
  assert.equal((await events.findOne(draft.id)).id, draft.id);
});
