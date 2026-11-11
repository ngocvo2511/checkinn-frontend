import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';
const id='11111111-1111-4111-8111-111111111111';
test('successful upload accepts the actual controller acknowledgement contract',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({message:'Tải tài liệu xác thực thành công'}));
 try{assert.equal((await hotelApi.uploadHotelDocuments(id,new FormData())).message,'Tải tài liệu xác thực thành công');}
 finally{globalThis.fetch=original;}
});
test('storage errors stay explicit without logging a private upstream body',async()=>{
 const original=globalThis.fetch,oldError=console.error;const logs=[];console.error=(...args)=>logs.push(args);
 globalThis.fetch=async()=>new Response('synthetic-private-provider-detail',{status:503});
 try{await assert.rejects(()=>hotelApi.getHotelDocuments(id),error=>error.status===503 && !error.message.includes('synthetic-private'));assert.equal(logs.length,0);}
 finally{globalThis.fetch=original;console.error=oldError;}
});
test('document upload is never automatically repeated on404 with another route',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response('synthetic-private-error',{status:404});};
 try{await assert.rejects(()=>hotelApi.uploadHotelDocuments(id,new FormData()));assert.equal(calls,1);}
 finally{globalThis.fetch=original;}
});
test('successful malformed or cross-hotel document payloads cannot become trusted state',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({hotelId:'other',approvedStatus:'PENDING'}));
 try{await assert.rejects(()=>hotelApi.getHotelDocuments(id));}finally{globalThis.fetch=original;}
});
test('document requests carry a deadline including response body consumption',async()=>{
 const original=globalThis.fetch;let signal;
 globalThis.fetch=async(url,options)=>{signal=options.signal;return new Response(JSON.stringify({hotelId:id,approvedStatus:'PENDING'}));};
 try{await hotelApi.getHotelDocuments(id);assert.ok(signal instanceof AbortSignal);}finally{globalThis.fetch=original;}
});
test('a successful source response can still represent genuinely absent documents',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({hotelId:id,approvedStatus:'DRAFT',businessLicenseUrl:null}));
 try{assert.equal((await hotelApi.getHotelDocuments(id)).businessLicenseUrl,null);}finally{globalThis.fetch=original;}
});
