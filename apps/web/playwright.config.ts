import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:34118';
const database = process.env.ORBIT_TEST_DATABASE_URL || '';
const root = new URL('../../', import.meta.url).pathname;

export default defineConfig({
  testDir: './e2e',
  use: { browserName: 'chromium', baseURL, timezoneId: 'America/Sao_Paulo', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/start-deploy.mjs',
    url: `${baseURL}/api/orbit/health`,
    cwd: root,
    env: { ...process.env, PORT: '34118', ORBIT_WEB_ORIGIN: baseURL, DATABASE_URL: database },
  },
});
