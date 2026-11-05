import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSearchFilters,patchSearchFilters} from '../lib/search/criteria.ts';
import {hotelApi} from '../lib/api/hotels.ts';
test('classification round-trips repeated codes, preserves unknown codes and other filters',()=>{
 const p=new URLSearchParams('cityId=c&minPrice=12&star=4&accommodationTypes=VILLA&accommodationTypes=HOTEL&accommodationTypes=ALIEN');
 assert.deepEqual(parseSearchFilters(p).accommodationTypes,['ALIEN','HOTEL','VILLA']);
 const q=patchSearchFilters(p,{accommodationTypes:[]});
 assert.equal(q.get('minPrice'),'12'); assert.equal(q.get('star'),'4');assert.equal(q.get('cityId'),'c');assert.equal(q.has('accommodationTypes'),false);
});
test('offer adapter sends repeated type parameters to backend',async()=>{
 const prior=global.fetch; let url;
 global.fetch=async(input)=>{url=new URL(input);return new Response('[]')};
 try {await hotelApi.searchHotelOffers({cityId:'c',accommodationTypes:['HOTEL','VILLA']}); assert.deepEqual(url.searchParams.getAll('accommodationTypes'),['HOTEL','VILLA']);} finally {global.fetch=prior;}
});

import {accommodationApi} from '../lib/api/accommodation-types.ts';
test('catalog failure never supplies a fallback category and incomplete catalog is malformed',async()=>{
 const prior=global.fetch;
 try {
  global.fetch=async()=>new Response('{}',{status:503});
  await assert.rejects(()=>accommodationApi.catalog(),e=>e.code==='UPSTREAM');
  global.fetch=async()=>new Response(JSON.stringify([{code:'HOTEL',label:'Hotel'}]));
  await assert.rejects(()=>accommodationApi.catalog(),e=>e.code==='INVALID_RESPONSE');
  global.fetch=async()=>new Response(JSON.stringify([{code:'HOTEL',label:'Hotel'},{code:'VILLA',label:'Villa'},{code:'APARTMENT',label:'Apartment'},{code:'GUEST_HOUSE',label:'Guest House'}]));
  assert.equal((await accommodationApi.catalog())[3].label,'Guest House');
 } finally {global.fetch=prior;}
});
test('review mutations preserve method, body and conflict errors without retries',async()=>{
 const prior=global.fetch;let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{reason:'Reason'});assert.match(url,/specific-request\/reject$/);return new Response('{}',{status:409});};
 try{await assert.rejects(()=>accommodationApi.review('specific-request',false,'Reason'),e=>e.code==='CONFLICT'&&e.status===409);assert.equal(calls,1);}finally{global.fetch=prior;}
});
