import {offerPage} from './offer-fixtures';
import {test,expect,type Page} from '@playwright/test';
const id='00000000-0000-4000-8000-0000000000a1',owner='00000000-0000-4000-8000-0000000000a2',raw='00000000-0000-4000-8000-0000000000a3';
const catalog=[{code:'WIFI_FREE',label:'Wi-Fi miễn phí',description:'Free access',active:true,revision:0},{code:'WIFI_PAID',label:'Wi-Fi trả phí',description:'Paid access',active:true,revision:0}];
const hotel={id,ownerId:owner,cityId:id,name:'Synthetic amenity property',description:'Synthetic description only',approvedStatus:'APPROVED',isActive:true,starRating:3,accommodationType:'HOTEL',accommodationTypeLabel:'Hotel',address:{street:'Synthetic street',city:'Synthetic city',country:'VN'},roomTypes:[],mediaAssets:[],policies:[],faqs:[],amenityCategories:[{id:'category',title:'Internet',items:[{id:raw,title:'Wi-Fi'}]}]};
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
async function login(page:Page,role:string){await page.addInitScript(({role,owner})=>{localStorage.setItem('token','synthetic-amenity-token');localStorage.setItem('user',JSON.stringify({userId:owner,role,fullName:'Synthetic User'}));},{role,owner});}
async function mock(page:Page,respond:(u:URL,method:string,body:any)=>{status?:number;json?:unknown}|undefined){
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),method=route.request().method();
  if(u.port==='8080'){
   if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
   const body=route.request().postData()?route.request().postDataJSON():null;
   const result=respond(u,method,body);if(result){if(u.pathname.endsWith('/hotels/offers/page')&&Array.isArray(result.json))result.json=offerPage(u,result.json);return route.fulfill({headers:cors,...result});}
   if(u.pathname.endsWith('/amenity-catalog'))return route.fulfill({headers:cors,json:catalog});
   if(u.pathname.endsWith('/accommodation-types'))return route.fulfill({headers:cors,json:[{code:'HOTEL',label:'Hotel'},{code:'VILLA',label:'Villa'},{code:'APARTMENT',label:'Apartment'},{code:'GUEST_HOUSE',label:'Guest House'}]});
   if(u.pathname.endsWith('/hotels/'+id+'/preview')||u.pathname.endsWith('/hotels/'+id))return route.fulfill({headers:cors,json:hotel});
   if(u.pathname.endsWith('/hotels/offers/page'))return route.fulfill({headers:cors,json:offerPage(u,[{hotel,offer:{roomTypeId:id,quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null}}])});
   if(u.pathname.endsWith('/reviews/summaries'))return route.fulfill({headers:cors,json:u.searchParams.getAll('hotelIds').map(hotelId=>({hotelId,totalReviews:0,averageRating:null}))});
      if(u.pathname.includes('/stats/'))return route.fulfill({headers:cors,json:{totalReviews:0,averageRating:0,ratingDistribution:{}}});
   if(u.pathname.includes('/reviews/'))return route.fulfill({headers:cors,json:{content:[],totalElements:0,totalPages:0}});
   return route.fulfill({headers:cors,json:[]});
  }
  if(u.origin!=='http://127.0.0.1:3300')return route.abort();
  if(u.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
}
test('reviewed code filters reach API and preserve literal filters budget reload and back',async({page})=>{
 let seen:string[]=[];
 await mock(page,u=>{if(u.pathname.endsWith('/hotels/offers/page'))seen=u.searchParams.getAll('amenityCodes');return undefined;});
 await page.goto(`/search?cityId=${id}&maxPrice=800000&amenity=Wi-Fi`);
 const free=page.getByRole('checkbox',{name:'Wi-Fi miễn phí',exact:true}),paid=page.getByRole('checkbox',{name:'Wi-Fi trả phí',exact:true});
 await free.click();await expect(free).toBeChecked();await expect.poll(()=>seen).toEqual(['WIFI_FREE']);await paid.click();await expect(paid).toBeChecked();await expect.poll(()=>seen).toEqual(['WIFI_FREE','WIFI_PAID']);
 await page.reload();await expect(free).toBeChecked();await expect(paid).toBeChecked();
 await page.goBack();await expect(paid).not.toBeChecked();await expect(free).toBeChecked();
 await page.getByRole('button',{name:'Xóa bộ lọc mã tiện nghi'}).click();await expect.poll(()=>seen).toEqual([]);
 const url=new URL(page.url());expect(url.searchParams.get('amenity')).toBe('Wi-Fi');expect(url.searchParams.get('maxPrice')).toBe('800000');
});
test('catalog failure and inactive URL code stay visible and recover without a fabricated catalog',async({page})=>{
 let failed=true;await mock(page,u=>u.pathname.endsWith('/amenity-catalog')?failed?{status:503,json:{message:'Unavailable'}}:{json:catalog}:undefined);
 await page.goto(`/search?cityId=${id}&amenityCodes=OLD_CODE`);
 await expect(page.getByText('Không tải được catalog tiện nghi.')).toBeVisible();failed=false;await page.getByRole('button',{name:'Thử lại tiện nghi'}).click();
 await expect(page.getByText('URL chứa mã không tồn tại hoặc đã ngừng sử dụng. Hãy xóa hoặc chọn lại.')).toBeVisible();
 await page.getByRole('button',{name:'Xóa bộ lọc mã tiện nghi'}).click();await expect(page).not.toHaveURL(/amenityCodes/);
});
test('owner proposes checked codes while literal title and effective mapping stay unchanged until approval',async({page})=>{
 await login(page,'OWNER');let revision=0,proposal:any=null;
 await mock(page,(u,method,body)=>{
  if(u.pathname.endsWith('/amenity-mappings'))return {json:[{id:raw,title:'Wi-Fi',revision,approvedCodes:[],latestRequest:proposal?{id:'request',status:'PENDING',codes:proposal.codes}:null}]};
  if(u.pathname.endsWith('/requests')&&method==='POST'){proposal=body;revision++;return {status:201,json:{id:'request'}};}
 });
 await page.goto('/host/hotels/'+id);
 const panel=page.getByRole('region',{name:'Mapping tiện nghi'});
 await expect(panel.getByText('Đã duyệt: Chưa có mã')).toBeVisible();
 await panel.getByRole('checkbox',{name:'Wi-Fi miễn phí (WIFI_FREE)',exact:true}).check();
 await panel.getByLabel('Ghi chú mapping').fill('Đã kiểm tra dịch vụ miễn phí');await panel.getByRole('button',{name:'Gửi mapping chờ duyệt'}).click();
 await expect.poll(()=>proposal?.codes).toEqual(['WIFI_FREE']);expect(proposal.revision).toBe(0);
 await expect(panel.getByText('Yêu cầu gần nhất: PENDING')).toBeVisible();await expect(panel.getByText('Đã duyệt: Chưa có mã')).toBeVisible();
});
test('admin creates immutable catalog code and reviews a proposal with a recorded reason',async({page})=>{
 await login(page,'ADMIN');let created:any=null,decision:any=null;
 const request={id:'request',hotel_id:id,amenity_id:raw,title_snapshot:'Wi-Fi',codes:['WIFI_FREE'],status:'PENDING',revision:1,note:'Inspected synthetic source',review_reason:null};
 await mock(page,(u,method,body)=>{
  if(u.pathname.endsWith('/admin/amenity-catalog')&&method==='POST'){created=body;return {status:201,json:body};}
  if(u.pathname.endsWith('/admin/amenity-mappings'))return {json:decision?[]:[request]};
  if(u.pathname.endsWith('/review')){decision=body;return {json:{...request,status:'APPROVED'}};}
 });
 await page.goto('/admin/amenities');await page.getByLabel('Mã tiện nghi',{exact:true}).fill('POOL');await page.getByLabel('Tên tiện nghi',{exact:true}).fill('Hồ bơi');await page.getByRole('button',{name:'Lưu tiện nghi',exact:true}).click();
 await expect.poll(()=>created?.code).toBe('POOL');expect(created.revision).toBe(0);
 const panel=page.getByRole('region',{name:'Duyệt Wi-Fi'});await expect(panel.getByRole('button',{name:'Duyệt mapping',exact:true})).toBeDisabled();await panel.getByLabel('Lý do quyết định').fill('Đã kiểm tra dịch vụ và chính sách');await panel.getByRole('button',{name:'Duyệt mapping',exact:true}).click();
 await expect.poll(()=>decision?.approve).toBe(true);expect(decision.revision).toBe(1);expect(decision.reason).toContain('Đã kiểm tra');await expect(page.getByText('Không có yêu cầu ở trang này.')).toBeVisible();
});
test('admin stale catalog edits keep entered fields and show explicit retry error',async({page})=>{
 await login(page,'ADMIN');await mock(page,(u,method)=>u.pathname.includes('/admin/amenity-catalog/')&&method==='PUT'?{status:409,json:{message:'Stale'}}:undefined);
 await page.goto('/admin/amenities');await page.getByRole('button',{name:'Sửa WIFI_FREE',exact:true}).click();await expect(page.getByLabel('Mã tiện nghi',{exact:true})).toBeDisabled();await page.getByLabel('Tên tiện nghi',{exact:true}).fill('Tên đã kiểm tra');await page.getByRole('button',{name:'Lưu tiện nghi',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Không lưu được catalog.'})).toContainText('Không lưu được catalog.');await expect(page.getByLabel('Tên tiện nghi',{exact:true})).toHaveValue('Tên đã kiểm tra');
});
