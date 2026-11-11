import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'regulation-consistency.spec.ts',workers:1,
 outputDir:'test-results/regulations',
 use:{baseURL:'http://127.0.0.1:3311',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3311',url:'http://127.0.0.1:3311/admin/settings',timeout:120000,reuseExistingServer:false,
  env:{NEXTAUTH_SECRET:'synthetic-regulation-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3311',NEXT_TELEMETRY_DISABLED:'1'}},
});
