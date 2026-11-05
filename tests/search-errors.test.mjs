import test from 'node:test';
import assert from 'node:assert/strict';
import { hotelApi } from '../lib/api/hotels.ts';
import { availabilityApi } from '../lib/api/availability.ts';
import { cityApi } from '../lib/api/cities.ts';

async function mocked(fetcher, run) {
  const previous = globalThis.fetch;
  globalThis.fetch = fetcher;
  try { await run(); } finally { globalThis.fetch = previous; }
}

test('room description is plain text and never JSON-decoded or fabricated by adapters', async () => {
  for (const description of ['', 'Phòng hướng biển 🌊\nTầng 2', '"quoted"', '<script>plain text</script>', '{"a":"text"}']) {
    const room = {id:'room',name:'Synthetic room',description};
    await mocked(async url => Response.json(String(url).includes('/hotels/hotel')
      ? {id:'hotel',name:'Synthetic hotel',roomTypes:[room]} : room), async () => {
      assert.equal((await hotelApi.getRoomTypeById('room')).description, description);
      assert.equal((await hotelApi.getHotelById('hotel')).roomTypes[0].description, description);
    });
  }
});
for (const [status, code] of [[400,'VALIDATION'],[401,'UNAUTHORIZED'],[403,'FORBIDDEN'],[404,'NOT_FOUND'],[409,'CONFLICT'],[500,'UPSTREAM'],[503,'UPSTREAM']]) {
  test(`search never returns no matches for HTTP ${status}`, async () => {
    await mocked(async () => new Response(null, { status }), async () => {
      for (const run of [() => hotelApi.searchHotelsByName('fixture'), () => hotelApi.searchHotels({cityName:'fixture'}), () => hotelApi.searchHotels({cityId:'fixture'}), () => cityApi.searchLocations('fixture'), () => availabilityApi.checkAvailability('fixture','2026-12-01','2026-12-02')])
        await assert.rejects(run(), error => error.code === code && error.status === status);
    });
  });
}
test('province expansion failure cannot become empty results', async () => {
  await mocked(async url => url.includes('/search/locations') ? Response.json([{id:'province', type:'PROVINCE', name:'Fixture'}]) : new Response(null, {status:503}), async () => {
    await assert.rejects(hotelApi.searchHotels({cityName:'Fixture'}), error => error.code === 'UPSTREAM');
  });
});
test('successful empty searches remain empty', async () => {
  await mocked(async () => Response.json([]), async () => {
    assert.deepEqual(await hotelApi.searchHotelsByName('fixture'), []);
    assert.deepEqual(await hotelApi.searchHotels({cityName:'fixture'}), []);
  });
});
test('malformed hotel/location payloads cannot become no matches', async () => {
  for (const payload of [{}, null, [{id:42}], [{id:'fixture', name:null}]]) {
    await mocked(async () => Response.json(payload), async () => {
      await assert.rejects(hotelApi.searchHotelsByName('fixture'), error => error.code === 'INVALID_RESPONSE');
      await assert.rejects(cityApi.searchLocations('fixture'), error => error.code === 'INVALID_RESPONSE');
    });
  }
});
test('availability validates counters and does not invent sold out', async () => {
  for (const payload of [{}, {available:false}, {available:false,availableRooms:-1}, {available:true,availableRooms:1.5}, {available:true,availableRooms:0}, {available:false,availableRooms:2}]) {
    await mocked(async () => Response.json(payload), async () => {
      await assert.rejects(availabilityApi.checkAvailability('fixture','2026-12-01','2026-12-02'), error => error.code === 'INVALID_RESPONSE');
    });
  }
  await mocked(async () => Response.json({available:false,availableRooms:0}), async () => {
    assert.deepEqual(await availabilityApi.checkAvailability('fixture','2026-12-01','2026-12-02'), {available:false,availableRooms:0});
  });
});
for (const [name, failure, code] of [['network', new TypeError('fetch failed'),'NETWORK'], ['timeout', new DOMException('timeout','TimeoutError'),'TIMEOUT']]) {
  test(`${name} propagates as a stable code`, async () => {
    await mocked(async () => { throw failure; }, async () => {
      await assert.rejects(hotelApi.searchHotelsByName('fixture'), error => error.code === code);
      await assert.rejects(availabilityApi.checkAvailability('fixture','2026-12-01','2026-12-02'), error => error.code === code);
    });
  });
}
test('malformed JSON is an invalid response', async () => {
  await mocked(async () => new Response('{'), async () => {
    await assert.rejects(hotelApi.searchHotelsByName('fixture'), error => error.code === 'INVALID_RESPONSE');
  });
});

