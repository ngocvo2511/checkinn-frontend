import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Assemble only ignored build output, matching Next's standalone asset layout.
const standalone = resolve('.next/standalone');
mkdirSync(resolve(standalone, '.next'), { recursive: true });
cpSync(resolve('.next/static'), resolve(standalone, '.next/static'), { recursive: true });
if (existsSync(resolve('public'))) cpSync(resolve('public'), resolve(standalone, 'public'), { recursive: true });
await import(pathToFileURL(resolve(standalone, 'server.js')).href);
