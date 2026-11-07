import {offerPage} from './offer-fixtures';
import {test,expect,type Page} from '@playwright/test';
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type','access-control-allow-methods':'GET,OPTIONS'};
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const query=(id:string,name:string,adults='2',rooms='1')=>`/search?cityId=${id}&cityName=${name}&checkIn=2099-01-01&checkOut=2099-01-02&adults=${adults}&children=0&rooms=${rooms}`;
function offer(url:URL,name='Current criteria hotel',id='current-hotel') {
  const quantity=Number(url.searchParams.get('rooms')||1),dated=url.searchParams.has('checkIn');
  return [{hotel:{id,name,isActive:true,approvedStatus:'APPROVED',address:{},mediaAssets:[],roomTypes:[{id:'room',isActive:true,basePrice:200000,totalRooms:10,capacity:{adults:2,children:2}}]},
    offer:{roomTypeId:'room',quantity,unitPrice:200000,totalPerNight:200000*quantity,availableRooms:dated?10:null,checkIn:dated?url.searchParams.get('checkIn'):null,checkOut:dated?url.searchParams.get('checkOut'):null,checkedAt:dated?'2026-11-06T00:00:00Z':null}}];
}
async function mock(page:Page,respond:(url:URL)=>Promise<{status?:number;json?:unknown}>|{status?:number;json?:unknown}) {
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.port==='8080') {
      if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
      if(url.pathname.endsWith('/accommodation-types'))return route.fulfill({headers:cors,json:[{code:'HOTEL',label:'Hotel'}]});
      if(url.pathname.endsWith('/reviews/summaries'))return route.fulfill({headers:cors,json:url.searchParams.getAll('hotelIds').map(hotelId=>({hotelId,totalReviews:0,averageRating:null}))});
      if(url.pathname.includes('/stats/'))return route.fulfill({headers:cors,json:{totalReviews:0,averageRating:0,ratingDistribution:{}}});
      const response=await respond(url);
      if(url.pathname.endsWith('/hotels/offers/page')&&Array.isArray(response.json))response.json=offerPage(url,response.json);
      return route.fulfill({headers:cors,...response});
    }
    if(url.origin!=='http://127.0.0.1:3300')return route.abort();
    if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
  });
}
test('same-component URL navigation resets displayed guest criteria and back restores them',async({page})=>{
  let lastRooms='';
  await mock(page,url=>{if(url.pathname.endsWith('/hotels/offers/page')){lastRooms=url.searchParams.get('rooms')||'';return {json:offer(url)};}return {json:[]};});
  await page.goto(query(a,'First'));
  await expect(page.getByRole('button',{name:'2 người lớn, 0 Trẻ em, 1 phòng',exact:true})).toBeVisible();
  await page.evaluate(path=>window.history.pushState(null,'',path),query(b,'Second','4','2'));
  await expect.poll(()=>lastRooms).toBe('2');
  await expect(page.getByRole('button',{name:'4 người lớn, 0 Trẻ em, 2 phòng',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button',{name:'2 người lớn, 0 Trẻ em, 1 phòng',exact:true})).toBeVisible();
});
test('clearing destination removes results from the previous criteria',async({page})=>{
  await mock(page,url=>url.pathname.endsWith('/hotels/offers/page')?{json:offer(url)}:{json:[]});
  await page.goto(query(a,'First'));
  await expect(page.getByText('Current criteria hotel',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.history.pushState(null,'','/search'));
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByText('Current criteria hotel',{exact:true})).toHaveCount(0);
});
for(const old of ['success','failure','hotel redirect']) {
  test(`late old ${old} cannot replace or redirect newer search criteria`,async({page})=>{
    let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});let oldStarted=false,oldFinished=false;
    await mock(page,async url=>{
      if(url.pathname.endsWith('/hotels/offers/page')) {
        if(url.searchParams.get('cityId')===a || url.searchParams.has('hotelName')) {
          oldStarted=true;await gate;oldFinished=true;
          return old==='failure'?{status:503,json:{message:'old failure'}}:{json:offer(url,'Old criteria hotel','old-hotel')};
        }
        return {json:offer(url)};
      }
      return {json:[]};
    });
    await page.goto(old==='hotel redirect'?'/search?hotelName=Old&checkIn=2099-01-01&checkOut=2099-01-02':query(a,'First'));
    await expect.poll(()=>oldStarted).toBe(true);
    await page.evaluate(path=>window.history.pushState(null,'',path),query(b,'Second'));
    await expect(page.getByText('Current criteria hotel',{exact:true})).toBeVisible();
    release();await expect.poll(()=>oldFinished).toBe(true);await page.waitForLoadState('networkidle');
    await expect(page.getByText('Current criteria hotel',{exact:true})).toBeVisible();
    await expect(page.getByText('Old criteria hotel',{exact:true})).toHaveCount(0);
    await expect(page.getByTestId('search-error')).toHaveCount(0);await expect(page).toHaveURL(new RegExp(`cityId=${b}`));
  });
}
test('hotel detail province selection sends province identity without an undefined city id',async({page})=>{
  let seen=false;
  await mock(page,url=>{
    if(url.pathname===`/api/hotel/hotels/${a}`)return {json:{id:a,name:'Synthetic detail hotel',isActive:true,approvedStatus:'APPROVED',address:{},roomTypes:[],mediaAssets:[],policies:[],faqs:[],amenityCategories:[]}};
    if(url.pathname.includes('/cities/'))return {json:[{id:b,name:'Synthetic province',type:'PROVINCE'}]};
    if(url.pathname.endsWith('/hotels/offers/page')){seen=url.searchParams.get('provinceId')===b && !url.searchParams.has('cityId');return {json:[]};}
    return {json:[]};
  });
  await page.goto(`/hotel/${a}?checkIn=2099-01-01&checkOut=2099-01-02`);
  await page.getByRole('search',{name:'Tìm cơ sở lưu trú'}).getByRole('button',{name:'Synthetic detail hotel',exact:true}).click();
  await page.getByPlaceholder('Tìm kiếm địa điểm...').fill('province');
  await page.getByText('Synthetic province',{exact:true}).click();
  await page.getByRole('button',{name:'Tìm khách sạn',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`provinceId=${b}`));await expect.poll(()=>seen).toBe(true);
});

test.describe('civil stay dates',()=>{
  test.use({timezoneId:'America/Los_Angeles'});
  test('stay dates remain literal local calendar days when submitted from a western timezone',async({page})=>{
    await mock(page,url=>url.pathname.endsWith('/hotels/offers/page')?{json:offer(url)}:{json:[]});
    await page.goto(query(a,'First'));
    await expect(page.getByRole('button',{name:'1 thg 1 - 2 thg 1, 1 đêm',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Tìm khách sạn',exact:true}).click();
    await expect(page).toHaveURL(/checkIn=2099-01-01/);await expect(page).toHaveURL(/checkOut=2099-01-02/);
  });
  test('invalid calendar input remains unknown instead of NaN dates or an invented stay',async({page})=>{
    await mock(page,url=>url.pathname.endsWith('/hotels/offers/page')?{status:400,json:{message:'Invalid stay dates'}}:{json:[]});
    await page.goto(`/search?cityId=${a}&cityName=First&checkIn=not-a-date&checkOut=2099-01-02`);
    await expect(page.getByRole('button',{name:'Chọn ngày',exact:true})).toBeVisible();
    await expect(page.getByTestId('search-error')).toBeVisible();
    await expect(page.getByText(/NaN thg/)).toHaveCount(0);
  });
});
