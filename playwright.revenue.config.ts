import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'revenue-consistency.spec.ts',workers:1,
 outputDir:'test-results/revenue',
 use:{baseURL:'http://127.0.0.1:3310',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3310',url:'http://127.0.0.1:3310/admin/reports',timeout:120000,reuseExistingServer:false,
  env:{NEXTAUTH_SECRET:'synthetic-report-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3310',NEXT_TELEMETRY_DISABLED:'1'}},
});
