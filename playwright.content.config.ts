import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'hotel-content.spec.ts',workers:1,outputDir:'test-results/content',
 use:{baseURL:'http://127.0.0.1:3314',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3314',url:'http://127.0.0.1:3314',timeout:120000,reuseExistingServer:false,
  env:{NEXTAUTH_SECRET:'synthetic-content-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3314',NEXT_TELEMETRY_DISABLED:'1'}},
});
