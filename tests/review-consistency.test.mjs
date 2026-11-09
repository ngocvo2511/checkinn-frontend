import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewApi} from '../lib/api/reviews.ts';
test('review lookup outage is unknown, never no-review or false eligibility',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('synthetic-private-detail',{status:503});
 try{await assert.rejects(()=>reviewApi.getReviewByBookingId('synthetic-booking','opaque-token'));
  await assert.rejects(()=>reviewApi.hasBookingBeenReviewed('synthetic-booking','opaque-token'));}
 finally{globalThis.fetch=original;}
});
test('review lookup uses bearer authority without locally decoding opaque tokens or sending identity query',async()=>{
 const original=globalThis.fetch;let request;
 globalThis.fetch=async(url,options)=>{request={url,options};return new Response(null,{status:404});};
 try{assert.equal(await reviewApi.getReviewByBookingId('synthetic-booking','opaque-token'),null);
  assert.ok(request);assert.equal(new URL(request.url).searchParams.has('userId'),false);assert.equal(request.options.headers.Authorization,'Bearer opaque-token');}
 finally{globalThis.fetch=original;}
});
test('own-review listing outage is explicit rather than an empty account history',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('synthetic-private-detail',{status:503});
 try{await assert.rejects(()=>reviewApi.getUserReviews('opaque-token'));}finally{globalThis.fetch=original;}
});

for (const status of [400,401,403,409,429,500,503,504]) {
 test(`review lookup HTTP ${status} preserves safe failure rather than absence`,async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>new Response('synthetic-private-detail',{status});
  try {await assert.rejects(()=>reviewApi.getReviewByBookingId('booking','opaque'),error=>error.status===status&&!error.message.includes('synthetic-private'));}
  finally {globalThis.fetch=original;}
 });
}
test('owner read and reply mutations use bearer without decoded identity and never retry failed writes',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return options.method==='GET'
  ?new Response(JSON.stringify({content:[],totalPages:0,totalElements:0})):new Response('synthetic-private',{status:503});};
 try {
  await reviewApi.getOwnerReviews('opaque');await reviewApi.getOwnerHotelReviews('hotel','opaque');
  await assert.rejects(()=>reviewApi.addReviewResponse('review',{content:'Synthetic response'},'opaque'));
  await assert.rejects(()=>reviewApi.updateReviewResponse('reply',{content:'Synthetic update'},'opaque'));
  await assert.rejects(()=>reviewApi.deleteReviewResponse('reply','opaque'));
  assert.equal(calls.length,5);for(const call of calls){assert.equal(call.options.headers.Authorization,'Bearer opaque');assert.equal(call.options.headers['X-User-Id'],undefined);assert.ok(call.options.signal instanceof AbortSignal);}
 }finally{globalThis.fetch=original;}
});
test('own history uses authenticated paged endpoint and validates page metadata',async()=>{
 const original=globalThis.fetch;let url;globalThis.fetch=async(value)=>{url=value;return new Response(JSON.stringify({content:[],totalPages:3,totalElements:21}));};
 try{assert.equal((await reviewApi.getMyReviewPage('opaque',2,10)).totalElements,21);assert.equal(new URL(url).pathname,'/api/v1/reviews/me');assert.equal(new URL(url).searchParams.get('page'),'2');
  globalThis.fetch=async()=>new Response('{}');await assert.rejects(()=>reviewApi.getUserReviews('opaque'));}
 finally{globalThis.fetch=original;}
});
test('nested SDK update ratings are sent as the actual flat REST fields',async()=>{
 const original=globalThis.fetch;let payload;globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({id:'review'}));};
 try{await reviewApi.updateReview('review',{rating:8,ratings:{staff:7,amenities:8,cleanliness:9,comfort:7,valueForMoney:8,location:9}},'opaque');
 assert.deepEqual(payload,{rating:8,staffRating:7,amenitiesRating:8,cleanlinessRating:9,comfortRating:7,valueForMoneyRating:8,locationRating:9});}
 finally{globalThis.fetch=original;}
});
test('missing owner response is distinct from an unavailable response',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(null,{status:404});
 try{assert.equal(await reviewApi.getReviewResponse('review'),null);globalThis.fetch=async()=>new Response('private',{status:503});await assert.rejects(()=>reviewApi.getReviewResponse('review'));}
 finally{globalThis.fetch=original;}
});

test('successful malformed booking lookup cannot masquerade as a missing review',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('null');
 try{await assert.rejects(()=>reviewApi.getReviewByBookingId('booking','opaque'));}
 finally{globalThis.fetch=original;}
});
test('legacy successful empty optional owner reply remains a genuine absence',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('null');
 try{assert.equal(await reviewApi.getReviewResponse('review'),null);}finally{globalThis.fetch=original;}
});
test('review request deadline also cancels a slow response body without replay',async(t)=>{
 const original=globalThis.fetch;let calls=0,consuming=false;
 t.mock.timers.enable({apis:['setTimeout']});
 globalThis.fetch=async(url,options)=>{calls++;return {ok:true,status:200,json:()=>new Promise((resolve,reject)=>{
  consuming=true;options.signal.addEventListener('abort',()=>reject(new Error('synthetic-private-transport')),{once:true});
 })};};
 try{
  const operation=reviewApi.getMyReviewPage('opaque');const failure=assert.rejects(operation,error=>error.status===null&&!error.message.includes('synthetic-private'));
  await Promise.resolve();await Promise.resolve();assert.equal(consuming,true);t.mock.timers.tick(15000);await failure;assert.equal(calls,1);
 }finally{globalThis.fetch=original;t.mock.timers.reset();}
});
