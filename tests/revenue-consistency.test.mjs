import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {reportMonthRange,reportChartRange,reportMonthKey} from '../lib/reporting/calendar.ts';
import {safeReportError} from '../lib/reporting/errors.ts';

test('Vietnam reporting day crosses months independently of UTC and leap years',()=>{
  assert.deepEqual(reportMonthRange(new Date('2027-02-28T17:30:00Z')),{from:'2027-03-01',to:'2027-03-31'});
  assert.deepEqual(reportChartRange(new Date('2027-02-28T17:30:00Z')),{from:'2026-10-01',to:'2027-03-31'});
  assert.deepEqual(reportMonthRange(new Date('2028-02-01T00:00:00Z')),{from:'2028-02-01',to:'2028-02-29'});
  assert.equal(reportMonthKey('2027-11-01'),'2027-11');
  assert.throws(()=>reportMonthKey('2027-02-30'));assert.throws(()=>reportMonthKey('2027-11-01T00:00:00Z'));
});
test('report errors retain safe meaning without request credentials or raw body',()=>{
  const failure=safeReportError({config:{headers:{Authorization:'synthetic-private-token'}},response:{status:503,data:{code:'REPORT_RECONCILIATION_REQUIRED',message:'synthetic-private-body'}}});
  assert.equal(failure.code,'REPORT_RECONCILIATION_REQUIRED');assert.equal(failure.status,503);
  assert.match(failure.message,/đối soát/);assert.doesNotMatch(String(failure)+JSON.stringify(failure),/synthetic-private/);
  assert.match(safeReportError({response:{status:403}}).message,/không có quyền/);
});
test('real report SDK rejects malformed cash points and strips transport details',async()=>{
  const original=axios.defaults.adapter;let mode='malformed';
  axios.defaults.adapter=async config=>{
    if(mode==='outage')throw new axios.AxiosError('synthetic-private-body',null,config,null,{status:503,data:{code:'REPORT_RECONCILIATION_REQUIRED',message:'synthetic-private-body'},headers:{},statusText:'Unavailable',config});
    return {data:{totalRevenue:-100,data:[{periodStart:mode==='malformed'?'2027-02-30':'2027-03-01',amount:-100}]},status:200,statusText:'OK',headers:{},config};
  };
  try {
    const {revenueApi}=await import('../lib/api/revenue.ts');
    await assert.rejects(revenueApi.getAdminRevenue('2027-02-01','2027-03-01','month'),error=>error.code==='INVALID_RESPONSE');
    mode='valid';assert.equal((await revenueApi.getAdminRevenue('2027-02-01','2027-03-01','month')).data[0].amount,-100);
    mode='outage';await assert.rejects(revenueApi.getAdminRevenue('2027-02-01','2027-03-01','month'),error=>error.code==='REPORT_RECONCILIATION_REQUIRED' && !('config' in error));
  } finally {axios.defaults.adapter=original;}
});
