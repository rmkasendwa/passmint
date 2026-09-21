import { PrismaClient } from '@prisma/client';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const initializerLock = 782316645;

// Initialize an empty schema, then apply narrowly scoped upgrades that are safe for retained data.
export async function initializeEmptyDatabase() {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async tx => {
      // Serialize concurrent first starts using this initializer.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${initializerLock})`;
      const [{ count }] = await tx.$queryRaw`
        SELECT count(*)::int AS count FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
      `;
      if (count !== 0) {
        console.log('Database already contains tables; automatic schema setup skipped.');
        return;
      }
      console.log('Initializing empty database schema.');
      await new Promise((resolvePromise, reject) => {
        const child = spawn(process.execPath, [
          resolve('node_modules/prisma/build/index.js'), 'db', 'push', '--skip-generate',
        ], { stdio: 'inherit', env: process.env });
        const terminate = () => child.kill('SIGTERM');
        process.on('SIGTERM', terminate);
        process.on('SIGINT', terminate);
        const cleanup = () => {
          process.off('SIGTERM', terminate);
          process.off('SIGINT', terminate);
        };
        child.on('error', error => { cleanup(); reject(error); });
        child.on('close', code => {
          cleanup();
          if (code === 0) resolvePromise();
          else reject(new Error('Initial schema setup failed; application was not started.'));
        });
      });
    }, { timeout: 60000, maxWait: 60000 });
    await applyCompatibleDatabaseUpgrades(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function applyCompatibleDatabaseUpgrades(prisma) {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${initializerLock})`;
    const [{ exists }] = await tx.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type type
        JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
        JOIN pg_enum enum_value ON enum_value.enumtypid = type.oid
        WHERE namespace.nspname = current_schema()
          AND type.typname = 'users_role_enum'
          AND enum_value.enumlabel = 'root_admin'
      ) AS exists
    `;
    if (exists) return;
    console.log('Applying compatible database upgrade: root administrator role.');
    await tx.$executeRawUnsafe("ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'root_admin'");
  }, { timeout: 60000, maxWait: 60000 });
}
