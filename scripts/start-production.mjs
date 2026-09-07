import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Run compiled processes directly: development env loaders must not inject credentials.
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32 ||
    /^(replace-|passmint-dev)/.test(process.env.AUTH_SECRET)) {
  throw new Error('Set AUTH_SECRET to a unique random secret of at least 32 characters');
}

const root = process.cwd();
const webPort = process.env.PORT ?? process.env.WEB_PORT ?? '8088';
if (!/^\d+$/.test(webPort) || Number(webPort) < 1 || Number(webPort) > 65535 || Number(webPort) === 3000) {
  throw new Error('Web PORT must be 1–65535 and different from the internal API port 3000');
}
const env = { ...process.env, NODE_ENV: 'production' };
let stopping = false;
let exitCode = 0;
const children = new Set();
let killTimer;

function stop(code) {
  if (stopping) return;
  stopping = true;
  exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  killTimer = setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
  }, 10_000);
  killTimer.unref();
  if (children.size === 0) process.exit(exitCode);
}

function start(name, args, options) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', ...options });
  children.add(child);
  child.on('error', () => {
    console.error(`${name} failed to start`);
    stop(1);
  });
  child.on('close', (code, signal) => {
    children.delete(child);
    if (!stopping) {
      console.error(`${name} stopped unexpectedly (code ${code}, signal ${signal})`);
      stop(code || 1);
    }
    if (children.size === 0) {
      clearTimeout(killTimer);
      process.exit(exitCode);
    }
  });
}

process.on('SIGTERM', () => stop(0));
process.on('SIGINT', () => stop(0));

start('API', [resolve(root, 'apps/api/dist/main.js')], {
  cwd: root,
  env: { ...env, PORT: '3000', API_PORT: '3000', API_HOST: '127.0.0.1',
    LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR ?? '/app/uploads',
    PUBLIC_API_URL: process.env.PUBLIC_API_URL ?? '/api' },
});
start('Web', [resolve(root, 'apps/web/node_modules/next/dist/bin/next'), 'start', '--hostname', '0.0.0.0', '--port', webPort], {
  cwd: resolve(root, 'apps/web'),
  env: { ...env, PORT: webPort, API_INTERNAL_URL: 'http://127.0.0.1:3000' },
});
