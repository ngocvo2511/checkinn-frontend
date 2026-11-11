import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'media-write.spec.ts',workers:1,outputDir:'test-results/media-write',
 use:{baseURL:'http://127.0.0.1:3316',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --webpack --hostname 127.0.0.1 --port 3316',url:'http://127.0.0.1:3316/host/hotels/11111111-1111-4111-8111-111111111111',timeout:120000,reuseExistingServer:false,
 env:{NEXTAUTH_SECRET:'synthetic-media-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3316',NEXT_TELEMETRY_DISABLED:'1'}},
});
