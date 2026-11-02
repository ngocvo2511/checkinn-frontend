import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewApi } from '../lib/api/reviews.ts';

for (const method of ['markReviewHelpful', 'markReviewUnhelpful', 'getReviewStats']) {
  test(`${method} sends bearer token for verified identity`, async () => {
    const previous = globalThis.fetch;
    let headers;
    globalThis.fetch = async (_url, init) => {
      headers = init.headers;
      return { ok: true, json: async () => ({}) };
    };
    try {
      await reviewApi[method]('synthetic-review', 'test-token');
      assert.equal(headers.Authorization, 'Bearer test-token');
      assert.equal(headers['X-User-Id'], undefined);
    } finally {
      globalThis.fetch = previous;
    }
  });
}
