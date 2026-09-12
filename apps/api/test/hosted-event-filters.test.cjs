const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
runInNewContext(ts.transpileModule(readFileSync(join(__dirname, '../../web/hosted-event-filters.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
const { filterHostedEvents, hostedEventStatus, emptyHostedEventFilters } = exportsObject;
const now = new Date(2030, 4, 10, 12).getTime();
const row = (id, startsAt, extra = {}) => ({ id, name: 'Music night', venue: 'Kampala hall', description: 'Live bands', status: 'published', startsAt, ...extra });
const rows = [
  row('past', new Date(2030, 4, 9, 18).toISOString()),
  row('today', new Date(now).toISOString(), { soldOut: true }),
  row('future', new Date(2030, 4, 11, 18).toISOString(), { name: 'Tech workshop', venue: 'Jinja' }),
  row('draft', new Date(0).toISOString(), { status: 'draft', name: '', description: '' }),
  row('cancelled', new Date(2030, 4, 12, 18).toISOString(), { status: 'cancelled' }),
];
const ids = (filters = {}) => Array.from(filterHostedEvents(rows, { ...emptyHostedEventFilters, ...filters }, now), event => event.id);

test('organizer filters combine case-insensitive search with lifecycle status', () => {
  assert.deepEqual(ids({ status: 'upcoming' }), ['today', 'future']);
  assert.deepEqual(ids({ status: 'past' }), ['past']);
  assert.deepEqual(ids({ status: 'draft' }), ['draft']);
  assert.deepEqual(ids({ status: 'cancelled' }), ['cancelled']);
  assert.deepEqual(ids({ search: '  JINJA  ' }), ['future']);
  assert.deepEqual(ids({ search: 'bands', status: 'past' }), ['past']);
  assert.deepEqual(ids({ search: 'nothing matches' }), []);
  assert.equal(hostedEventStatus(rows[1], now), 'upcoming');
  assert.equal(hostedEventStatus(rows[1], now + 1), 'past');
});

test('local date filters include both endpoints and omit undated drafts', () => {
  assert.deepEqual(ids({ from: '2030-05-10', to: '2030-05-11' }), ['today', 'future']);
  assert.deepEqual(ids({ from: '2030-05-10', to: '2030-05-10' }), ['today']);
  assert.deepEqual(ids({ from: '2030-05-11', to: '2030-05-10' }), []);
  assert.deepEqual(ids({ to: '2030-05-09' }), ['past']);
  assert.deepEqual(ids({ status: 'draft', from: '1970-01-01' }), []);
});

test('sorting is stable, keeps undated drafts last and never changes the source list', () => {
  const before = rows.map(event => event.id);
  assert.deepEqual(ids(), ['past', 'today', 'future', 'cancelled', 'draft']);
  assert.deepEqual(ids({ sort: 'latest' }), ['cancelled', 'future', 'today', 'past', 'draft']);
  assert.deepEqual(rows.map(event => event.id), before);
  assert.deepEqual(Array.from(filterHostedEvents([rows[1], { ...rows[1], id: 'aaa' }], emptyHostedEventFilters, now), event => event.id), ['aaa', 'today']);
});
