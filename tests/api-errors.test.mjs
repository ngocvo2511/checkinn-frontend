import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingApi} from '../lib/api/booking.ts';
import {bookingFetch} from '../lib/api/request-error.ts';
import {createServer} from 'node:http';

test('booking API preserves status code request id and safe field errors without showing raw JSON',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({status:400,code:'VALIDATION_ERROR',message:'Ngày lưu trú không hợp lệ',requestId:'fixture-request',fieldErrors:{checkOut:'Phải sau ngày nhận',ignored:42}}),{status:400});
 try {await assert.rejects(()=>bookingApi.getCancellationPolicy(),error=>{assert.equal(error.status,400);assert.equal(error.code,'VALIDATION_ERROR');assert.equal(error.requestId,'fixture-request');assert.equal(error.message,'Ngày lưu trú không hợp lệ');assert.deepEqual(error.fieldErrors,{checkOut:'Phải sau ngày nhận'});return true;});}
 finally {globalThis.fetch=previous;}
});
test('booking transport bounds a real stalled response body without retrying',async()=>{
 let requests=0;
 const server=createServer((req,res)=>{requests++;res.writeHead(200,{'Content-Type':'application/json'});res.flushHeaders();res.write('{"pending":');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const response=await bookingFetch(`http://127.0.0.1:${server.address().port}/slow-body`,{},300);
  await assert.rejects(()=>response.json(),error=>['AbortError','TimeoutError'].includes(error.name));
  assert.equal(requests,1);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('booking transport bounds a stalled request and exposes unknown result instead of retrying',async()=>{
 let requests=0;
 const server=createServer(()=>{requests++;});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{await assert.rejects(()=>bookingFetch(`http://127.0.0.1:${server.address().port}/slow-headers`,{method:'POST'},300),error=>{assert.equal(error.code,'TIMEOUT');assert.match(error.message,/Chưa xác định được kết quả/);return true;});assert.equal(requests,1);}
 finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('booking API never exposes upstream HTML or internal details on server errors',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response('<html>synthetic internal detail</html>',{status:503});
 try{await assert.rejects(()=>bookingApi.getCancellationPolicy(),error=>{assert.equal(error.status,503);assert.equal(error.code,'DEPENDENCY_UNAVAILABLE');assert.doesNotMatch(error.message,/synthetic|html/);return true;});}
 finally{globalThis.fetch=previous;}
});
test('legacy empty and plain errors remain distinguishable by status',async()=>{
 const previous=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response(null,{status:403});
  await assert.rejects(()=>bookingApi.getCancellationPolicy(),error=>{assert.equal(error.status,403);assert.equal(error.code,'FORBIDDEN');return true;});
  globalThis.fetch=async()=>new Response('Booking already finalized',{status:409});
  await assert.rejects(()=>bookingApi.getCancellationPolicy(),error=>{assert.equal(error.status,409);assert.equal(error.message,'Booking already finalized');return true;});
 }finally{globalThis.fetch=previous;}
});
