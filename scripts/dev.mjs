import { spawn } from 'node:child_process';
import net from 'node:net';
import { loadRootEnv, root } from './root-env.mjs';

loadRootEnv();

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: Number(port) });

    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

async function waitForPostgres() {
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    if (await canConnect(host, port)) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Postgres did not become available on ${host}:${port}`);
}

await run('docker', ['compose', 'up', '-d', '--remove-orphans', 'postgres', 'minio']);
await run('docker', ['compose', 'run', '--rm', 'minio-init']);
await waitForPostgres();
await run('pnpm', ['exec', 'prisma', 'generate']);
await run('pnpm', ['exec', 'prisma', 'db', 'push']);

const app = spawn(
  'pnpm',
  [
    '--parallel',
    '--filter',
    '@passmint/api',
    '--filter',
    '@passmint/web',
    'dev',
  ],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

app.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
