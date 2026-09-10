const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { PrismaClient } = require('@prisma/client');
const { EventsService } = require('../dist/events/events.service');
const { EventsController } = require('../dist/events/events.controller');
const { ImageStorageService } = require('../dist/events/image-storage.service');
const { TicketsService } = require('../dist/tickets/tickets.service');
const { TicketsController } = require('../dist/tickets/tickets.controller');
const { GateController } = require('../dist/gate/gate.controller');
const { PrismaService } = require('../dist/prisma/prisma.service');
const { AuthService } = require('../dist/auth/auth.service');
const { AuthGuard } = require('../dist/auth/auth.guard');
const { OptionalAuthGuard } = require('../dist/auth/optional-auth.guard');
const prisma = new PrismaClient();
const users = {};
let app, url;
before(async () => {
  for (const role of ['host', 'other', 'admin', 'buyer']) users[role] = await prisma.user.create({ data: { id: randomUUID(), name: role, email: `${randomUUID()}@example.com`, passwordHash: 'private-password-hash', role: role === 'admin' ? 'admin' : 'user' } });
  const module = await Test.createTestingModule({
    controllers: [EventsController, TicketsController, GateController],
    providers: [EventsService, TicketsService, AuthGuard, OptionalAuthGuard,
      { provide: PrismaService, useValue: prisma },
      { provide: AuthService, useValue: { verifyToken: async token => users[token] ?? null } },
      { provide: ImageStorageService, useValue: {} },
    ],
  }).compile();
  app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  url = await app.getUrl();
});
after(async () => { await app?.close(); await prisma.$disconnect(); });
async function request(path, method = 'GET', token, body) {
  const response = await fetch(`${url}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
const details = { name: 'Hosted', description: 'Description', venue: 'Venue', startsAt: '2030-01-01T00:00:00Z', priceCents: 0, capacity: 10 };
test('HTTP attendee lists are scoped, searchable and omit ticket credentials', async () => {
  const { body: event } = await request('/events', 'POST', 'host', details);
  const { body: foreign } = await request('/events', 'POST', 'other', details);
  const checkedInAt = new Date('2026-09-01T12:30:00Z');
  const makeTicket = (eventId, buyerName, buyerEmail, extra = {}) => ({ id: randomUUID(), code: randomUUID(), eventId, buyerName, buyerEmail, ...extra });
  await prisma.ticket.createMany({ data: [
    makeTicket(event.id, 'Alice Guest', 'alice@example.com', { ticketTypeName: 'Early bird', status: 'checked_in', checkedInAt }),
    makeTicket(event.id, 'Bob Member', users.buyer.email, { ownerId: users.buyer.id }),
    makeTicket(event.id, 'Cancelled Buyer', 'cancelled@example.com', { status: 'cancelled' }),
    makeTicket(foreign.id, 'Alice Foreign', 'foreign@example.com'),
  ] });
  const path = `/events/${event.id}/attendees`;
  assert.equal((await request(path)).status, 401);
  for (const user of ['other', 'buyer']) assert.equal((await request(path, 'GET', user)).status, 403);
  assert.equal((await request('/events/missing/attendees', 'GET', 'host')).status, 404);
  for (const user of ['host', 'admin']) {
    const result = await request(path, 'GET', user);
    assert.equal(result.status, 200);
    assert.equal(result.body.attendees.length, 3);
    assert.equal(result.body.hasMore, false);
    for (const row of result.body.attendees) assert.deepEqual(Object.keys(row).sort(), ['id', 'buyerName', 'buyerEmail', 'ticketTypeName', 'status', 'createdAt', 'checkedInAt'].sort());
    assert.ok(!JSON.stringify(result.body).includes('foreign@example.com'));
    assert.deepEqual(result.body.attendees.map(row => row.status).sort(), ['cancelled', 'checked_in', 'issued']);
  }
  const matched = await request(`${path}?search=ALICE`, 'GET', 'host');
  assert.equal(matched.body.attendees.length, 1);
  assert.equal(matched.body.attendees[0].ticketTypeName, 'Early bird');
  assert.equal(matched.body.attendees[0].checkedInAt, checkedInAt.toISOString());
  const emailSearch = await request(`${path}?search=${encodeURIComponent(users.buyer.email.toUpperCase())}`, 'GET', 'host');
  assert.equal(emailSearch.body.attendees[0].buyerName, 'Bob Member');
  assert.equal((await request(`${path}?search=no-match`, 'GET', 'host')).body.attendees.length, 0);
  for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=NaN', 'page=100001', 'search=' + 'x'.repeat(101), 'search[a]=b']) assert.equal((await request(`${path}?${query}`, 'GET', 'host')).status, 400);
  await request(`/events/${event.id}/cancel`, 'POST', 'host', { confirm: true });
  assert.equal((await request(path, 'GET', 'host')).body.attendees.length, 3);
  const { body: draft } = await request('/events/drafts', 'POST', 'host', {});
  for (const user of ['other', 'admin']) assert.equal((await request(`/events/${draft.id}/attendees`, 'GET', user)).status, 404);
  assert.equal((await request(`/events/${draft.id}/attendees`, 'GET', 'host')).body.attendees.length, 0);
});

test('HTTP attendee pagination has stable boundaries and applies search before paging', async () => {
  const { body: event } = await request('/events', 'POST', 'host', details);
  await prisma.ticket.createMany({ data: Array.from({ length: 53 }, (_, index) => ({ id: randomUUID(), code: randomUUID(), eventId: event.id, buyerName: `Guest ${index}`, buyerEmail: `${index}@example.com`, createdAt: new Date('2026-09-01') })) });
  const path = `/events/${event.id}/attendees`;
  const first = (await request(path, 'GET', 'host')).body;
  const second = (await request(`${path}?page=2`, 'GET', 'host')).body;
  assert.equal(first.attendees.length, 50);
  assert.equal(first.hasMore, true);
  assert.equal(second.attendees.length, 3);
  assert.equal(second.hasMore, false);
  assert.equal(new Set([...first.attendees, ...second.attendees].map(row => row.id)).size, 53);
  assert.deepEqual((await request(path, 'GET', 'host')).body, first);
  assert.equal((await request(`${path}?search=Guest%2052`, 'GET', 'host')).body.attendees.length, 1);
  assert.equal((await request(`${path}?page=3`, 'GET', 'host')).body.attendees.length, 0);
});

test('HTTP duplication requires the owner and a valid future date', async () => {
  const { body: event } = await request('/events', 'POST', 'host', details);
  const path = `/events/${event.id}/duplicate`;
  const body = { startsAt: '2030-02-01T00:00:00Z' };
  assert.equal((await request(path, 'POST', undefined, body)).status, 401);
  for (const token of ['other', 'admin']) assert.equal((await request(path, 'POST', token, body)).status, 403);
  for (const invalid of [{}, { startsAt: null }, { startsAt: 'invalid' }, { startsAt: '2000-01-01' }, { ...body, ownerId: users.other.id }]) {
    assert.equal((await request(path, 'POST', 'host', invalid)).status, 400);
  }
  const copy = await request(path, 'POST', 'host', body);
  assert.equal(copy.status, 201);
  assert.equal(copy.body.status, 'draft');
  assert.notEqual(copy.body.id, event.id);
});
test('HTTP ticket-category validation and private draft ownership', async () => {
  const { body: event } = await request('/events/drafts', 'POST', 'host', details);
  const path = `/events/${event.id}/ticket-types`;
  const category = { name: 'VIP', priceCents: 2500 };
  assert.equal((await request(path, 'POST', undefined, category)).status, 401);
  assert.equal((await request(path, 'POST', 'other', category)).status, 403);
  assert.equal((await request(path, 'POST', 'admin', category)).status, 403);
  for (const invalid of [{ ...category, priceCents: -1 }, { ...category, maxPerOrder: null }, { ...category, maxPerOrder: 101 }, { ...category, capacity: 0 }, { ...category, salesStart: 'invalid' }]) {
    assert.equal((await request(path, 'POST', 'host', invalid)).status, 400);
  }
  const created = await request(path, 'POST', 'host', category);
  assert.equal(created.status, 201);
  const purchase = { eventId: event.id, ticketTypeId: created.body.id, buyerName: 'Guest', buyerEmail: `${randomUUID()}@example.com` };
  assert.equal((await request('/tickets', 'POST', undefined, purchase)).status, 404);
  assert.equal((await request(`/events/${event.id}`, 'PATCH', 'host', { status: 'published' })).status, 200);
  const issued = await request('/tickets', 'POST', undefined, purchase);
  assert.equal(issued.status, 201);
  assert.equal(issued.body[0].ticketTypeName, 'VIP');
});
test('HTTP authentication, ownership and admin permissions', async () => {
  assert.equal((await request('/events', 'POST', undefined, details)).status, 401);
  assert.equal((await request('/events', 'POST', 'invalid', details)).status, 401);
  const created = await request('/events', 'POST', 'host', details);
  assert.equal(created.status, 201);
  assert.equal(created.body.owner.id, users.host.id);
  assert.deepEqual(Object.keys(created.body.owner).sort(), ['id', 'name']);
  const id = created.body.id;
  assert.equal((await request(`/events/${id}`, 'PATCH', 'other', { name: 'Hijacked' })).status, 403);
  assert.equal((await request(`/events/${id}`, 'PATCH', 'host', { name: 'Updated' })).status, 200);
  assert.equal((await request(`/events/${id}`, 'PATCH', 'admin', { name: 'Admin update' })).status, 200);
  assert.equal((await request(`/events/${id}/cancel`, 'POST', 'other', { confirm: true })).status, 403);
  const purchase = await request('/tickets', 'POST', 'buyer', { eventId: id, buyerName: 'Buyer', buyerEmail: users.buyer.email });
  assert.equal(purchase.status, 201);
  const ticket = purchase.body[0];
  assert.equal((await request(`/tickets/${ticket.id}`)).status, 401);
  assert.equal((await request(`/tickets/${ticket.id}`, 'GET', 'other')).status, 403);
  for (const token of ['host', 'admin', 'buyer']) assert.equal((await request(`/tickets/${ticket.id}`, 'GET', token)).status, 200);
  assert.equal((await request('/gate/scan', 'POST', 'other', { code: ticket.code })).status, 403);
  const scans = await Promise.all(['host', 'admin'].map(token => request('/gate/scan', 'POST', token, { code: ticket.code })));
  assert.deepEqual(scans.map(r => r.status).sort(), [201, 409]);
  assert.ok(!JSON.stringify(scans).includes('passwordHash'));
  assert.ok(!JSON.stringify(scans).includes('private-password-hash'));
});
