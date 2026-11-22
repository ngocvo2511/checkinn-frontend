import test from 'node:test';
import assert from 'node:assert/strict';
import { socialApi, SocialApiError } from '../lib/api/social.ts';
import { searchPlaces, getPlacesByIds } from '../lib/api/place-catalog.ts';
import {
  validatePost, validateComment, validateReport, validatePhoto, authorName, authorInitial,
  isPlaceReview, formatRatingAverage, relativeTime,
} from '../lib/community/rules.ts';
import { loginHref, safeNext } from '../lib/community/login.ts';

async function mocked(fetcher, run) {
  const previous = globalThis.fetch;
  globalThis.fetch = fetcher;
  try { await run(); } finally { globalThis.fetch = previous; }
}

const post = (overrides = {}) => ({
  id: 'p1', author: { id: 'u1', displayName: 'An N.', avatarUrl: null }, body: 'Hello', rating: null,
  source: 'COMMUNITY', verified: false, placeId: null, place: null, media: [], likeCount: 0, likedByMe: null,
  commentCount: 0, createdAt: '2026-11-12T10:00:00Z', updatedAt: '2026-11-12T10:00:00Z', ...overrides,
});
const page = (items, nextCursor = null) => ({ items, nextCursor });

test('feed is a public read: no bearer when signed out, query carries place, cursor and limit', async () => {
  await mocked(async (url, options) => {
    const u = new URL(url);
    assert.equal(u.pathname, '/api/social/posts');
    assert.deepEqual(Object.fromEntries(u.searchParams), { placeId: 'place-1', cursor: 'abc', limit: '10' });
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.method, 'GET');
    return Response.json(page([post()], 'next'));
  }, async () => {
    const result = await socialApi.feed({ placeId: 'place-1', cursor: 'abc', limit: 10 });
    assert.equal(result.items.length, 1);
    assert.equal(result.nextCursor, 'next');
  });
});

test('a stale token does not block public browsing: 401 is retried once anonymously', async () => {
  const seen = [];
  await mocked(async (url, options) => {
    seen.push(options.headers.Authorization);
    return options.headers.Authorization ? new Response(null, { status: 401 }) : Response.json(page([post()]));
  }, async () => {
    const result = await socialApi.feed({}, 'expired-token');
    assert.equal(result.items.length, 1);
    assert.deepEqual(seen, ['Bearer expired-token', undefined]);
  });
});

test('signed-in reads are not retried anonymously and mutations are never retried', async () => {
  let calls = 0;
  await mocked(async () => { calls++; return new Response(null, { status: 401 }); }, async () => {
    await assert.rejects(socialApi.myPosts('expired-token'), e => e instanceof SocialApiError && e.code === 'UNAUTHORIZED');
    await assert.rejects(socialApi.like('expired-token', 'p1'), e => e.code === 'UNAUTHORIZED');
    assert.equal(calls, 2);
  });
});

test('community responses must be labelled COMMUNITY and unverified', async () => {
  for (const bad of [post({ source: 'HOTEL' }), post({ verified: true }), post({ rating: 6 }), post({ id: '' }), post({ author: null }), { items: 'x' }]) {
    await mocked(async () => Response.json(Array.isArray(bad.items) || bad.items === 'x' ? bad : page([bad])), async () => {
      await assert.rejects(socialApi.feed(), e => e.code === 'INVALID_RESPONSE');
    });
  }
});

test('create sends the token and only the content fields', async () => {
  await mocked(async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/social/posts');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer t');
    assert.deepEqual(JSON.parse(options.body), { body: 'Hi', placeId: 'pl', rating: 4, mediaIds: ['m1'] });
    return Response.json(post({ rating: 4, placeId: 'pl' }), { status: 201 });
  }, async () => {
    const created = await socialApi.createPost('t', { body: 'Hi', placeId: 'pl', rating: 4, mediaIds: ['m1'] });
    assert.equal(created.rating, 4);
  });
});

test('errors map by status, show Vietnamese field messages and never echo server text', async () => {
  const cases = [[400, 'VALIDATION'], [403, 'FORBIDDEN'], [404, 'NOT_FOUND'], [409, 'CONFLICT'], [429, 'RATE_LIMITED'], [503, 'UNAVAILABLE'], [500, 'UNAVAILABLE'], [418, 'UNKNOWN']];
  for (const [status, code] of cases) {
    await mocked(async () => Response.json({ status, error: 'X', message: 'internal detail <script>' }, { status }), async () => {
      await assert.rejects(socialApi.deletePost('t', 'p1'), e => e.code === code && e.status === status && !e.message.includes('internal'));
    });
  }
  await mocked(async () => Response.json({ status: 400, fields: { placeId: 'The selected place does not exist', evil: 'x' } }, { status: 400 }), async () => {
    await assert.rejects(socialApi.createPost('t', { body: 'x', placeId: 'gone', rating: null, mediaIds: [] }),
      e => e.code === 'VALIDATION' && e.fields.placeId === 'Địa điểm đã chọn không tồn tại.' && !('evil' in e.fields) && e.message === e.fields.placeId);
  });
  await mocked(async () => new Response('<html>bad gateway</html>', { status: 502 }), async () => {
    await assert.rejects(socialApi.feed(), e => e.code === 'UNAVAILABLE');
  });
});

