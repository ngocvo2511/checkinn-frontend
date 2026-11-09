import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'document-boundary.spec.ts',workers:1,
 outputDir:'test-results/documents',
 use:{baseURL:'http://127.0.0.1:3312',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3312',url:'http://127.0.0.1:3312',timeout:120000,reuseExistingServer:false,
  env:{NEXTAUTH_SECRET:'synthetic-documents-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3312',NEXT_TELEMETRY_DISABLED:'1'}},
});
