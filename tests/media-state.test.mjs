import test from 'node:test';
import assert from 'node:assert/strict';
import {orderMedia,appendMedia,selectMedia,removeMedia,nextMediaOrder,mediaNeedsReload} from '../lib/api/media-state.ts';
import {MediaWriteError} from '../lib/api/media-write.ts';
const a={id:'a',url:'https://example.invalid/a',isThumbnail:true,sortOrder:2},b={id:'b',url:'https://example.invalid/b',isThumbnail:false,sortOrder:5};
test('append respects canonical thumbnail flag and preserves existing input',()=>{
 const input=[{...a},{...b}],ack={id:'c',url:'https://example.invalid/c',isThumbnail:true,sortOrder:6};
 assert.equal(nextMediaOrder(input),6);assert.equal(nextMediaOrder([]),0);
 assert.deepEqual(appendMedia(input,ack),[{...a,isThumbnail:false},b,ack]);assert.deepEqual(input,[a,b]);
 assert.deepEqual(appendMedia(input,{...ack,isThumbnail:false}),[a,b,{...ack,isThumbnail:false}]);
});
test('thumbnail patch uses acknowledged fields without discarding unrelated media',()=>{
 const input=[{...a},{...b}],ack={...b,url:'https://example.invalid/canonical',isThumbnail:true};
 assert.deepEqual(selectMedia(input,ack),[{...a,isThumbnail:false},ack]);assert.deepEqual(input,[a,b]);
});
test('delete projects the actual server decrement rule rather than inventing contiguous orders',()=>{
 const input=[{...a},{...b}];assert.deepEqual(removeMedia(input,'a'),[{...b,sortOrder:4}]);assert.deepEqual(input,[a,b]);
});
for(const status of [null,503,502,408,404,409])test(`media ${status} requires authoritative reload`,()=>assert.equal(mediaNeedsReload(new MediaWriteError(status)),true));
for(const status of [400,401,403])test(`media ${status} is a known rejection`,()=>assert.equal(mediaNeedsReload(new MediaWriteError(status)),false));

test('gallery ordering never mutates the React state array',()=>{
 const input=Object.freeze([Object.freeze({...b}),Object.freeze({...a})]);
 assert.deepEqual(orderMedia(input),[a,b]);assert.deepEqual(input,[b,a]);
});

import {MediaUploadBatch} from '../lib/api/media-upload-batch.ts';
test('partial wizard upload failure blocks replay of already acknowledged files',async()=>{
 const batch=new MediaUploadBatch(),calls=[];
 const upload=async(entry)=>{calls.push(entry);if(entry==='b')throw new MediaWriteError(503);};
 await assert.rejects(()=>batch.run(['a','b','c'],upload));assert.deepEqual(calls,['a','b']);assert.equal(batch.blocked,true);
 await assert.rejects(()=>batch.run(['a','b','c'],upload));assert.deepEqual(calls,['a','b']);
});
test('successful wizard upload sequence is not run twice',async()=>{
 const batch=new MediaUploadBatch(),calls=[];const upload=async(entry)=>{calls.push(entry);};
 await batch.run(['a','b'],upload);await batch.run(['a','b'],upload);assert.deepEqual(calls,['a','b']);assert.equal(batch.blocked,false);
});
test('overlapping wizard upload sequences cannot dispatch duplicate requests',async()=>{
 const batch=new MediaUploadBatch();let release,calls=0;const gate=new Promise(resolve=>{release=resolve;});
 const upload=async()=>{calls++;await gate;};const first=batch.run(['a'],upload);
 try{await assert.rejects(()=>batch.run(['a'],upload));assert.equal(calls,1);}finally{release();await first;}
});
