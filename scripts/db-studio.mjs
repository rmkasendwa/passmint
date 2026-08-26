import { spawn, spawnSync } from 'node:child_process';
import { loadRootEnv } from './root-env.mjs';

loadRootEnv();

const compose = spawnSync('docker', ['compose', 'up', '-d', '--remove-orphans', 'postgres'], {
  env: process.env,
  stdio: 'inherit',
});

if (compose.status !== 0) {
  process.exit(compose.status ?? 1);
}

const studio = spawn('pnpm', ['exec', 'prisma', 'studio'], {
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

studio.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
