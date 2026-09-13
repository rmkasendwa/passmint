const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
const { EventsService } = require('../dist/events/events.service');
const prisma = new PrismaClient();
const events = new EventsService(prisma);
const exported = {};
runInNewContext(ts.transpileModule(readFileSync(join(__dirname, '../../web/scan-metrics-csv.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported });
after(() => prisma.$disconnect());
async function setup(role = 'user') {
  const owner = await prisma.user.create({ data: { id: randomUUID(), name: 'Private Host', email: `${randomUUID()}@example.com`, passwordHash: 'unused', role } });
  const event = await events.create({ name: 'Metrics', description: 'Test', venue: 'Test', startsAt: new Date('2030-01-01'), priceCents: 0, capacity: null }, owner);
  const ticket = await prisma.ticket.create({ data: { id: randomUUID(), eventId: event.id, code: randomUUID(), buyerName: 'Private Buyer', buyerEmail: 'private@example.com' } });
  return { owner, event, ticket };
}

test('scan metrics use UTC boundaries, weighted timings, scoped outcomes and zero-filled hours', async () => {
  const { owner, event, ticket } = await setup();
  const other = await setup();
  const row = (kind, timestamp, decisionDurationMs, ticketId = ticket.id) => ({ id: randomUUID(), ticketId, kind, createdAt: new Date(timestamp), decisionDurationMs, operatorId: owner.id, operatorName: owner.name, device: 'Private browser' });
  await prisma.ticketActivity.createMany({ data: [
    row('accepted', '2030-05-01T23:59:59.999Z', 999),
    row('accepted', '2030-05-02T00:00:00.000Z', 0),
    row('duplicate', '2030-05-02T00:59:59.999Z', 100),
    row('cancelled', '2030-05-02T01:00:00.000Z', 200),
    row('event_cancelled', '2030-05-02T01:01:00.000Z', null),
    row('forbidden', '2030-05-02T01:02:00.000Z', null),
    row('accepted', '2030-05-02T23:59:59.999Z', 300),
    row('accepted', '2030-05-03T00:00:00.000Z', 999),
    row('transferred', '2030-05-02T12:00:00.000Z', 999),
    row('accepted', '2030-05-02T12:00:00.000Z', 999, other.ticket.id),
  ] });
  const report = await events.scanMetrics(event.id, owner, '2030-05-02', new Date('2030-05-03T12:00:00Z'));
  assert.equal(report.attempts, 6);
  assert.equal(report.accepted, 2);
  assert.equal(report.failed, 4);
  assert.equal(report.duplicates, 1);
  assert.equal(report.timedScans, 4);
  assert.equal(report.averageDecisionMs, 150);
  assert.equal(report.peakCheckInHour, '2030-05-02T00:00:00.000Z');
  assert.equal(report.peakCheckIns, 1);
  assert.equal(report.hourly.length, 24);
  assert.equal(report.hourly[0].averageDecisionMs, 50);
  assert.equal(report.hourly[1].averageDecisionMs, 200);
  assert.equal(report.hourly[1].attempts, 3);
  assert.equal(report.hourly[2].averageDecisionMs, null);
  assert.equal(report.hourly[2].attempts, 0);
  assert.equal(report.hourly.reduce((sum, hour) => sum + hour.attempts, 0), report.attempts);
  for (const secret of [ticket.code, owner.name, 'private@example.com', 'Private browser']) assert.ok(!JSON.stringify(report).includes(secret));
  const csv = exported.scanMetricsCsv(report);
  const lines = csv.trimEnd().split('\r\n');
  assert.equal(lines.length, 25);
  assert.match(lines[0], /Failed \(includes duplicates\)/);
  assert.equal(lines[1], '"2030-05-02T00:00:00.000Z","2","1","1","1","2","50","2030-05-03T12:00:00.000Z"');
  assert.equal(lines[3], '"2030-05-02T02:00:00.000Z","0","0","0","0","0","","2030-05-03T12:00:00.000Z"');
  await events.cancel(event.id, owner);
  assert.equal((await events.scanMetrics(event.id, owner, '2030-05-02')).attempts, 6);
});

test('scan metrics enforce ownership, draft privacy and valid dates without inventing legacy timings', async () => {
  const { owner, event, ticket } = await setup();
  const other = await setup(), admin = await setup('admin');
  await assert.rejects(events.scanMetrics(event.id, other.owner), /own events/);
  assert.equal((await events.scanMetrics(event.id, admin.owner)).attempts, 0);
  await assert.rejects(events.scanMetrics('missing', owner), /Event not found/);
  const draft = await events.createDraft({}, owner);
  await assert.rejects(events.scanMetrics(draft.id, admin.owner), /Event not found/);
  assert.equal((await events.scanMetrics(draft.id, owner)).attempts, 0);
  for (const day of ['2030-02-29', '2030-13-01', '2030-01-32', '2030-1-01', '0000-01-01', 'not-a-date']) await assert.rejects(events.scanMetrics(event.id, owner, day), /valid date/);
  const empty = await events.scanMetrics(event.id, owner, undefined, new Date('2032-02-29T23:59:59Z'));
  assert.equal(empty.day, '2032-02-29');
  assert.equal(empty.averageDecisionMs, null);
  assert.equal(empty.peakCheckInHour, null);
  await prisma.ticketActivity.create({ data: { id: randomUUID(), ticketId: ticket.id, kind: 'accepted', operatorId: owner.id, operatorName: owner.name, createdAt: new Date('2032-02-29T12:00:00Z') } });
  const legacy = await events.scanMetrics(event.id, owner, '2032-02-29');
  assert.equal(legacy.attempts, 1);
  assert.equal(legacy.timedScans, 0);
  assert.equal(legacy.averageDecisionMs, null);
});
