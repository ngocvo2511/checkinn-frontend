import {test,expect,type Page} from '@playwright/test';
const guest='11111111-1111-4111-8111-111111111111',hotel='22222222-2222-4222-8222-222222222222';
const marker='synthetic-private-review-failure';
const review=(n:number)=>({id:`review-${n}`,guestId:guest,hotelId:hotel,rating:8,title:`Own synthetic review ${n}`,
 content:'Synthetic review content',status:'PUBLISHED',helpfulCount:0,createdAt:'2026-11-01T00:00:00Z',updatedAt:'2026-11-01T00:00:00Z'});
const booking={id:'synthetic-booking',userId:guest,hotelId:hotel,hotelName:'Synthetic history hotel',status:'CHECKED_OUT',
 checkInDate:'2026-11-01',checkOutDate:'2026-11-02',totalAmount:1000000,paidAmount:1000000,createdAt:'2026-11-01T00:00:00Z',items:[]};
const cors={'access-control-allow-origin':'http://127.0.0.1:3313','access-control-allow-headers':'authorization,content-type',
 'access-control-allow-methods':'GET,OPTIONS'};
async function prepare(page:Page,mode:'paged'|'history-failure'|'lookup-failure') {
 let ownReads=0,lookups=0,publicReads=0;const logs:string[]=[];const seen:URL[]=[];
 page.on('console',message=>logs.push(message.text()));
 await page.addInitScript(({guest})=>{
  const token='synthetic.'+btoa(JSON.stringify({sub:guest,role:'CUSTOMER'}))+'.signature';
  localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify({userId:guest,fullName:'Synthetic guest',role:'CUSTOMER'}));
 },{guest});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.port==='8080') {
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname==='/api/v1/reviews/me') {
    seen.push(url);ownReads++;
    if(mode==='history-failure'&&ownReads===1)return route.fulfill({status:503,headers:cors,json:{message:marker}});
    const json=mode==='paged'?{content:url.searchParams.get('page')==='1'?[review(3)]:[review(1),review(2)],totalElements:3,totalPages:2}
     :{content:[],totalElements:0,totalPages:0};
    return route.fulfill({headers:cors,json});
   }
   if(url.pathname.includes('/check-booking/')) {
    lookups++;
    return route.fulfill({status:lookups===1?503:404,headers:cors,json:{message:marker}});
   }
   if(url.pathname.startsWith('/api/v1/reviews/hotel/')){publicReads++;return route.fulfill({headers:cors,json:{content:[{...review(9),guestId:'another-guest'}],totalElements:1,totalPages:1}});}
   if(url.pathname.startsWith('/api/bookings/user/'))return route.fulfill({headers:cors,json:mode==='lookup-failure'?[booking]:[]});
   return route.fulfill({headers:cors,json:{id:hotel,name:'Synthetic history hotel',mediaAssets:[]}});
  }
  if(url.origin!=='http://127.0.0.1:3313')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});
  return route.continue();
 });
 return {logs,seen,publicReads:()=>publicReads};
}
test('my reviews uses the private endpoint and retains all pages without public hotel aggregation',async({page})=>{
 const state=await prepare(page,'paged');await page.goto('/reviews');
 await page.getByRole('button',{name:'Đã đánh giá (3)',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Own synthetic review 1'})).toBeVisible();
 await page.getByRole('button',{name:'Trang sau',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Own synthetic review 3'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Own synthetic review 1'})).toHaveCount(0);
 expect(state.publicReads()).toBe(0);expect(state.seen.some(url=>url.searchParams.get('page')==='1')).toBe(true);
 expect(state.seen.every(url=>!url.searchParams.has('userId'))).toBe(true);
});
test('private history failure is unknown and can be retried without a false empty history',async({page})=>{
 const state=await prepare(page,'history-failure');await page.goto('/reviews');
 await expect(page.locator('main').getByRole('alert')).toContainText('Không thể xác nhận dữ liệu đánh giá');
 await expect(page.getByText('Không có đặt phòng nào cần đánh giá.')).toHaveCount(0);
 await page.getByRole('button',{name:'Thử tải lại đánh giá'}).click();
 await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
 await expect(page.getByText('Không có đặt phòng nào cần đánh giá.')).toBeVisible();
 expect(state.logs.join('\n')).not.toContain(marker);
});
test('unknown booking review lookup cannot become a write action on the reviews page',async({page})=>{
 await prepare(page,'lookup-failure');await page.goto('/reviews');
 await expect(page.locator('main').getByRole('alert')).toBeVisible();
 await expect(page.getByRole('button',{name:'Viết đánh giá',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Thử tải lại đánh giá'}).click();
 await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Viết đánh giá',exact:true})).toBeVisible();
});
test('booking history keeps bookings but hides write/view actions until review state is known',async({page})=>{
 await prepare(page,'lookup-failure');await page.goto('/booking/history');
 await expect(page.locator('main').getByRole('alert')).toContainText('Chưa thể xác định trạng thái đánh giá');
 await expect(page.getByText('Synthetic history hotel',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Viết đánh giá',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Xem đánh giá',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Thử tải lại đánh giá'}).click();
 await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Viết đánh giá',exact:true})).toBeVisible();
});