test('network failures and timeouts are distinguished', async () => {
  await mocked(async () => { throw new TypeError('fetch failed'); }, async () => assert.rejects(socialApi.feed(), e => e.code === 'NETWORK'));
  await mocked(async () => { const error = new Error('timed out'); error.name = 'TimeoutError'; throw error; },
    async () => assert.rejects(socialApi.feed(), e => e.code === 'TIMEOUT'));
});

test('like and unlike use idempotent PUT and DELETE on the same path', async () => {
  const methods = [];
  await mocked(async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/social/posts/p%2F1/like');
    methods.push(options.method);
    return Response.json({ likeCount: options.method === 'PUT' ? 1 : 0, likedByMe: options.method === 'PUT' });
  }, async () => {
    assert.deepEqual(await socialApi.like('t', 'p/1'), { likeCount: 1, likedByMe: true });
    assert.deepEqual(await socialApi.unlike('t', 'p/1'), { likeCount: 0, likedByMe: false });
    assert.deepEqual(methods, ['PUT', 'DELETE']);
  });
});

test('photo upload posts multipart without forcing a content type', async () => {
  await mocked(async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/social/media');
    assert.ok(options.body instanceof FormData);
    assert.ok(options.body.get('file') instanceof Blob);
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ id: 'm1', url: 'https://storage.invalid/social/a.jpg' }, { status: 201 });
  }, async () => {
    assert.equal((await socialApi.uploadPhoto('t', new Blob(['x'], { type: 'image/jpeg' }), 'a.jpg')).id, 'm1');
  });
});

test('reports and moderation hit the documented routes', async () => {
  const seen = [];
  await mocked(async (url, options) => {
    seen.push([options.method, new URL(url).pathname, options.body ? JSON.parse(options.body) : null]);
    return new URL(url).pathname.endsWith('/admin/reports') ? Response.json([]) : Response.json({ received: true });
  }, async () => {
    await socialApi.report('t', 'COMMENT', 'c1', 'OTHER', '  rude  ');
    await socialApi.admin.openReports('admin');
    await socialApi.admin.moderate('admin', 'POST', 'p1', 'hide', 'spam');
    await socialApi.admin.moderate('admin', 'COMMENT', 'c1', 'restore');
    await socialApi.admin.closeReports('admin', 'POST', 'p1', 'DISMISSED');
  });
  assert.deepEqual(seen, [
    ['POST', '/api/social/reports', { targetType: 'COMMENT', targetId: 'c1', reason: 'OTHER', note: 'rude' }],
    ['GET', '/api/social/admin/reports', null],
    ['POST', '/api/social/admin/posts/p1/hide', { reason: 'spam' }],
    ['POST', '/api/social/admin/comments/c1/restore', { reason: null }],
    ['POST', '/api/social/admin/reports/close', { targetType: 'POST', targetId: 'p1', outcome: 'DISMISSED' }],
  ]);
});

test('place search validates the keyword locally and the page shape remotely', async () => {
  await mocked(() => assert.fail('unexpected fetch'), async () => {
    await assert.rejects(searchPlaces('   '), e => e.code === 'VALIDATION');
    await assert.rejects(searchPlaces('x'.repeat(101)), e => e.code === 'VALIDATION');
  });
  await mocked(async url => {
    const u = new URL(url);
    assert.equal(u.pathname, '/api/places/search');
    assert.deepEqual(Object.fromEntries(u.searchParams), { q: 'hội an', cursor: 'c1', limit: '5' });
    return Response.json({ items: [{ id: 'pl', name: 'Phố cổ Hội An', category: 'HISTORICAL', latitude: 15.88, longitude: 108.33 }], nextCursor: null });
  }, async () => {
    const result = await searchPlaces('  hội an ', { cursor: 'c1', limit: 5 });
    assert.equal(result.items[0].name, 'Phố cổ Hội An');
  });
  for (const bad of [[], { items: [{ id: 'pl' }], nextCursor: null }, { items: [], nextCursor: 5 }]) {
    await mocked(async () => Response.json(bad), async () => assert.rejects(searchPlaces('a'), e => e.code === 'INVALID_RESPONSE'));
  }
});

test('place batch deduplicates, chunks by 50 and rejects unsolicited rows', async () => {
  const sizes = [];
  const ids = Array.from({ length: 120 }, (_, i) => `id-${i}`);
  await mocked(async url => {
    const batch = new URL(url).searchParams.get('ids').split(',');
    sizes.push(batch.length);
    return Response.json(batch.slice(0, 1).map(id => ({ id, name: 'N', category: 'CAFE', latitude: 1, longitude: 2 })));
  }, async () => {
    const result = await getPlacesByIds([...ids, ...ids, '']);
    assert.deepEqual(sizes, [50, 50, 20]);
    assert.equal(result.size, 3);
  });
  await mocked(() => assert.fail('unexpected fetch'), async () => assert.equal((await getPlacesByIds([])).size, 0));
  await mocked(async () => Response.json([{ id: 'foreign', name: 'N', category: 'CAFE', latitude: 1, longitude: 2 }]),
    async () => assert.rejects(getPlacesByIds(['a']), e => e.code === 'INVALID_RESPONSE'));
});

