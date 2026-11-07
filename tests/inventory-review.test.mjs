import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryState,inventoryReviewApi} from '../lib/api/inventory-review.ts';
const request={id:'request',room_id:'room',hotel_id:'hotel',previous_quantity:null,proposed_quantity:3,source:'Verified register',requested_by:'owner',requested_at:'2026-11-07T00:00:00Z',status:'APPROVED',revision:2,reviewed_by:'admin',reviewed_at:'2026-11-07T00:10:00Z',review_reason:'Checked'};
const unknown={revision:0,managed:false,verified:false,currentQuantity:null,latestRequest:null,approvedRequest:null};
test('unknown stock and legacy ten stay distinct and unverified',()=>{
 assert.equal(inventoryState(unknown).currentQuantity,null);
 assert.equal(inventoryState({...unknown,currentQuantity:10}).verified,false);
});
test('verified state requires matching approved evidence',()=>{
 const valid={...unknown,revision:2,managed:true,verified:true,currentQuantity:3,latestRequest:request,approvedRequest:request};
 assert.equal(inventoryState(valid).verified,true);
 for(const patch of [{currentQuantity:4},{managed:false},{approvedRequest:null},{approvedRequest:{...request,status:'PENDING'}}])assert.throws(()=>inventoryState({...valid,...patch}),e=>e.code==='INVALID_RESPONSE');
});
test('malformed state never becomes default revision or guessed stock',()=>{
 for(const value of [null,[],{}, {...unknown,revision:-1},{...unknown,currentQuantity:'10'},{...unknown,latestRequest:{...request,source:{}}}])assert.throws(()=>inventoryState(value),e=>e.code==='INVALID_RESPONSE');
});
test('owner proposal sends source and displayed revision only once; failure remains visible',async()=>{
 const previous=globalThis.fetch;let writes=0;
 globalThis.fetch=async(url,options)=>{writes++;assert.match(url,/room%2Fid\/inventory-review$/);assert.deepEqual(JSON.parse(options.body),{quantity:3,revision:7,source:'Manual evidence'});return new Response('private provider detail',{status:409});};
 try{await assert.rejects(()=>inventoryReviewApi.propose('room/id',3,7,'Manual evidence'),e=>e.code==='CONFLICT'&&!e.message.includes('private'));assert.equal(writes,1);}finally{globalThis.fetch=previous;}
});
test('admin review uses request revision rather than trusting submitted actor identity',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{assert.deepEqual(JSON.parse(options.body),{approve:true,reason:'Checked',revision:2});return Response.json(request);};
 try{assert.equal((await inventoryReviewApi.review(request,true,'Checked')).id,'request');}finally{globalThis.fetch=previous;}
});
