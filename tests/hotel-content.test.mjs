import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';
const id='11111111-1111-4111-8111-111111111111';
for(const [method,body] of [
 ['updatePolicies',[{category:'CHECK_IN',content:''}]],
 ['updatePolicies',[null]],
 ['updateQuestions',[{question:'Synthetic question',answer:' '}]],
 ['updateQuestions',[{question:'x'.repeat(256),answer:'Synthetic answer'}]],
])test(`${method} rejects invalid nested content before HTTP`,async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({id,policies:[],faqs:[]}));};
 try{await assert.rejects(()=>hotelApi[method](id,body));assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
test('content update preserves safe HTTP status without logging upstream text',async()=>{
 const original=globalThis.fetch,oldLog=console.error;const logs=[];
 globalThis.fetch=async()=>({ok:false,status:503,statusText:'synthetic-private-error'});console.error=(...args)=>logs.push(args);
 try{await assert.rejects(()=>hotelApi.updateQuestions(id,[]),error=>error.status===503&&!error.message.includes('synthetic-private'));assert.equal(logs.length,0);}
 finally{globalThis.fetch=original;console.error=oldLog;}
});
test('successful content update cannot return another hotel as trusted state',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({id:'22222222-2222-4222-8222-222222222222',faqs:[]}));
 try{await assert.rejects(()=>hotelApi.updateQuestions(id,[]));}finally{globalThis.fetch=original;}
});

test('an explicit empty list is sent unchanged and accepts the actual empty collection response',async()=>{
 const original=globalThis.fetch;let payload;globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return new Response(JSON.stringify({id,faqs:[]}));};
 try{assert.deepEqual((await hotelApi.updateQuestions(id,[])).faqs,[]);assert.deepEqual(payload,[]);}finally{globalThis.fetch=original;}
});
test('malformed success cannot be accepted as a cleared FAQ list',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({id,questions:[]}));
 try{await assert.rejects(()=>hotelApi.updateQuestions(id,[]));}finally{globalThis.fetch=original;}
});
test('content network error remains unknown and does not retry',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('synthetic-private-network');};
 try{await assert.rejects(()=>hotelApi.updateQuestions(id,[]),error=>error.status===null&&!error.message.includes('synthetic-private'));assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('404 on a content mutation never replays through an alternative route',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:404});};
 try{await assert.rejects(()=>hotelApi.updateQuestions(id,[]),error=>error.status===404);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('content deadline includes a slow successful response body',async(t)=>{
 const original=globalThis.fetch;let consuming=false,calls=0;t.mock.timers.enable({apis:['setTimeout']});
 globalThis.fetch=async(url,options)=>{calls++;return {ok:true,status:200,json:()=>new Promise((resolve,reject)=>{
  consuming=true;options.signal.addEventListener('abort',()=>reject(new Error('synthetic-private-slow-body')),{once:true});
 })};};
 try{const operation=hotelApi.updateQuestions(id,[]),failure=assert.rejects(operation,error=>error.status===null&&!error.message.includes('synthetic-private'));
  await Promise.resolve();await Promise.resolve();assert.equal(consuming,true);t.mock.timers.tick(15000);await failure;assert.equal(calls,1);
 }finally{globalThis.fetch=original;t.mock.timers.reset();}
});
