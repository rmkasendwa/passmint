import { PrismaClient } from '@prisma/client';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Automatically initialize an empty schema on first deployment. Never apply schema changes to retained tables.
export async function initializeEmptyDatabase() {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async tx => {
      // Serialize concurrent first starts using this initializer.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(782316645)`;
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
  } finally {
    await prisma.$disconnect();
  }
}
