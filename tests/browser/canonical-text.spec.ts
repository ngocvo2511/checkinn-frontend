import {test,expect,type Page} from '@playwright/test';
import {offerPage} from './offer-fixtures';
const id='11111111-1111-4111-8111-111111111111',roomId='22222222-2222-4222-8222-222222222222';
const room={textEncoding:'PLAIN_V1',id:roomId,hotelId:id,name:'"Quoted room"',description:'"Literal room description"',isActive:true,basePrice:200000,totalRooms:2,capacity:{adults:2,children:0},amenities:['"Quoted room amenity"'],mediaAssets:[]};
const hotel={textEncoding:'PLAIN_V1',id,name:'"Quoted hotel"',description:'"Literal hotel description"',isActive:true,approvedStatus:'APPROVED',address:{street:'"Quoted street"',city:'Synthetic',country:'VN'},roomTypes:[room],amenityCategories:[{id:'category',title:'"Quoted category"',items:[{id:'amenity',title:'"Quoted amenity"'}]}],mediaAssets:[],policies:[],faqs:[]};
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type','access-control-allow-methods':'GET,OPTIONS'};
async function mock(page:Page){await page.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.port==='8080'){
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
  if(u.pathname.endsWith('/hotels/offers/page'))return route.fulfill({headers:cors,json:offerPage(u,[{hotel,offer:{roomTypeId:roomId,quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null}}])});
  if(u.pathname.endsWith('/hotels/'+id))return route.fulfill({headers:cors,json:hotel});
  if(u.pathname.includes('/stats/'))return route.fulfill({headers:cors,json:{totalReviews:0,averageRating:0,recentReviews:[]}});
  if(u.pathname.includes('/reviews/'))return route.fulfill({headers:cors,json:{content:[],totalElements:0,totalPages:0}});
  return route.fulfill({headers:cors,json:[]});
 }
 if(u.origin!=='http://127.0.0.1:3300')return route.abort();
 if(u.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
});}
test('search preserves literal hotel and amenity quotes from the canonical API',async({page})=>{
 await mock(page);await page.goto('/search?cityName=Fixture');
 await expect(page.getByRole('heading',{name:'"Quoted hotel"',exact:true})).toBeVisible();
 await expect(page.getByRole('checkbox',{name:'"Quoted amenity"',exact:true})).toBeVisible();
});
test('room card and details modal preserve literal room quotes',async({page})=>{
 await mock(page);await page.goto('/hotel/'+id);
 await expect(page.getByRole('heading',{name:'"Quoted hotel"',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'"Quoted room"',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Xem chi tiết phòng',exact:true}).click();
 await expect(page.getByRole('heading',{name:'"Quoted room"',exact:true})).toHaveCount(2);
 await expect(page.getByText('"Literal room description"',{exact:true})).toBeVisible();
});
