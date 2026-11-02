import test from 'node:test';
import assert from 'node:assert/strict';
import { createPointsQuoteLoader, fetchPointsQuote } from '../lib/points-quote.ts';
import { proxyPointsQuote } from '../lib/server/points-quote-proxy.ts';

const input = { userId: 'self', pointsToUse: 900, totalAmount: 1000000 };
const quote = { pointsToUse: 714, discountAmount: 499800, redemptionRate: 700 };
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

test('quote adapter sends current caller token and uses server capped points/rate', async () => {
  const previousFetch = globalThis.fetch, previousWindow = globalThis.window;
  let token = 'first'; const sent = [];
  globalThis.window = { localStorage: { getItem: key => key === 'token' ? token : null }, sessionStorage: { getItem: () => null } };
  globalThis.fetch = async (url, init) => { sent.push({ url, init }); return Response.json(quote); };
  try {
    assert.deepEqual(await fetchPointsQuote(input), quote);
    token = 'second'; await fetchPointsQuote(input);
    assert.equal(sent[0].init.headers.Authorization, 'Bearer first');
    assert.equal(sent[1].init.headers.Authorization, 'Bearer second');
    assert.deepEqual(JSON.parse(sent[0].init.body), { pointsToUse: 900, totalAmount: 1000000 });
    assert.equal(sent[0].url, '/api/loyalty-points/self/quote');
    token = null;
    await assert.rejects(fetchPointsQuote(input), /đăng nhập/);
    assert.equal(sent.length, 2);
  } finally { globalThis.fetch = previousFetch; globalThis.window = previousWindow; }
});

test('invalid or unavailable quotes cannot masquerade as a zero discount', async () => {
  const previousFetch = globalThis.fetch, previousWindow = globalThis.window;
  globalThis.window = { localStorage: { getItem: () => 'token' } };
  try {
    for (const value of [null, { ...quote, pointsToUse: 901 }, { ...quote, discountAmount: 600000 }, { ...quote, redemptionRate: 500 }]) {
      globalThis.fetch = async () => Response.json(value);
      await assert.rejects(fetchPointsQuote(input), /không hợp lệ/);
    }
    globalThis.fetch = async () => Response.json({ message: 'unavailable' }, { status: 503 });
    await assert.rejects(fetchPointsQuote(input), /Không tải được/);
    globalThis.fetch = async () => new Response('invalid json');
    await assert.rejects(fetchPointsQuote(input), /không hợp lệ/);
    globalThis.fetch = async () => { throw new Error('network detail'); };
    await assert.rejects(fetchPointsQuote(input), /Không tải được/);
  } finally { globalThis.fetch = previousFetch; globalThis.window = previousWindow; }
});

test('a replaced quote cannot overwrite newer input, even if abort is ignored', async () => {
  const first = deferred(), second = deferred(); const states = []; let calls = 0;
  const loader = createPointsQuoteLoader(() => ++calls === 1 ? first.promise : second.promise);
  const a = loader.load(input, state => states.push(state));
  const b = loader.load({ ...input, totalAmount: 2000000 }, state => states.push(state));
  assert.equal(states.at(-1).status, 'loading'); assert.equal(states.at(-1).quote, null);
  second.resolve(quote); await b;
  const current = states.at(-1);
  first.resolve({ ...quote, discountAmount: 1 }); await a;
  assert.equal(states.at(-1), current);
});

test('clearing or unmounting cancels old results; errors invalidate the current quote', async () => {
  const pending = deferred(); const states = [];
  const loader = createPointsQuoteLoader(() => pending.promise);
  const request = loader.load(input, state => states.push(state));
  await loader.load({ ...input, pointsToUse: 0 }, state => states.push(state));
  pending.resolve(quote); await request;
  assert.equal(states.at(-1).status, 'idle'); assert.equal(states.at(-1).quote, null);
  const failed = createPointsQuoteLoader(async () => { throw new Error('unavailable'); });
  await failed.load(input, state => states.push(state));
  assert.equal(states.at(-1).status, 'error'); assert.equal(states.at(-1).quote, null);
  const stale = deferred(); const unmounted = createPointsQuoteLoader(() => stale.promise);
  const attempt = unmounted.load(input, state => states.push(state));
  unmounted.cancel(); const count = states.length; stale.resolve(quote); await attempt;
  assert.equal(states.length, count);
});

const request = (body, token = 'caller') => new Request('http://frontend/api/loyalty-points/self/quote', {
  method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}, body: JSON.stringify(body),
});

test('quote proxy forwards caller bearer and strips body identity/service credentials', async () => {
  const previous = globalThis.fetch; let sent;
  globalThis.fetch = async (url, init) => { sent = { url, init }; return Response.json(quote); };
  try {
    const response = await proxyPointsQuote(request({ ...input, userId: 'other', authorization: 'forged' }), 'self', 'http://gateway');
    assert.equal(response.status, 200);
    assert.equal(sent.url, 'http://gateway/api/loyalty-points/self/quote');
    assert.equal(sent.init.headers.Authorization, 'Bearer caller');
    assert.deepEqual(JSON.parse(sent.init.body), { pointsToUse: 900, totalAmount: 1000000 });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { globalThis.fetch = previous; }
});

test('proxy preserves denial/outage and rejects invalid input before contacting backend', async () => {
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ message: 'denied' }, { status: 403 }); };
  try {
    assert.equal((await proxyPointsQuote(request(input, null), 'self')).status, 401);
    assert.equal((await proxyPointsQuote(request({ ...input, pointsToUse: -1 }), 'self')).status, 400);
    assert.equal(calls, 0);
    assert.equal((await proxyPointsQuote(request(input), 'self')).status, 403);
    for (const status of [401, 403, 503]) {
      globalThis.fetch = async () => new Response(null, { status });
      assert.equal((await proxyPointsQuote(request(input), 'self')).status, status);
    }
    globalThis.fetch = async () => Response.json({ message: 'unavailable' }, { status: 503 });
    assert.equal((await proxyPointsQuote(request(input), 'self')).status, 503);
    globalThis.fetch = async () => { throw new Error('network'); };
    assert.equal((await proxyPointsQuote(request(input), 'self')).status, 503);
  } finally { globalThis.fetch = previous; }
});
