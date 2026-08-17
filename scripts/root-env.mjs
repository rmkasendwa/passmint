import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const envFile = resolve(root, '.env');

export function loadRootEnv() {
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
  process.env.MINIO_API_PORT ??= '9000';
  process.env.MINIO_CONSOLE_PORT ??= '9001';
  process.env.MINIO_ROOT_USER ??= 'passmint';
  process.env.MINIO_ROOT_PASSWORD ??= 'passmint-dev-secret';
  process.env.S3_BUCKET ??= 'passmint-event-images';
  process.env.S3_REGION ??= 'us-east-1';
  process.env.S3_ACCESS_KEY_ID ??= process.env.MINIO_ROOT_USER;
  process.env.S3_SECRET_ACCESS_KEY ??= process.env.MINIO_ROOT_PASSWORD;
  process.env.S3_ENDPOINT ??= `http://localhost:${process.env.MINIO_API_PORT}`;
  process.env.S3_FORCE_PATH_STYLE ??= 'true';
  process.env.S3_PUBLIC_BASE_URL ??= `http://localhost:${process.env.MINIO_API_PORT}/${process.env.S3_BUCKET}`;
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
}

export function resolveEnvArgs(args) {
  return args.map((arg) =>
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
}
