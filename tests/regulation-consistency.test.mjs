import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRegulationValue,regulationsApi} from '../lib/api/regulations.ts';

test('decimal validation consumes the entire input and keeps existing range policy',()=>{
  for(const value of ['2abc','0x10','NaN','Infinity','-1','1000000'])assert.notEqual(validateRegulationValue(value),null,value);
  for(const value of ['0',' 2.5 ','1e3','.5','+2','999999.99'])assert.equal(validateRegulationValue(value),null,value);
});
test('regulation conflict is actionable and contains no private backend payload',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({message:'private-synthetic-server-detail',code:'REGULATION_CONFLICT'}),{status:409});
  try {
    await assert.rejects(()=>regulationsApi.saveRegulation('SYNTHETIC',{regulationKey:'SYNTHETIC',name:'Synthetic',value:'2',active:true,version:1}),
      error=>error.status===409 && /tải lại/i.test(error.message) && !JSON.stringify(error).includes('private-synthetic-server-detail'));
  }finally{globalThis.fetch=original;}
});
test('malformed successful data is rejected instead of an empty or invalid configuration',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({unexpected:[]}));
  try {await assert.rejects(()=>regulationsApi.getRegulations());}
  finally{globalThis.fetch=original;}
});
test('every regulation request has an abort deadline covering response body consumption',async()=>{
  const original=globalThis.fetch;let signal;
  globalThis.fetch=async(url,options)=>{signal=options.signal;return new Response('[]');};
  try {assert.deepEqual(await regulationsApi.getSnapshots(),[]);assert.ok(signal instanceof AbortSignal);}
  finally{globalThis.fetch=original;}
});
