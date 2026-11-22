import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  // Area specs need their own dev server/port (playwright.<area>.config.ts); they abort under this server.
  testIgnore: ['amenity-write.spec.ts', 'hotel-content.spec.ts', 'document-boundary.spec.ts', 'media-write.spec.ts',
    'regulation-consistency.spec.ts', 'revenue-consistency.spec.ts', 'review-history.spec.ts', 'community.spec.ts'],
  outputDir: 'test-results',
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3300', browserName: 'chromium', channel: 'msedge', headless: true, screenshot: 'only-on-failure' },
  webServer: [{ command: "node tests/browser/auth-backend.mjs", url: "http://127.0.0.1:3351/_test/health", reuseExistingServer: false }, {
    command: 'node tests/browser/start-server.mjs',
    url: 'http://127.0.0.1:3300/booking', reuseExistingServer: false, timeout: 60000,
    env: { HOSTNAME: '127.0.0.1', PORT: '3300', API_INTERNAL_URL: 'http://127.0.0.1:3351', NEXTAUTH_SECRET: 'synthetic-browser-session-signing-secret', NEXTAUTH_URL: 'http://127.0.0.1:3300', NEXT_TELEMETRY_DISABLED: '1' },
  }],
});
