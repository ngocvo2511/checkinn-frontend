import {test,expect,type Page} from '@playwright/test';
const owner='a3000000-0000-0000-0000-000000000001',hotel='a3000000-0000-0000-0000-000000000002';
const cors={'access-control-allow-origin':'http://127.0.0.1:3310','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,OPTIONS'};
async function mock(page:Page,admin:boolean,fail=false){
 const seen:URL[]=[];
 await page.clock.setFixedTime(new Date('2026-11-07T05:00:00Z'));
 await page.addInitScript(({owner,admin})=>{localStorage.setItem('token','synthetic-report-token');localStorage.setItem('user',JSON.stringify({userId:owner,fullName:'Synthetic report actor',role:admin?'ADMIN':'OWNER'}));},{owner,admin});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.port==='8080'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname.startsWith('/api/reports/')){
    seen.push(url);
    if(fail)return route.fulfill({status:503,headers:cors,json:{code:'REPORT_RECONCILIATION_REQUIRED',message:'synthetic-private-backend-marker'}});
    const data=[{periodStart:'2026-10-01',amount:100000},{periodStart:'2026-11-01',amount:-50000}];
    const item={hotelId:hotel,hotelName:'Synthetic cash hotel',totalRevenue:50000,averageRevenue:50000,occupancyRate:0,cancellationRate:0,platformCommission:11500,netRevenue:38500};
    const json=url.pathname.endsWith('/summary')?(admin?{totalRevenue:50000,totalCommission:11500,commissionRate:0.23,totalBookings:1,systemCancellationRate:0,topHotels:[],regionalBreakdown:[]}:{totalRevenue:50000,totalNetRevenue:38500,totalCommission:11500,commissionRate:0.23,hotels:[item]}):admin?{totalRevenue:50000,data}:{totalRevenue:50000,hotels:[{hotelId:hotel,hotelName:'Synthetic cash hotel',revenue:{data}}]};
    return route.fulfill({headers:cors,json});
   }
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3310')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 return seen;
}
for(const zone of ['Asia/Ho_Chi_Minh','America/Los_Angeles'])test.describe(zone,()=>{
 test.use({timezoneId:zone});
 for(const admin of [true,false])test(`${admin?'admin':'owner'} uses civil report dates and keeps refund points visible`,async({page})=>{
  const seen=await mock(page,admin);await page.goto(admin?'/admin/reports':'/host/revenue');
  await expect.poll(()=>seen.length).toBeGreaterThanOrEqual(2);
  const summary=seen.find(url=>url.pathname.endsWith('/summary'))!;
  expect(summary.searchParams.get('from')).toBe('2026-11-01');expect(summary.searchParams.get('to')).toBe('2026-11-30');
  const chart=seen.find(url=>url.pathname.endsWith('/revenue'))!;expect(chart.searchParams.get('from')).toBe('2026-06-01');
  const plot=page.locator('section').filter({hasText:'Biểu đồ doanh thu'});
  await expect(plot.getByText('-50.0k',{exact:true})).toBeVisible();
  const ys=await plot.locator('circle').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('cy'))));
  expect(ys.length).toBeGreaterThan(0);expect(ys.every(y=>Number.isFinite(y)&&y>=18&&y<=162)).toBe(true);
  if(admin)await expect(page.getByText('23.0% của doanh thu',{exact:true})).toBeVisible();
  else await expect(page.getByText('Phí dịch vụ (10%)',{exact:true})).toHaveCount(0);
 });
});
test('reconciliation error is actionable and never becomes an empty report',async({page})=>{
 await mock(page,true,true);await page.goto('/admin/reports');
 await expect(page.getByText('Dữ liệu giao dịch chưa đủ hoặc có xung đột. Cần đối soát trước khi lập báo cáo.',{exact:true})).toBeVisible();
 await expect(page.getByText('synthetic-private-backend-marker')).toHaveCount(0);
 await expect(page.getByText('Toàn hệ thống',{exact:true})).toHaveCount(0);
});
test('owner keeps applied labels while editing and can request one inclusive day',async({page})=>{
 const seen=await mock(page,false);await page.goto('/host/revenue');
 const inputs=page.locator('input[type=date]');await expect(inputs.first()).toBeVisible();
 await inputs.first().fill('2026-11-08');
 await expect(page.getByText('Từ 2026-11-01 đến 2026-11-30',{exact:true})).toBeVisible();
 const before=seen.length;await inputs.last().fill('2026-11-08');
 await page.getByRole('button',{name:'Áp dụng',exact:true}).click();
 await expect.poll(()=>seen.length).toBeGreaterThan(before);
 expect(seen.filter(url=>url.pathname.endsWith('/summary')).at(-1)?.searchParams.get('to')).toBe('2026-11-08');
 await expect(page.getByText('Từ 2026-11-08 đến 2026-11-08',{exact:true})).toBeVisible();
});
