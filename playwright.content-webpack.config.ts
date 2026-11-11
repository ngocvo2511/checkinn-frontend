import {defineConfig} from '@playwright/test';
import base from './playwright.content.config';

const server=base.webServer;
if(!server||Array.isArray(server))throw new Error('Expected one content development server');

// Same components and assertions; supported Next bundler for the local Turbopack stall.
export default defineConfig({...base,webServer:{...server,
 command:'npm run dev -- --webpack --hostname 127.0.0.1 --port 3314',
 url:'http://127.0.0.1:3314/host/hotels/11111111-1111-4111-8111-111111111111',
}});
