import test from 'node:test';
import assert from 'node:assert/strict';
import { socialApi, SocialApiError } from '../lib/api/social.ts';
import { validatePost, stayOptions, shareStayHref, formatMonth } from '../lib/community/rules.ts';

async function mocked(fetcher, run) {
  const previous = globalThis.fetch;
  globalThis.fetch = fetcher;
  try { await run(); } finally { globalThis.fetch = previous; }
}

const hotel = { id: 'h1', name: 'Pine Hill', cityName: 'Đà Lạt', provinceName: 'Lâm Đồng', starRating: 4, coverImageUrl: null };
const post = (overrides = {}) => ({
  id: 'p1', author: { id: 'u1', displayName: 'An N.', avatarUrl: null }, body: 'Hello', rating: null,
  source: 'COMMUNITY', verified: false, placeId: null, place: null, hotelId: null, hotel: null, verifiedStay: false,
  media: [], likeCount: 0, likedByMe: null, commentCount: 0,
  createdAt: '2026-11-12T10:00:00Z', updatedAt: '2026-11-12T10:00:00Z', ...overrides,
});
const input = (overrides = {}) => ({ body: 'Hi', placeId: null, rating: null, mediaIds: [], hotelId: null, stayBookingId: null, ...overrides });

test('the hotel feed is a public read filtered by hotelId', async () => {
  await mocked(async (url, options) => {
    const u = new URL(url);
    assert.equal(u.pathname, '/api/social/posts');
    assert.deepEqual(Object.fromEntries(u.searchParams), { hotelId: 'h1', limit: '5' });
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ items: [post({ hotelId: 'h1', hotel, verifiedStay: true })], nextCursor: null });
  }, async () => {
    const page = await socialApi.feed({ hotelId: 'h1', limit: 5 });
    assert.equal(page.items[0].verifiedStay, true);
    assert.equal(page.items[0].hotel.name, 'Pine Hill');
  });
});

test('a post whose hotel context is gone still renders, but a malformed hotel or badge is rejected', async () => {
  await mocked(async () => Response.json(post({ hotelId: 'h1', hotel: null, verifiedStay: true })), async () => {
    const loaded = await socialApi.post('p1');
    assert.equal(loaded.hotel, null);
  });
  for (const bad of [{ hotel: { name: 'x' } }, { verifiedStay: 'yes' }, { hotelId: 42 }]) {
    await mocked(async () => Response.json(post(bad)), async () => {
      await assert.rejects(socialApi.post('p1'), error => error instanceof SocialApiError && error.code === 'INVALID_RESPONSE');
    });
  }
});

test('the stay link is sent on create, and known server codes become specific messages', async () => {
  await mocked(async (url, options) => {
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), input({ hotelId: 'h1', stayBookingId: 'b1' }));
    return Response.json({ status: 409, error: 'STAY_ALREADY_SHARED', message: 'English detail' }, { status: 409 });
  }, async () => {
    await assert.rejects(socialApi.createPost('t', input({ hotelId: 'h1', stayBookingId: 'b1' })), error => {
      assert.equal(error.code, 'CONFLICT');
      assert.equal(error.serverCode, 'STAY_ALREADY_SHARED');
      assert.match(error.message, /đã được chia sẻ/);
      assert.doesNotMatch(error.message, /English detail/);
      return true;
    });
  });
  await mocked(async () => Response.json({ status: 503, error: 'BOOKING_SERVICE_UNAVAILABLE' }, { status: 503 }), async () => {
    await assert.rejects(socialApi.createPost('t', input()), error => error.serverCode === 'BOOKING_SERVICE_UNAVAILABLE' && error.code === 'UNAVAILABLE');
  });
  await mocked(async () => Response.json({ status: 409, error: 'SOMETHING_ELSE' }, { status: 409 }), async () => {
    await assert.rejects(socialApi.createPost('t', input()), error => error.serverCode === null && error.code === 'CONFLICT');
  });
  await mocked(async () => Response.json({ status: 400, error: 'VALIDATION_FAILED', fields: { stayBookingId: 'x' } }, { status: 400 }), async () => {
    await assert.rejects(socialApi.createPost('t', input()), error => error.fields.stayBookingId === 'Không thể gắn kỳ lưu trú này vào bài viết.');
  });
});

test('invitations are read and dismissed with the bearer token only', async () => {
  const calls = [];
  await mocked(async (url, options) => {
    calls.push([options.method, new URL(url).pathname, options.headers.Authorization]);
    if (options.method === 'POST') return new Response(null, { status: 204 });
    return Response.json({ items: [{ id: 'b1', hotel, checkOutMonth: '2026-11', createdAt: 'x', expiresAt: 'y' }] });
  }, async () => {
    const items = await socialApi.myInvitations('t');
    assert.equal(items[0].hotel.name, 'Pine Hill');
    await socialApi.dismissInvitation('t', 'b/1');
  });
  assert.deepEqual(calls, [
    ['GET', '/api/social/me/stay-invitations', 'Bearer t'],
    ['POST', '/api/social/me/stay-invitations/b%2F1/dismiss', 'Bearer t'],
  ]);
  await mocked(async () => Response.json({ items: [{ id: 'b1' }] }), async () => {
    await assert.rejects(socialApi.myInvitations('t'), error => error.code === 'INVALID_RESPONSE');
  });
  await mocked(async () => new Response(null, { status: 404 }), async () => {
    await assert.rejects(socialApi.dismissInvitation('t', 'b1'), error => error.code === 'NOT_FOUND');
  });
});

test('hotel posts cannot be rated and a stay needs its hotel', () => {
  assert.ok(validatePost(input({ placeId: 'p', rating: 4, hotelId: 'h1' })).rating);
  assert.equal(validatePost(input({ placeId: 'p', rating: 4 })).rating, undefined);
  assert.ok(validatePost(input({ stayBookingId: 'b1' })).stayBookingId);
  assert.deepEqual(validatePost(input({ hotelId: 'h1', stayBookingId: 'b1' })), {});
});

test('only completed stays at the chosen hotel are offered, newest first', () => {
  const bookings = [
    { id: 'old', hotelId: 'h1', status: 'CHECKED_OUT', checkInDate: '2026-01-01', checkOutDate: '2026-01-03' },
    { id: 'new', hotelId: 'h1', status: 'CHECKED_OUT', checkInDate: '2026-11-01', checkOutDate: '2026-11-03' },
    { id: 'other-hotel', hotelId: 'h2', status: 'CHECKED_OUT', checkInDate: '2026-11-01', checkOutDate: '2026-11-03' },
    { id: 'upcoming', hotelId: 'h1', status: 'CONFIRMED', checkInDate: '2026-12-01', checkOutDate: '2026-12-03' },
    { id: 'cancelled', hotelId: 'h1', status: 'CANCELLED', checkInDate: '2026-10-01', checkOutDate: '2026-10-03' },
  ];
  assert.deepEqual(stayOptions(bookings, 'h1'), [
    { bookingId: 'new', label: '01/11/2026 – 03/11/2026' },
    { bookingId: 'old', label: '01/01/2026 – 03/01/2026' },
  ]);
  assert.deepEqual(stayOptions(bookings, null), []);
});

test('an invitation opens the composer with its hotel and stay, and shows only the month', () => {
  assert.equal(shareStayHref({ id: 'b1', hotel: { id: 'h1', name: 'Pine Hill & Spa' } }),
    '/community/new?hotelId=h1&hotelName=Pine+Hill+%26+Spa&stay=b1');
  assert.equal(shareStayHref({ id: 'b1', hotel: null }), null);
  assert.equal(formatMonth('2026-11'), '11/2026');
});
