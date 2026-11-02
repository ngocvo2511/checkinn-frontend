import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'test-results',
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3300', browserName: 'chromium', channel: 'msedge', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'node tests/browser/start-server.mjs',
    url: 'http://127.0.0.1:3300/booking', reuseExistingServer: false, timeout: 60000,
    env: { HOSTNAME: '127.0.0.1', PORT: '3300', API_INTERNAL_URL: 'http://127.0.0.1:8080', NEXTAUTH_URL: 'http://127.0.0.1:3300', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
