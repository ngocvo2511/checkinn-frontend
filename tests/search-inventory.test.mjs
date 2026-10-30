import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfiguredRoomCount } from '../lib/search/inventory.ts';

test('missing or invalid physical inventory remains unknown', () => {
  for (const totalRooms of [undefined, null, 0, -1, 1.5, NaN, Infinity]) {
    assert.equal(getConfiguredRoomCount({ totalRooms }), null);
  }
});

test('legacy fields do not invent physical inventory', () => {
  assert.equal(getConfiguredRoomCount({ roomAmount: 10, availableRooms: 10 }), null);
});

test('explicitly configured positive inventory, including ten, is preserved', () => {
  assert.equal(getConfiguredRoomCount({ totalRooms: 10 }), 10);
  assert.equal(getConfiguredRoomCount({ totalRooms: 1 }), 1);
});
