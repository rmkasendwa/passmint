const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const { runInNewContext } = require('node:vm');
const { PrismaClient } = require('@prisma/client');
const { isWithinSalesWindow } = require('../dist/common/ticket-sales');
const { EventsService } = require('../dist/events/events.service');
const { TicketsService } = require('../dist/tickets/tickets.service');
const clientModule = { exports: {} };
// Exercise the actual checkout helper without introducing a second test framework.
const clientSource = ts.transpileModule(readFileSync(join(__dirname, '../../web/ticket-sales.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
runInNewContext(clientSource, { exports: clientModule.exports });
const { ticketSalesState } = clientModule.exports;
const prisma = new PrismaClient();
const events = new EventsService(prisma);
const tickets = new TicketsService(prisma, events);
after(() => prisma.$disconnect());

test('checkout and server agree at opening and closing boundaries without reloading data', () => {
  const start = new Date('2030-01-01T10:00:00+03:00');
  const end = new Date('2030-01-01T11:00:00+03:00');
  const event = { status: 'published', remainingCapacity: 10, soldOut: false };
  // The loaded response says unavailable; the same data must become available at opening.
  const type = { salesStart: start.toISOString(), salesEnd: end.toISOString(), remainingCapacity: 10, available: false };
  for (const [now, state] of [[+start - 1, 'upcoming'], [+start, 'available'], [+end - 1, 'available'], [+end, 'ended'], [+end + 1, 'ended']]) {
    assert.equal(ticketSalesState(event, type, now), state);
    assert.equal(isWithinSalesWindow({ salesStart: start, salesEnd: end }, new Date(now)), state === 'available');
  }
  assert.equal(ticketSalesState(event, { ...type, available: true }, +end), 'ended');
  assert.equal(ticketSalesState(event, type, null), 'unavailable');
  for (const status of ['draft', 'cancelled']) assert.equal(ticketSalesState({ ...event, status }, type, +start), 'unavailable');
  assert.equal(ticketSalesState({ ...event, remainingCapacity: 0 }, type, +start), 'sold_out');
  assert.equal(ticketSalesState(event, { ...type, remainingCapacity: 0 }, +start), 'sold_out');
  assert.equal(ticketSalesState(event, { ...type, salesStart: 'invalid' }, +start), 'unavailable');
  assert.equal(ticketSalesState(event, { ...type, salesStart: null, salesEnd: null }, +end), 'available');
  assert.equal(isWithinSalesWindow({ salesStart: null, salesEnd: null }, start), true);
});

test('server window edits take effect immediately and cannot bypass event inventory', async () => {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Host', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } });
  const event = await events.create({ name: 'Windows', description: 'Test', venue: 'Venue', startsAt: new Date('2030-01-01'), priceCents: 0, capacity: 1 }, owner);
  const dto = { name: 'Early bird', priceCents: 0, capacity: 10 };
  const type = await events.saveTicketType(event.id, { ...dto, salesStart: new Date('2090-01-01') }, owner);
  const buy = () => tickets.create({ eventId: event.id, ticketTypeId: type.id, quantity: 1, buyerName: 'Guest', buyerEmail: `${randomUUID()}@example.com` });
  assert.equal((await events.findOne(event.id)).ticketTypes[0].available, false);
  await assert.rejects(buy(), /sales window/);
  await events.saveTicketType(event.id, { ...dto, salesStart: null, salesEnd: new Date('2000-01-01') }, owner, type.id);
  assert.equal((await events.findOne(event.id)).ticketTypes[0].available, false);
  await assert.rejects(buy(), /sales window/);
  await events.saveTicketType(event.id, { ...dto, salesEnd: null }, owner, type.id);
  assert.equal((await events.findOne(event.id)).ticketTypes[0].available, true);
  await buy();
  const full = await events.findOne(event.id);
  assert.equal(full.ticketTypes[0].remainingCapacity, 9);
  assert.equal(full.ticketTypes[0].available, false);
  await assert.rejects(buy(), /Not enough tickets/);
});
