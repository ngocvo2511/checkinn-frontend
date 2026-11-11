import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';
const id='11111111-1111-4111-8111-111111111111';
for(const value of [null,[null],[{title:' ',amenities:[]}],[{title:'Synthetic',amenities:[null]}],
 [{title:'Synthetic',amenities:[{title:' '}]}],[{title:'x'.repeat(256),amenities:[]}]])
 test('malformed nested amenities are rejected before HTTP',async()=>{
  const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({id,amenityCategories:[]}));};
  try{await assert.rejects(()=>hotelApi.updateAmenities(id,value));assert.equal(calls,0);}finally{globalThis.fetch=original;}
 });
test('cross-hotel amenity ACK cannot replace trusted state',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({id:'22222222-2222-4222-8222-222222222222',amenityCategories:[]}));
 try{await assert.rejects(()=>hotelApi.updateAmenities(id,[]));}finally{globalThis.fetch=original;}
});
test('amenity errors preserve safe status without logging upstream status text',async()=>{
 const original=globalThis.fetch,oldLog=console.error;const logs=[];globalThis.fetch=async()=>({ok:false,status:503,statusText:'synthetic-private-amenity-error'});console.error=(...args)=>logs.push(args);
 try{await assert.rejects(()=>hotelApi.updateAmenities(id,[]),error=>error.status===503&&!error.message.includes('synthetic-private'));assert.equal(logs.length,0);}
 finally{globalThis.fetch=original;console.error=oldLog;}
});

test('explicit empty amenities use the existing wrapper and canonical empty response',async()=>{
 const original=globalThis.fetch;let payload;globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({id,amenityCategories:[]}));};
 try{assert.deepEqual((await hotelApi.updateAmenities(id,[])).amenityCategories,[]);assert.deepEqual(payload,{amenityCategories:[]});}finally{globalThis.fetch=original;}
});
test('optional missing child list remains an empty category without inventing items',async()=>{
 const original=globalThis.fetch;let payload;globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({id,amenityCategories:[{title:'Synthetic',items:[]}]}));};
 try{await hotelApi.updateAmenities(id,[{title:'Synthetic'}]);assert.deepEqual(payload,{amenityCategories:[{title:'Synthetic',amenities:[]}]});}finally{globalThis.fetch=original;}
});
test('request-shape amenities is not accepted as response-shape items',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({id,amenityCategories:[{title:'Synthetic',amenities:[]}]}));
 try{await assert.rejects(()=>hotelApi.updateAmenities(id,[]));}finally{globalThis.fetch=original;}
});
test('404 does not replay a destructive whole-list replacement through another route',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:404});};
 try{await assert.rejects(()=>hotelApi.updateAmenities(id,[]),error=>error.status===404);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('amenity deadline covers body consumption and leaves an unknown result without retry',async(t)=>{
 const original=globalThis.fetch;let consuming=false,calls=0;t.mock.timers.enable({apis:['setTimeout']});
 globalThis.fetch=async(url,options)=>{calls++;return {ok:true,status:200,json:()=>new Promise((resolve,reject)=>{consuming=true;options.signal.addEventListener('abort',()=>reject(new Error('synthetic-private-body')),{once:true});})};};
 try{const failure=assert.rejects(hotelApi.updateAmenities(id,[]),error=>error.status===null&&!error.message.includes('synthetic-private'));await Promise.resolve();await Promise.resolve();assert.equal(consuming,true);t.mock.timers.tick(15000);await failure;assert.equal(calls,1);}finally{globalThis.fetch=original;t.mock.timers.reset();}
});

for(const method of ['getAmenityCategories','getPolicyCategories']){
 test(`${method} distinguishes genuine empty from malformed successful data`,async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>new Response('[]');
  try{assert.deepEqual(await hotelApi[method](),[]);globalThis.fetch=async()=>new Response('null');await assert.rejects(()=>hotelApi[method]());}finally{globalThis.fetch=original;}
 });
 test(`${method} exposes a safe outage instead of silently returning no choices`,async()=>{
  const original=globalThis.fetch,oldLog=console.error;const logs=[];let calls=0;globalThis.fetch=async()=>{calls++;return new Response('synthetic-private-catalog',{status:503});};console.error=(...args)=>logs.push(args);
  try{await assert.rejects(()=>hotelApi[method](),error=>error.status===503&&!error.message.includes('synthetic-private'));assert.equal(calls,1);assert.equal(logs.length,0);}finally{globalThis.fetch=original;console.error=oldLog;}
 });
}

for(const input of [[{title:'Synthetic',items:[{title:'Do not discard me'}]}],[{title:'Synthetic',items:[],amenities:[]}]])test('response-only items field is rejected rather than silently clearing a category',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({id,amenityCategories:[]}));};
 try{await assert.rejects(()=>hotelApi.updateAmenities(id,input));assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
