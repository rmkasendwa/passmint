import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

// Only creates/removes resources named for this run; never uses the developer DB.
const image = process.argv[2] ?? 'passmint:local';
const prefix = `passmint-smoke-${randomBytes(6).toString('hex')}`;
const network = `${prefix}-net`;
const db = `${prefix}-db`;
const app = `${prefix}-app`;
const volume = `${prefix}-uploads`;
const password = randomBytes(24).toString('hex');
const authSecret = randomBytes(32).toString('hex');
const databaseUrl = `postgresql://passmint:${password}@${db}:5432/passmint`;
const resources = { network: false, db: false, app: false, volume: false };
let origin;

function docker(args, allowFailure = false) {
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  if ((result.error || result.status !== 0) && !allowFailure) {
    throw new Error(`Docker ${args[0]} failed: ${result.error?.message ?? result.stderr}`);
  }
  return (args[0] === 'logs' ? `${result.stdout ?? ''}${result.stderr ?? ''}` : result.stdout ?? '').trim();
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label, timeout = 90000) {
  const deadline = Date.now() + timeout;
  do {
    try { if (await check()) return; } catch { /* retry startup */ }
    await pause(1000);
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${label}`);
}
async function request(path, { token, body, method = 'GET' } = {}) {
  const response = await fetch(`${origin}/api${path}`, {
    method, signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
async function startApp() {
  docker(['run', '-d', '--init', '--name', app, '--network', network,
    '-p', '127.0.0.1::8088', '-v', `${volume}:/app/uploads`,
    '-e', `DATABASE_URL=${databaseUrl}`, '-e', `AUTH_SECRET=${authSecret}`, image]);
  resources.app = true;
  await waitFor(() => {
    const ports = JSON.parse(docker(['inspect', '--format', '{{json .NetworkSettings.Ports}}', app]));
    const port = ports?.['8088/tcp']?.[0]?.HostPort;
    if (port) origin = `http://127.0.0.1:${port}`;
    return Boolean(port);
  }, 'published port', 15000);
}

try {
  docker(['network', 'create', network]); resources.network = true;
  docker(['volume', 'create', volume]); resources.volume = true;
  docker(['run', '-d', '--name', db, '--network', network,
    '-e', 'POSTGRES_USER=passmint', '-e', 'POSTGRES_DB=passmint',
    '-e', `POSTGRES_PASSWORD=${password}`, 'postgres:16-alpine']); resources.db = true;
  await waitFor(() => docker(['exec', db, 'pg_isready', '-h', '127.0.0.1', '-U', 'passmint']).includes('accepting connections'), 'PostgreSQL');
  docker(['run', '--rm', '--network', network, '-e', `DATABASE_URL=${databaseUrl}`, image,
    'node', 'node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate']);
  await startApp();
  await waitFor(async () => (await request('/ready')).status === 200, 'web/API/database readiness');
  assert.equal((await request('/health')).body.status, 'ok');
  assert.deepEqual((await request('/events')).body, [], 'production must not seed demo events');
  assert.equal(docker(['exec', app, 'id', '-u']), '1000', 'runtime must not be root');
  const markup = await (await fetch(origin)).text();
  const asset = markup.match(/(?:src|href)="([^\"]*\/_next\/static\/[^\"]+)"/);
  assert.ok(asset, 'homepage contains Next static assets');
  assert.equal((await fetch(new URL(asset[1].replaceAll('&amp;', '&'), origin))).status, 200);
  assert.equal((await fetch(`${origin}/payment/mtn-momo.svg`)).status, 200, 'public assets included');

  const register = async name => {
    const result = await request('/auth/register', { method: 'POST', body: {
      name, email: `${name}@${prefix}.example`, password: 'Test-only-password-42!',
    } });
    assert.equal(result.status, 201); assert.equal(result.body.user.role, 'user');
    return result.body.token;
  };
  const owner = await register('owner');
  const other = await register('other');
  const created = await request('/events', { method: 'POST', token: owner, body: {
    name: prefix, description: 'Container smoke test', venue: 'Test room',
    startsAt: new Date(Date.now() + 86400000).toISOString(), capacity: 2, priceCents: 0,
  } });
  assert.equal(created.status, 201);
  const eventId = created.body.id;
  assert.equal((await request(`/events/${eventId}`, { method: 'PATCH', token: other, body: { name: 'not allowed' } })).status, 403);
  const tickets = await request('/tickets', { method: 'POST', body: {
    eventId, buyerName: 'Guest', buyerEmail: `guest@${prefix}.example`, quantity: 1,
  } });
  assert.equal(tickets.status, 201); assert.match(tickets.body[0].qrCodeDataUrl, /^data:image\/png;base64,/);
  const code = tickets.body[0].code;
  assert.equal((await request('/gate/scan', { method: 'POST', token: other, body: { code } })).status, 403);
  assert.equal((await request('/gate/scan', { method: 'POST', token: owner, body: { code } })).body.result, 'accepted');
  assert.equal((await request('/gate/scan', { method: 'POST', token: owner, body: { code } })).body.result, 'duplicate');

  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=';
  const uploaded = await request('/events/uploads', { method: 'POST', token: owner, body: {
    fileName: 'smoke.png', contentType: 'image/png', dataUrl: `data:image/png;base64,${png}`,
  } });
  assert.equal(uploaded.status, 201);
  assert.match(uploaded.body.url, /^\/api\/uploads\//);
  assert.equal((await fetch(`${origin}${uploaded.body.url}`)).status, 200);
  await waitFor(() => docker(['inspect', '--format', '{{.State.Health.Status}}', app]) === 'healthy', 'Docker health check');

  docker(['stop', '--time', '15', app]);
  assert.equal(docker(['inspect', '--format', '{{.State.ExitCode}}', app]), '0', 'clean signal shutdown');
  docker(['rm', app]); resources.app = false;
  await startApp();
  await waitFor(async () => (await request('/ready')).status === 200, 'recreated container');
  assert.equal((await request(`/events/${eventId}`)).status, 200, 'database survives replacement');
  assert.equal((await fetch(`${origin}${uploaded.body.url}`)).status, 200, 'upload survives replacement');
  assert.equal((await request('/gate/scan', { method: 'POST', token: owner, body: { code } })).body.result, 'duplicate');

  // Stopping one child must fail the container, not leave the other serving forever.
  docker(['exec', app, 'node', '-e', "const fs=require('fs');for(const p of fs.readdirSync('/proc')){if(!/^\\d+$/.test(p))continue;try{const args=fs.readFileSync('/proc/'+p+'/cmdline','utf8').split('\\0');if(args[1]==='/app/apps/api/dist/main.js'){process.kill(Number(p),'SIGTERM');break;}}catch{}}"]);
  await waitFor(() => docker(['inspect', '--format', '{{.State.Running}}', app]) === 'false', 'supervisor to stop after API exit');
  assert.notEqual(docker(['inspect', '--format', '{{.State.ExitCode}}', app]), '0');
  console.log('Docker smoke passed: routing, readiness, assets, ownership, guest tickets, scans, persistence and lifecycle.');
} catch (error) {
  if (resources.app) {
    console.error(docker(['inspect', '--format', '{{json .State}} {{json .NetworkSettings.Ports}}', app], true));
    console.error(docker(['logs', '--tail', '80', app], true));
  }
  throw error;
} finally {
  if (resources.app) docker(['rm', '-f', app], true);
  if (resources.db) docker(['rm', '-f', '-v', db], true);
  if (resources.volume) docker(['volume', 'rm', volume], true);
  if (resources.network) docker(['network', 'rm', network], true);
}
