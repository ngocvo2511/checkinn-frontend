import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';

// Batch 9C F1: hotel detail and owner/admin writers are bounded, typed, single-attempt and never echo raw bodies.
async function mocked(fetcher,run){const old=globalThis.fetch;const calls=[];globalThis.fetch=async(url,init={})=>{calls.push({url:String(url),init});return fetcher(url,init);};try{await run(calls);}finally{globalThis.fetch=old;}}
const abort=()=>{const e=new Error('aborted');e.name='AbortError';throw e;};
const envelope=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','X-Request-ID':'req-9c'}});

test('hotel detail read carries a deadline and maps failures to typed codes without statusText',async()=>{
 await mocked(async()=>new Response('<html>Internal Server Error at org.example.Secret</html>',{status:500,statusText:'Secret Upstream'}),async calls=>{
  await assert.rejects(hotelApi.getHotelById('hotel'),e=>e.code==='UPSTREAM'&&!/Secret|500|html/i.test(e.message));
  assert.equal(calls.length,1);assert.ok(calls[0].init.signal instanceof AbortSignal);
 });
 await mocked(async()=>abort(),async()=>assert.rejects(hotelApi.getHotelById('hotel'),e=>e.code==='TIMEOUT'));
 await mocked(async()=>new Response('{}',{status:404}),async()=>assert.rejects(hotelApi.getHotelById('hotel'),e=>e.code==='NOT_FOUND'));
});

test('owner writers are bounded single attempts with safe envelope errors',async()=>{
 const writes=[()=>hotelApi.updateRoomType('room',{name:'Fixture'}),()=>hotelApi.createRoomType({hotelId:'h',name:'n',basePrice:1,capacity:{adults:1,children:0},roomAmount:1}),
  ()=>hotelApi.activateRoomType('room'),()=>hotelApi.deactivateRoomType('room'),()=>hotelApi.updateHotel('hotel',{name:'n',description:'d',starRating:3,cityId:'c',address:{}}),
  ()=>hotelApi.activateHotel('hotel'),()=>hotelApi.deactivateHotel('hotel'),()=>hotelApi.rejectHotel('hotel','note')];
 for(const write of writes){
  await mocked(async()=>envelope(409,{code:'INVENTORY_APPROVAL_REQUIRED',message:'Cần ADMIN duyệt tồn phòng',requestId:'req-9c'}),async calls=>{
   await assert.rejects(write(),e=>e.name==='ApiRequestError'&&e.status===409&&e.code==='INVENTORY_APPROVAL_REQUIRED'&&e.requestId==='req-9c');
   assert.equal(calls.length,1);assert.ok(calls[0].init.signal instanceof AbortSignal);
  });
  await mocked(async()=>abort(),async calls=>{
   await assert.rejects(write(),e=>e.code==='TIMEOUT'&&/Chưa xác định được kết quả/.test(e.message));
   assert.equal(calls.length,1,'a timed-out write is never replayed');
  });
  await mocked(async()=>new Response('<html>stack trace at com.example.Secret</html>',{status:500,statusText:'Leaky'}),async()=>{
   await assert.rejects(write(),e=>e.status===500&&!/Secret|Leaky|html/i.test(e.message));
  });
 }
});

test('submit approval is one Gateway attempt and never replays the write on a 404',async()=>{
 await mocked(async()=>Response.json({id:'hotel',approvedStatus:'PENDING'}),async calls=>{
  assert.equal((await hotelApi.submitHotelApproval('hotel')).approvedStatus,'PENDING');assert.equal(calls.length,1);
  assert.match(calls[0].url,/\/api\/hotel\/hotels\/hotel\/submit-approval$/);
 });
 await mocked(async()=>envelope(404,{code:'NOT_FOUND',message:'Không tìm thấy khách sạn'}),async calls=>{
  await assert.rejects(hotelApi.submitHotelApproval('hotel'),e=>e.status===404&&e.code==='NOT_FOUND');assert.equal(calls.length,1);
 });
 await mocked(async()=>envelope(503,{code:'DEPENDENCY_UNAVAILABLE',message:'x'}),async calls=>{
  await assert.rejects(hotelApi.submitHotelApproval('hotel'),e=>e.code==='DEPENDENCY_UNAVAILABLE');assert.equal(calls.length,1);
 });
 await mocked(async()=>abort(),async calls=>{
  await assert.rejects(hotelApi.submitHotelApproval('hotel'),e=>e.code==='TIMEOUT');assert.equal(calls.length,1);
 });
});

test('admin approval keeps its CONFLICT/FORBIDDEN codes and is bounded',async()=>{
 for(const [status,code] of [[409,'CONFLICT'],[403,'FORBIDDEN'],[500,'UPSTREAM']])
  await mocked(async()=>new Response('',{status}),async calls=>{
   await assert.rejects(hotelApi.approveHotel('hotel',2),e=>e.code===code);assert.ok(calls[0].init.signal instanceof AbortSignal);assert.equal(calls.length,1);
  });
});
