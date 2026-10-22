// Avvia Vite e poi Electron puntato al dev server.
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import electron from 'electron';

const server = await createServer({ configFile: 'vite.config.ts' });
await server.listen();
const url = server.resolvedUrls.local[0];
console.log(`Vite pronto su ${url}`);

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, FAKEHACKING_DEV_URL: url },
});
child.on('close', async () => {
  await server.close();
  process.exit(0);
});