test('incomplete nested hotel response fails with a stable code', async () => {
  await mocked(async () => Response.json([{id:'hotel',name:'Fixture',isActive:true,approvedStatus:'APPROVED',policies:{}}]), async () => {
    await assert.rejects(hotelApi.searchHotelsByName('fixture'), error => error.code === 'INVALID_RESPONSE');
  });
});

test('a multi-city search does not silently return a partial list', async () => {
  await mocked(async url => {
    if (url.includes('/search/locations')) return Response.json([{id:'a',type:'CITY',name:'A'},{id:'b',type:'CITY',name:'B'}]);
    return url.endsWith('/a') ? Response.json([]) : new Response(null,{status:503});
  }, async () => {
    await assert.rejects(hotelApi.searchHotels({cityName:'fixture'}), error => error.code === 'UPSTREAM');
  });
});

import { readJson } from '../lib/api/read-request.ts';
for (const phase of ['headers','body']) {
  test(`deadline aborts a stalled ${phase} read`, async () => {
    await mocked(async (_url, init) => {
      const wait = () => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted','AbortError')), {once:true}));
      return phase === 'headers' ? wait() : {ok:true,json:wait};
    }, async () => {
      await assert.rejects(readJson('http://fixture',10), error => error.code === 'TIMEOUT');
    });
  });
}

const offerHotel = {id:'hotel',name:'Fixture',isActive:true,approvedStatus:'APPROVED',lowestPrice:100,roomTypes:[{id:'room'}]};
const canonicalOffer = {roomTypeId:'room',quantity:2,unitPrice:300,totalPerNight:600,availableRooms:2,checkIn:'2026-12-01',checkOut:'2026-12-02',checkedAt:'2026-11-04T00:00:00Z'};
test('offer search sends all hard constraints and retains canonical room and price', async () => {
  await mocked(async url => {
    const query = new URL(url).searchParams;
    for (const [key,value] of Object.entries({rooms:2,adults:4,children:0,minPrice:200,maxPrice:400,cityId:'city'})) assert.equal(query.get(key),String(value));
    return Response.json([{hotel:offerHotel,offer:canonicalOffer}]);
  }, async () => {
    const [result] = await hotelApi.searchHotelOffers({cityId:'city',rooms:2,adults:4,children:0,minPrice:200,maxPrice:400,checkIn:'2026-12-01',checkOut:'2026-12-02'});
    assert.deepEqual(result.matchedOffer, canonicalOffer);
    assert.equal(result.matchedOffer.unitPrice,300);
  });
});
test('offer response cannot fall back to catalog price or configured inventory', async () => {
  for (const offer of [null,{}, {...canonicalOffer,availableRooms:null},{...canonicalOffer,availableRooms:1},{...canonicalOffer,totalPerNight:100},
    {...canonicalOffer,unitPrice:0,totalPerNight:0},{...canonicalOffer,quantity:1,totalPerNight:300}]) {
    await mocked(async () => Response.json([{hotel:offerHotel,offer}]), async () => {
      await assert.rejects(hotelApi.searchHotelOffers({cityId:'city',rooms:2,checkIn:'2026-12-01',checkOut:'2026-12-02'}), error => error.code === 'INVALID_RESPONSE');
    });
  }
});
test('offer endpoint failure propagates without trying legacy search', async () => {
  let calls=0;
  await mocked(async () => { calls++; return new Response(null,{status:503}); }, async () => {
    await assert.rejects(hotelApi.searchHotelOffers({cityId:'city'}), error => error.code === 'UPSTREAM');
    assert.equal(calls,1);
  });
});