test('composer rules mirror the server limits', () => {
  const base = { body: 'ok', placeId: null, rating: null, mediaIds: [] };
  assert.deepEqual(validatePost(base), {});
  assert.ok(validatePost({ ...base, body: '   ' }).body);
  assert.ok(validatePost({ ...base, body: 'x'.repeat(5001) }).body);
  assert.deepEqual(validatePost({ ...base, body: 'x'.repeat(5000) }), {});
  assert.ok(validatePost({ ...base, rating: 4 }).rating, 'rating needs a place');
  assert.ok(validatePost({ ...base, placeId: 'pl', rating: 6 }).rating);
  assert.ok(validatePost({ ...base, placeId: 'pl', rating: 2.5 }).rating);
  assert.deepEqual(validatePost({ ...base, placeId: 'pl', rating: 5 }), {});
  assert.ok(validatePost({ ...base, mediaIds: ['1', '2', '3', '4', '5', '6'] }).mediaIds);
});

test('comment, report and photo rules', () => {
  assert.ok(validateComment(' '));
  assert.ok(validateComment('x'.repeat(1001)));
  assert.equal(validateComment('Đẹp quá'), null);
  assert.ok(validateReport(null, ''));
  assert.ok(validateReport('OTHER', '  '));
  assert.ok(validateReport('SPAM', 'x'.repeat(501)));
  assert.equal(validateReport('SPAM', ''), null);
  assert.equal(validateReport('OTHER', 'chi tiết'), null);
  assert.ok(validatePhoto({ type: 'image/gif', size: 10 }));
  assert.ok(validatePhoto({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }));
  assert.ok(validatePhoto({ type: 'image/png', size: 0 }));
  assert.equal(validatePhoto({ type: 'image/webp', size: 5 * 1024 * 1024 }), null);
});

test('display helpers never invent identity or ratings', () => {
  assert.equal(authorName({ id: 'u', displayName: null, avatarUrl: null }), 'Thành viên Checkinn');
  assert.equal(authorName({ id: 'u', displayName: ' An N. ', avatarUrl: null }), 'An N.');
  assert.equal(authorInitial({ id: 'u', displayName: 'đặng', avatarUrl: null }), 'Đ');
  assert.equal(authorInitial({ id: 'u', displayName: '', avatarUrl: null }), 'C');
  assert.equal(isPlaceReview({ placeId: 'pl', rating: 4 }), true);
  assert.equal(isPlaceReview({ placeId: 'pl', rating: null }), false);
  assert.equal(isPlaceReview({ placeId: null, rating: null }), false);
  assert.equal(formatRatingAverage(null), null);
  assert.equal(formatRatingAverage(4.25), '4.3');
  const now = new Date('2026-11-12T10:00:00Z');
  assert.equal(relativeTime('2026-11-12T09:59:40Z', now), 'Vừa xong');
  assert.equal(relativeTime('2026-11-12T09:15:00Z', now), '45 phút trước');
  assert.equal(relativeTime('2026-11-12T07:00:00Z', now), '3 giờ trước');
  assert.equal(relativeTime('2026-11-10T10:00:00Z', now), '2 ngày trước');
  assert.equal(relativeTime('not-a-date', now), '');
});

test("myPost reads the caller's own post, hidden included, with the bearer token", async () => {
  await mocked(async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/social/me/posts/p%2F1');
    assert.equal(options.headers.Authorization, 'Bearer t');
    return Response.json(post({ id: 'p/1', status: 'HIDDEN' }));
  }, async () => {
    const loaded = await socialApi.myPost('t', 'p/1');
    assert.equal(loaded.status, 'HIDDEN');
  });
  await mocked(async () => new Response(null, { status: 404 }), async () => {
    await assert.rejects(socialApi.myPost('t', 'x'), error => error instanceof SocialApiError && error.code === 'NOT_FOUND');
  });
});

test('login links return to the community page and refuse off-site targets', () => {
  assert.equal(loginHref('/community/new?placeId=1&placeName=C%E1%BA%A7u'), '/?login=1&next=%2Fcommunity%2Fnew%3FplaceId%3D1%26placeName%3DC%25E1%25BA%25A7u');
  assert.equal(safeNext('/community/posts/1'), '/community/posts/1');
  for (const unsafe of ['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', 'community', '', null, undefined, '/a\nb']) {
    assert.equal(safeNext(unsafe), null, String(unsafe));
  }
  assert.equal(loginHref('https://evil.example'), '/?login=1');
});
