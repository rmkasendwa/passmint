import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(root, '.env');

if (existsSync(envFile)) {
  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

process.env.API_PORT ??= process.env.PORT ?? '3000';
process.env.WEB_PORT ??= '8088';
process.env.POSTGRES_HOST ??= 'localhost';
process.env.POSTGRES_PORT ??= '5432';
process.env.POSTGRES_DB ??= 'passmint';
process.env.POSTGRES_USER ??= 'passmint';
process.env.POSTGRES_PASSWORD ??= 'passmint';
process.env.DATABASE_URL ??=
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}` +
  `@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const localApiOrigin = `http://localhost:${process.env.API_PORT}`;
const localWebOrigin = `http://localhost:${process.env.WEB_PORT}`;

if (
  !process.env.NEXT_PUBLIC_API_URL ||
  (process.env.API_PORT !== '3000' &&
    process.env.NEXT_PUBLIC_API_URL === 'http://localhost:3000') ||
  (process.env.API_PORT !== process.env.WEB_PORT &&
    process.env.NEXT_PUBLIC_API_URL === localWebOrigin)
) {
  process.env.NEXT_PUBLIC_API_URL = localApiOrigin;
}

if (
  !process.env.CORS_ORIGIN ||
  (process.env.WEB_PORT !== '8088' &&
    process.env.CORS_ORIGIN === 'http://localhost:8088')
) {
  process.env.CORS_ORIGIN = localWebOrigin;
}

const [command, ...rawArgs] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [...args]');
  process.exit(1);
}

const args = rawArgs.map((arg) =>
  arg
    .replaceAll(
      '__API_PORT__',
      process.env.API_PORT ?? process.env.PORT ?? '3000',
    )
    .replaceAll(
      '__WEB_PORT__',
      process.env.WEB_PORT ?? process.env.PORT ?? '8088',
    ),
);

const child = spawn(command, args, {
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
