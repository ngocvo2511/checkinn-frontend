import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'amenity-write.spec.ts',workers:1,outputDir:'test-results/amenities',
 use:{baseURL:'http://127.0.0.1:3315',browserName:'chromium',channel:'msedge',headless:true,screenshot:'only-on-failure'},
 webServer:{command:'npm run dev -- --webpack --hostname 127.0.0.1 --port 3315',url:'http://127.0.0.1:3315/host/hotels/11111111-1111-4111-8111-111111111111',timeout:120000,reuseExistingServer:false,stdout:'pipe',stderr:'pipe',
  env:{NEXTAUTH_SECRET:'synthetic-amenity-browser-secret',NEXTAUTH_URL:'http://127.0.0.1:3315',NEXT_TELEMETRY_DISABLED:'1'}},
});
