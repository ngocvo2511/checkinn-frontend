import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';
const hotel='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
const asset={id,targetId:hotel,targetType:'HOTEL',url:'https://example.invalid/synthetic.png',isThumbnail:true,sortOrder:0};
const file=()=>new File(['synthetic'],'synthetic.png',{type:'image/png'});
for(const action of ['uploadMedia','deleteMedia','setThumbnail','deleteDraftHotel'])test(`${action}: safe typed rejection and one request`,async()=>{
 const old=globalThis.fetch,log=console.error;let calls=0,logs=[];console.error=(...args)=>logs.push(args);
 globalThis.fetch=async()=>{calls++;return new Response('synthetic-private-detail',{status:503,statusText:'synthetic-private-status'});};
 try{await assert.rejects(()=>action==='uploadMedia'?hotelApi[action](hotel,'HOTEL',file(),true):hotelApi[action](id),error=>error.status===503&&error.uncertain===true&&!error.message.includes('synthetic-private'));assert.equal(calls,1);assert.equal(logs.length,0);}finally{globalThis.fetch=old;console.error=log;}
});
for(const body of [null,{}, {...asset,id:hotel},{...asset,isThumbnail:false},{...asset,url:'javascript:alert(1)'},{...asset,sortOrder:'0'}])test('thumbnail rejects malformed or contradictory success',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify(body));
 try{await assert.rejects(()=>hotelApi.setThumbnail(id),error=>error.uncertain===true);}finally{globalThis.fetch=old;}
});
for(const body of [{...asset,targetId:id},{...asset,targetType:'ROOM_TYPE'},{...asset,isThumbnail:false}])test('upload rejects acknowledgement for different target or flag',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify(body));
 try{await assert.rejects(()=>hotelApi.uploadMedia(hotel,'HOTEL',file(),true),error=>error.uncertain===true);}finally{globalThis.fetch=old;}
});
test('media DELETE requires the real controller acknowledgement',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response('<html>synthetic upstream page</html>');
 try{await assert.rejects(()=>hotelApi.deleteMedia(id),error=>error.uncertain===true);globalThis.fetch=async()=>new Response('Deleted');await hotelApi.deleteMedia(id);}finally{globalThis.fetch=old;}
});
test('draft deletion never replays a404 through an alternative route',async()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:404});};
 try{await assert.rejects(()=>hotelApi.deleteDraftHotel(hotel));assert.equal(calls,1);}finally{globalThis.fetch=old;}
});
test('draft409 has a safe actionable conflict instead of raw upstream text',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response('synthetic-private-conflict',{status:409});
 try{await assert.rejects(()=>hotelApi.deleteDraftHotel(hotel),error=>error.status===409&&error.uncertain===false&&!error.message.includes('synthetic-private')&&error.message.includes('phòng'));}finally{globalThis.fetch=old;}
});
for(const action of ['uploadMedia','deleteMedia','setThumbnail','deleteDraftHotel'])test(`${action}: invalid identifiers never reach transport`,async()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response('Deleted');};
 try{await assert.rejects(()=>action==='uploadMedia'?hotelApi[action]('../other','HOTEL',file()):hotelApi[action]('../other'));assert.equal(calls,0);}finally{globalThis.fetch=old;}
});
for(const slowBody of [false,true])test(`media deadline covers ${slowBody?'body consumption':'connection'}`,async(t)=>{
 const old=globalThis.fetch;let calls=0,consuming=false;t.mock.timers.enable({apis:['setTimeout']});
 globalThis.fetch=async(url,options)=>{calls++;assert.ok(options.signal instanceof AbortSignal);const wait=()=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('synthetic-private-timeout')),{once:true}));if(!slowBody)return wait();return {ok:true,status:200,json:()=>{consuming=true;return wait();}};};
 try{const failure=assert.rejects(hotelApi.setThumbnail(id),error=>error.status===null&&error.uncertain===true&&!error.message.includes('synthetic-private'));await Promise.resolve();await Promise.resolve();if(slowBody)assert.equal(consuming,true);t.mock.timers.tick(15000);await failure;assert.equal(calls,1);}finally{globalThis.fetch=old;t.mock.timers.reset();}
});
test('valid media acknowledgements retain server target and order',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify(asset));
 try{assert.deepEqual(await hotelApi.setThumbnail(id),asset);assert.deepEqual(await hotelApi.uploadMedia(hotel,'HOTEL',file(),true),asset);}finally{globalThis.fetch=old;}
});

test('target-bound thumbnail acknowledgement cannot cross a hotel boundary',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({...asset,targetId:id}));
 try{await assert.rejects(()=>hotelApi.setThumbnail(id,{targetId:hotel,targetType:'HOTEL'}),error=>error.uncertain===true);}finally{globalThis.fetch=old;}
});
test('draft deletion requires a structured acknowledgement and never leaks its body',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response('synthetic-private-proxy');
 try{await assert.rejects(()=>hotelApi.deleteDraftHotel(hotel),error=>error.uncertain===true&&!error.message.includes('synthetic-private'));globalThis.fetch=async()=>new Response(JSON.stringify({message:'Synthetic deleted'}));await hotelApi.deleteDraftHotel(hotel);}finally{globalThis.fetch=old;}
});
test('media upload uses multipart headers and the canonical request fields',async()=>{
 const old=globalThis.fetch;let seen;globalThis.fetch=async(url,options)=>{seen={url,options};return new Response(JSON.stringify(asset));};
 try{await hotelApi.uploadMedia(hotel,'HOTEL',file(),true);assert.equal(seen.options.headers['Content-Type'],undefined);assert.equal(seen.options.body.get('targetId'),hotel);assert.equal(seen.options.body.get('isThumbnail'),'true');assert.ok(seen.options.signal instanceof AbortSignal);}finally{globalThis.fetch=old;}
});
for(const payload of [null,{},[{...asset,targetId:id}],[asset,asset]])test('authoritative media preview rejects malformed, foreign or duplicate rows',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify(payload));
 try{await assert.rejects(()=>hotelApi.getMediaPreview(hotel,'HOTEL'),error=>error.status===null);}finally{globalThis.fetch=old;}
});
test('authoritative preview distinguishes an empty collection from an outage without mutation replay',async()=>{
 const old=globalThis.fetch,seen=[];globalThis.fetch=async(url,options)=>{seen.push(options.method);return new Response('[]');};
 try{assert.deepEqual(await hotelApi.getMediaPreview(hotel,'HOTEL'),[]);globalThis.fetch=async(url,options)=>{seen.push(options.method);return new Response('synthetic-private-outage',{status:503});};await assert.rejects(()=>hotelApi.getMediaPreview(hotel,'HOTEL'),error=>error.status===503&&!error.message.includes('synthetic-private'));assert.deepEqual(seen,['GET','GET']);}finally{globalThis.fetch=old;}
});
