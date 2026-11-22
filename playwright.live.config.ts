import { defineConfig } from '@playwright/test';

// Batch 9G (STD-028): NON-intercepted browser smoke against the disposable canonical stack (Gateway 127.0.0.1:58080).
// Run only through checkinn/docker/canonical-smoke.py (it creates the fixture and passes CANONICAL_LIVE_FIXTURE).
// Origin http://127.0.0.1:3000 on purpose: in Batch 9G booking-service rejected it (F-9G-1); since 9H every
// service accepts the same browser origins as the Gateway, so this run proves the fix end to end.
const api = 'http://127.0.0.1:58080';
export default defineConfig({
  testDir: './tests/browser-live',
  outputDir: 'test-results/live',
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', channel: 'msedge', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev -- --webpack --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000/booking',
    timeout: 180000,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_API_BASE_URL: api, API_INTERNAL_URL: api, NEXTAUTH_SECRET: 'synthetic-live-browser-secret',
      NEXTAUTH_URL: 'http://127.0.0.1:3000', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
