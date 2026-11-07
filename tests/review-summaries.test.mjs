import test from 'node:test';
import assert from 'node:assert/strict';
import {getReviewSummaries} from '../lib/api/review-summaries.ts';
import {guestReviewFacts} from '../lib/search/hotel-facts.ts';
async function mocked(fetcher,run){const previous=globalThis.fetch;globalThis.fetch=fetcher;try{await run();}finally{globalThis.fetch=previous;}}
test('seven summaries use one bounded request without bearer or review details',async()=>{
 let calls=0;
 await mocked(async(url,options)=>{
  calls++;const u=new URL(url);assert.ok(u.pathname.endsWith('/reviews/summaries'));assert.deepEqual(u.searchParams.getAll('hotelIds'),['a','b','c','d','e','f','g']);
  assert.equal(options.headers.Authorization,undefined);
  return Response.json(['a','b','c','d','e','f','g'].map(hotelId=>({hotelId,totalReviews:2,averageRating:8.55})));
 },async()=>{const result=await getReviewSummaries(['a','b','c','d','e','f','g']);assert.equal(result.size,7);assert.equal(calls,1);});
});
test('large lists are deduplicated and processed sequentially in batches of at most 100',async()=>{
 let active=0,maxActive=0,calls=0;const sizes=[];
 await mocked(async url=>{calls++;active++;maxActive=Math.max(active,maxActive);const ids=new URL(url).searchParams.getAll('hotelIds');sizes.push(ids.length);await new Promise(r=>setTimeout(r,5));active--;return Response.json(ids.map(hotelId=>({hotelId,totalReviews:0,averageRating:null})));},async()=>{
  const ids=Array.from({length:205},(_,i)=>String(i));const result=await getReviewSummaries([...ids,...ids]);assert.equal(result.size,205);assert.equal(calls,3);assert.equal(maxActive,1);assert.deepEqual(sizes,[100,100,5]);
 });
});
test('empty input does not request data and invalid identity does not fetch',async()=>{
 await mocked(()=>assert.fail('unexpected fetch'),async()=>{assert.equal((await getReviewSummaries([])).size,0);await assert.rejects(getReviewSummaries(['']),e=>e.code==='VALIDATION');});
});
test('absent summaries stay unknown while an explicit zero count is known no reviews',async()=>{
 await mocked(async()=>Response.json([{hotelId:'a',totalReviews:0,averageRating:null}]),async()=>{const result=await getReviewSummaries(['a','b']);assert.deepEqual(guestReviewFacts(result.get('a')),{rating:null,reviewCount:0});assert.deepEqual(guestReviewFacts(result.get('b')),{rating:null,reviewCount:null});});
});
test('malformed, duplicated and unsolicited summary rows cannot become search facts',async()=>{
 for(const data of [{},[{hotelId:'a',totalReviews:-1,averageRating:null}],[{hotelId:'a',totalReviews:1,averageRating:null}],[{hotelId:'a',totalReviews:0,averageRating:0}],[{hotelId:'a',totalReviews:1,averageRating:11}],[{hotelId:'foreign',totalReviews:1,averageRating:8}],[{hotelId:'a',totalReviews:0,averageRating:null},{hotelId:'a',totalReviews:0,averageRating:null}]])await mocked(async()=>Response.json(data),async()=>assert.rejects(getReviewSummaries(['a']),e=>e.code==='INVALID_RESPONSE'));
});
test('upstream error propagates instead of fabricated empty or zero-rated summaries',async()=>{
 await mocked(async()=>new Response(null,{status:503}),async()=>assert.rejects(getReviewSummaries(['a']),e=>e.code==='UPSTREAM'&&e.status===503));
});
