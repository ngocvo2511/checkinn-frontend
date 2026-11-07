import {test,expect,type Page} from '@playwright/test';
import {offerPage} from './offer-fixtures';
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type','access-control-allow-methods':'GET,OPTIONS'};
const rows=Array.from({length:23},(_,i)=>{
 const id=`11111111-1111-4111-8111-${String(i+1).padStart(12,'0')}`,price=(23-i)*10000;
 return {hotel:{id,isActive:true,approvedStatus:'APPROVED',name:`Paged hotel ${i+1}`,starRating:i===22?5:3,address:{},roomTypes:[],amenityCategories:[{items:[{title:i===22?'Pool, Indoor':'Wi-Fi'}]}]},offer:{roomTypeId:id,quantity:1,unitPrice:price,totalPerNight:price,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null},reviews:{hotelId:id,totalReviews:2,averageRating:i===22?9:8}};
});
async function mock(page:Page){
 let last:URL|null=null,calls=0,details=0;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.port==='8080'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(u.pathname.endsWith('/accommodation-types'))return route.fulfill({headers:cors,json:[{code:'HOTEL',label:'Hotel'}]});
   if(u.pathname.endsWith('/hotels/offers/page')){
    last=u;calls++;
    // Predetermined server results for this fixture, not a substitute for backend tests.
    let matches=rows;
    if(u.searchParams.has('starRatings')||u.searchParams.getAll('amenities').includes('Pool, Indoor')||u.searchParams.get('guestRatings')==='9')matches=[rows[22]];
    else if(u.searchParams.get('sort')==='PRICE_ASC')matches=[...rows].reverse();
    else if(u.searchParams.get('sort')==='RATING_DESC')matches=[rows[22],...rows.slice(0,22)];
    return route.fulfill({headers:cors,json:offerPage(u,matches,{availableAmenities:['Pool, Indoor','Wi-Fi']})});
   }
   if(u.pathname.includes('/stats/')||u.pathname.endsWith('/reviews/summaries'))details++;
   return route.fulfill({headers:cors,json:[]});
  }
  if(u.origin!=='http://127.0.0.1:3300')return route.abort();
  if(u.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 return {last:()=>last,calls:()=>calls,details:()=>details};
}
const hotels=(page:Page)=>page.getByRole('heading',{level:3}).filter({hasText:/^Paged hotel /});
test('price sort changes the actual global result order and URL',async({page})=>{
 const api=await mock(page);await page.goto('/search?cityName=Fixture');
 await expect(hotels(page).first()).toHaveText('Paged hotel 1');
 await page.getByRole('combobox',{name:'Sắp xếp kết quả',exact:true}).selectOption('PRICE_ASC');
 await expect(hotels(page).first()).toHaveText('Paged hotel 23');await expect(page).toHaveURL(/sort=PRICE_ASC/);
 expect(api.last()?.searchParams.get('sort')).toBe('PRICE_ASC');expect(api.details()).toBe(0);
 await page.reload();await expect(hotels(page).first()).toHaveText('Paged hotel 23');
 await page.getByRole('combobox',{name:'Sắp xếp kết quả',exact:true}).selectOption('PRICE_DESC');
 await expect(hotels(page).first()).toHaveText('Paged hotel 1');
 await page.goBack();await expect(hotels(page).first()).toHaveText('Paged hotel 23');
});
test('URL page size total and boundaries survive reload/back and size change resets page',async({page})=>{
 await mock(page);await page.goto('/search?cityName=Fixture&size=10&page=1');
 await expect(hotels(page)).toHaveCount(10);await expect(hotels(page).first()).toHaveText('Paged hotel 11');
 await expect(page.getByText('Tìm thấy 23 khách sạn',{exact:true})).toBeVisible();await expect(page.getByText('Trang 2 / 3',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(hotels(page)).toHaveCount(3);await expect(hotels(page).first()).toHaveText('Paged hotel 21');await expect(page.getByRole('button',{name:'Trang sau',exact:true})).toBeDisabled();
 await page.reload();await expect(hotels(page)).toHaveCount(3);await page.goBack();await expect(hotels(page).first()).toHaveText('Paged hotel 11');
 await page.getByRole('combobox',{name:'Số kết quả mỗi trang',exact:true}).selectOption('20');await expect(page).not.toHaveURL(/page=/);await expect(hotels(page)).toHaveCount(20);await expect(hotels(page).first()).toHaveText('Paged hotel 1');
 await expect(page.getByRole('button',{name:'Trang trước',exact:true})).toBeDisabled();
});
test('off-page global facets and filters reach backend and reset to page zero',async({page})=>{
 const api=await mock(page);await page.goto('/search?cityName=Fixture&size=10&page=1&sort=PRICE_DESC');
 await expect(hotels(page).first()).toHaveText('Paged hotel 11');
 await page.getByRole('checkbox',{name:'Pool, Indoor',exact:true}).click();
 await expect(hotels(page)).toHaveCount(1);await expect(hotels(page)).toHaveText('Paged hotel 23');await expect(page).not.toHaveURL(/page=/);
 expect(api.last()?.searchParams.getAll('amenities')).toEqual(['Pool, Indoor']);expect(api.last()?.searchParams.get('sort')).toBe('PRICE_DESC');expect(api.last()?.searchParams.get('size')).toBe('10');
 await expect(page.getByText('Tìm thấy 1 khách sạn',{exact:true})).toBeVisible();
});
test('out-of-range page retains truthful total and offers return to first page',async({page})=>{
 await mock(page);await page.goto('/search?cityName=Fixture&page=99');
 await expect(page.getByText('Tìm thấy 23 khách sạn',{exact:true})).toBeVisible();await expect(page.getByText('Trang này không còn kết quả.',{exact:true})).toBeVisible();
 await expect(page.getByText('Không tìm thấy khách sạn phù hợp',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Về trang đầu',exact:true}).click();await expect(hotels(page)).toHaveCount(20);await expect(page).not.toHaveURL(/page=/);
});
test('invalid URL pagination fails before fetch and a valid sort change recovers',async({page})=>{
 const api=await mock(page);await page.goto('/search?cityName=Fixture&page=-1');
 await expect(page.getByTestId('search-error')).toBeVisible();expect(api.calls()).toBe(0);await expect(page.getByText('Tìm thấy 0 khách sạn',{exact:true})).toHaveCount(0);
 await page.getByRole('combobox',{name:'Sắp xếp kết quả',exact:true}).selectOption('PRICE_ASC');await expect(hotels(page).first()).toHaveText('Paged hotel 23');
});
