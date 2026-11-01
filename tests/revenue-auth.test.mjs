import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';

test('report requests use the current login bearer rather than a cached identity', async () => {
  const originalAdapter = axios.defaults.adapter;
  const originalWindow = globalThis.window;
  let token = 'synthetic-first-token';
  const seen = [];
  axios.defaults.adapter = async config => {
    seen.push(config.headers.get('Authorization'));
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  globalThis.window = {
    localStorage: { getItem: key => key === 'token' ? token : null },
    sessionStorage: { getItem: () => null },
  };
  try {
    const { revenueApi } = await import('../lib/api/revenue.ts');
    await revenueApi.getAdminSummary('2026-01-01', '2026-01-02');
    token = 'synthetic-second-token';
    await revenueApi.getOwnerSummary('synthetic-owner', '2026-01-01', '2026-01-02');
    token = null;
    await revenueApi.getAdminSummary('2026-01-01', '2026-01-02');
    assert.deepEqual(seen, ['Bearer synthetic-first-token', 'Bearer synthetic-second-token', undefined]);
  } finally {
    axios.defaults.adapter = originalAdapter;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
