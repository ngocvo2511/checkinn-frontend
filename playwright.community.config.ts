import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'community.spec.ts',workers:1,
 outputDir:'test-results/community',
 use:{baseURL:'http://127.0.0.1:3317',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --webpack --hostname 127.0.0.1 --port 3317',url:'http://127.0.0.1:3317',timeout:180000,reuseExistingServer:false,
  env:{NEXT_PUBLIC_COMMUNITY_ENABLED:'true',NEXTAUTH_SECRET:'synthetic-community-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3317',NEXT_TELEMETRY_DISABLED:'1'}},
});
