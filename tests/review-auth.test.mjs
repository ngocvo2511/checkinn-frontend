import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewApi } from '../lib/api/reviews.ts';

test('createReview sends the booking and bearer without identity headers', async () => {
  const previous = globalThis.fetch;
  const request = { hotelId: 'hotel', bookingId: 'booking', rating: 8, title: 'Review', content: 'Synthetic review' };
  let sent;
  globalThis.fetch = async (_url, init) => {
    sent = init;
    return { ok: true, json: async () => ({ id: 'review' }) };
  };
  try {
    await reviewApi.createReview(request, 'test-token');
    assert.equal(sent.headers.Authorization, 'Bearer test-token');
    assert.equal(sent.headers['X-User-Id'], undefined);
    assert.deepEqual(JSON.parse(sent.body), request);
  } finally { globalThis.fetch = previous; }
});

test('createReview requires a booking before sending and preserves lookup failure', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return { ok: false, text: async () => 'Booking review eligibility unavailable' };
  };
  try {
    await assert.rejects(reviewApi.createReview({ hotelId: 'hotel' }, 'test-token'), /Booking is required/);
    assert.equal(calls, 0);
    await assert.rejects(reviewApi.createReview({ hotelId: 'hotel', bookingId: 'booking' }, 'test-token'), /eligibility unavailable/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previous; }
});

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
