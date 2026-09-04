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
