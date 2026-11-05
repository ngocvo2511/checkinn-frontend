import test from 'node:test';
import assert from 'node:assert/strict';
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
