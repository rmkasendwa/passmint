import { spawn, spawnSync } from 'node:child_process';
import { loadRootEnv } from './root-env.mjs';

loadRootEnv();

const port = process.env.ADMINER_PORT ?? '8081';
const url = `http://localhost:${port}`;

const compose = spawnSync('docker', ['compose', 'up', '-d', 'postgres', 'adminer'], {
  env: process.env,
  stdio: 'inherit',
});

if (compose.status !== 0) {
  process.exit(compose.status ?? 1);
}

console.log(`Database studio: ${url}`);
console.log('Login with server postgres, user passmint, password passmint, database passmint.');

const opener =
  process.platform === 'darwin'
    ? ['open', [url]]
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];

const child = spawn(opener[0], opener[1], {
  detached: true,
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

child.on('error', () => {
  console.log(`Open ${url} in your browser.`);
});

child.unref();
