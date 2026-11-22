import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Batch 9G F-9E-2: every raw fetch() in core frontend code carries a deadline (an AbortSignal),
// or goes through readJson/bookingFetch which add one. Place/Nearby code is excluded (external owner).
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
function* sources(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) yield full;
  }
}

test('core frontend has no raw fetch without a deadline', () => {
  const unbounded = [];
  for (const dir of ['lib', 'app', 'components', 'hooks']) {
    for (const file of sources(path.join(root, dir))) {
      const rel = path.relative(root, file).replaceAll('\\', '/');
      if (/place|nearby/i.test(rel)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/(?<![\w.])fetch\(/g)) {
        let i = match.index + match[0].length, depth = 1;
        while (i < text.length && depth) { if (text[i] === '(') depth++; else if (text[i] === ')') depth--; i++; }
        const call = text.slice(match.index, i);
        const before = text.slice(Math.max(0, match.index - 400), match.index);
        if (!/signal|AbortSignal/.test(call) && !/signal/.test(before))
          unbounded.push(`${rel}:${text.slice(0, match.index).split('\n').length}`);
      }
    }
  }
  assert.deepEqual(unbounded, []);
});
