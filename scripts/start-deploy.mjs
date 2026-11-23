import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const portText = process.env.PORT || '3000';
const publicPort = Number(portText);
if (!/^\d+$/.test(portText) || !Number.isInteger(publicPort) || publicPort < 1 || publicPort > 65535) {
  throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
}

const apiPort = publicPort === 3001 ? 3002 : 3001;
const binding = `http://127.0.0.1:${apiPort}/api/v1`;
const origin = process.env.ORBIT_WEB_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${publicPort}`;
const apiDirectory = new URL('../apps/api/', import.meta.url);
const webDirectory = new URL('../apps/web/', import.meta.url);
const require = createRequire(new URL('package.json', webDirectory));
const { DATABASE_URL: databaseUrl, ...webEnv } = process.env;
delete webEnv.API_PORT;
const children = new Set();
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
  }, 8000).unref();
}

function start(label, entry, args, cwd, env) {
  const child = spawn(process.execPath, [entry, ...args], { cwd, env, stdio: 'inherit' });
  children.add(child);
  child.once('error', error => {
    children.delete(child);
    if (!stopping) {
      console.error(`Falha ao iniciar ${label}.`, error.message);
      stop(1);
    }
  });
  child.once('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) {
      console.error(`${label} encerrou inesperadamente (${signal ?? code}).`);
      stop(1);
    }
  });
}

const nextCli = require.resolve('next/dist/bin/next');
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));

start('API', fileURLToPath(new URL('dist/main.js', apiDirectory)), [], apiDirectory, {
  ...process.env, NODE_ENV: 'production', DATABASE_URL: databaseUrl || '',
  PORT: String(apiPort), FRONTEND_URL: origin, ORBIT_API_LOOPBACK: '1',
});
start('Web', nextCli, ['start', '--hostname', '0.0.0.0', '--port', String(publicPort)], webDirectory, {
  ...webEnv, NODE_ENV: 'production', ORBIT_API_URL: binding, ORBIT_WEB_ORIGIN: origin,
});
