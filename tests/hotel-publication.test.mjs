import test from 'node:test';
import assert from 'node:assert/strict';
import { hotelApi, hotelCoordinates } from '../lib/api/hotels.ts';

test('host preview requires bearer and never falls back to public detail', async () => {
  const previous = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: false, status: 403 };
  };
  try {
    await assert.rejects(hotelApi.getHotelPreview('fixture', ''), /đăng nhập/);
    assert.equal(calls.length, 0);
    await assert.rejects(hotelApi.getHotelPreview('fixture', 'owner-token'), /403/);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/hotels/fixture/preview'));
    assert.equal(calls[0].init.headers.Authorization, 'Bearer owner-token');
    assert.equal(calls[0].init.headers['X-User-Id'], undefined);
    assert.equal(calls[0].init.cache, 'no-store');
  } finally { globalThis.fetch = previous; }
});

test('authorized preview retains pending hotel data for editing', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ id: 'fixture', name: 'Synthetic draft', approvedStatus: 'PENDING', isActive: false }) });
  try {
    const hotel = await hotelApi.getHotelPreview('fixture', 'owner-token');
    assert.equal(hotel.approvedStatus, 'PENDING');
    assert.equal(hotel.isActive, false);
  } finally { globalThis.fetch = previous; }
});


test('city and legacy coordinates are never presented as a hotel location', () => {
  for (const coordinateSource of [undefined, 'UNKNOWN', 'LEGACY_UNVERIFIED', 'CITY_CENTROID'])
    assert.deepEqual(hotelCoordinates({ latitude: 12, longitude: 108, coordinateSource }), {});
  for (const coordinateSource of ['GEOCODED', 'OWNER_PROVIDED'])
    assert.deepEqual(hotelCoordinates({ latitude: 12, longitude: 108, coordinateSource }), { latitude: 12, longitude: 108 });
});

test('room preview sends bearer and rejects forbidden without public fallback', async () => {
  const previous = globalThis.fetch; const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return { ok: false, status: 403 }; };
  try {
    await assert.rejects(hotelApi.getRoomTypePreview('room', ''), /đăng nhập/);
    assert.equal(calls.length, 0);
    await assert.rejects(hotelApi.getRoomTypePreview('room', 'owner-token'), /403/);
    assert.equal(calls.length, 1); assert.ok(calls[0].url.endsWith('/api/v1/room/preview'));
    assert.equal(calls[0].init.headers.Authorization, 'Bearer owner-token');
  } finally { globalThis.fetch = previous; }
});

import { geocodeAddress } from '../lib/mapUtils.ts';

for (const [label, result, accepted] of [
  ['city', { place_rank:16, category:'boundary', lat:'12', lon:'108' }, false],
  ['street', { place_rank:26, category:'highway', lat:'12', lon:'108' }, false],
  ['unknown precision', { lat:'12', lon:'108' }, false],
  ['building', { place_rank:30, category:'building', lat:'12', lon:'108' }, true],
]) {
  test(`address geocoder ${accepted ? 'retains' : 'rejects'} ${label} coordinates`, async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = async url => {
      assert.equal(new URL(url).searchParams.get('format'), 'jsonv2');
      return { ok:true, json:async () => [result] };
    };
    try { assert.deepEqual(await geocodeAddress('Synthetic street','Synthetic city'), accepted ? {latitude:12,longitude:108} : null); }
    finally { globalThis.fetch = previous; }
  });
}

test('verified hotel coordinate source still requires geographic bounds', () => {
  for (const [latitude,longitude] of [[91,108],[12,181],[-91,108],[12,-181],[Infinity,108]]) {
    assert.deepEqual(hotelCoordinates({latitude,longitude,coordinateSource:'OWNER_PROVIDED'}),{});
  }
});
