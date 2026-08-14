import { spawn } from 'node:child_process';
import { loadRootEnv, resolveEnvArgs } from './root-env.mjs';

loadRootEnv();

const [command, ...rawArgs] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [...args]');
  process.exit(1);
}

const args = resolveEnvArgs(rawArgs);

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
