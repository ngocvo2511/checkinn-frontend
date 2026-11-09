import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'review-history.spec.ts',workers:1,
 outputDir:'test-results/reviews',
 use:{baseURL:'http://127.0.0.1:3313',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3313',url:'http://127.0.0.1:3313',timeout:120000,reuseExistingServer:false,
  env:{NEXTAUTH_SECRET:'synthetic-review-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3313',NEXT_TELEMETRY_DISABLED:'1'}},
});
