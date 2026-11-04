import {test,expect,type Page} from '@playwright/test';
const id='00000000-0000-4000-8000-0000000000c1',owner='00000000-0000-4000-8000-0000000000c2';
const catalog=[{code:'HOTEL',label:'Hotel'},{code:'VILLA',label:'Villa'},{code:'APARTMENT',label:'Apartment'},{code:'GUEST_HOUSE',label:'Guest House'}];
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
const hotel={id,ownerId:owner,cityId:id,name:'Synthetic type property',description:'Synthetic description for property',approvedStatus:'APPROVED',isActive:true,starRating:3,accommodationType:'HOTEL',accommodationTypeLabel:'Hotel',address:{street:'Synthetic street',city:'Synthetic city',country:'VN'},roomTypes:[],mediaAssets:[],policies:[],faqs:[],amenityCategories:[]};
const change={id:'00000000-0000-4000-8000-0000000000c3',hotelId:id,previousType:'HOTEL',previousTypeLabel:'Hotel',requestedType:'VILLA',requestedTypeLabel:'Villa',status:'PENDING',createdAt:'2026-11-04T00:00:00Z',rejectionReason:null};
async function login(page:Page,role='OWNER') {await page.addInitScript(({owner,role})=>{localStorage.setItem('token','synthetic-type-token');localStorage.setItem('user',JSON.stringify({userId:owner,role,fullName:'Synthetic User'}));},{owner,role});}
async function mock(page:Page,respond:(url:URL,method:string,body:Record<string,unknown>|null)=>{status?:number;json?:unknown}|undefined){
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url()),method=route.request().method();
  if(u.port==='8080'){
   if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
   const body=route.request().headers()['content-type']?.includes('application/json')?route.request().postDataJSON():null;
   const response=respond(u,method,body);
   if(response)return route.fulfill({headers:cors,...response});
   if(u.pathname.endsWith('/accommodation-types'))return route.fulfill({headers:cors,json:catalog});
   if(u.pathname==='/cities')return route.fulfill({headers:cors,json:[{id,name:'Synthetic city'}]});
   if(u.pathname.includes('/stats/'))return route.fulfill({headers:cors,json:{totalReviews:0,averageRating:0,ratingDistribution:{}}});
   if(u.pathname.includes('/reviews/'))return route.fulfill({headers:cors,json:{content:[],totalElements:0,totalPages:0}});
   return route.fulfill({headers:cors,json:[]});
  }
  if(u.origin!=='http://127.0.0.1:3300')return route.abort();
  if(u.pathname==='/api/auth/session')return route.fulfill({json:null});
  return route.continue();
 });
}
test('create catalog error has retry and no default selection',async({page})=>{
 await login(page);let failing=true;
 await mock(page,u=>u.pathname.endsWith('/accommodation-types')?{status:failing?503:200,json:failing?{}:catalog}:undefined);
 await page.goto('/host/hotels/newHotel');
 await expect(page.getByRole('alert').filter({hasText:'Không tải được danh mục'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Loại hình lưu trú',exact:true})).toHaveValue('');
 failing=false;await page.getByRole('button',{name:'Thử lại danh mục'}).click();
 await expect(page.getByRole('combobox',{name:'Loại hình lưu trú',exact:true})).toBeEnabled();
 await expect(page.getByRole('combobox',{name:'Loại hình lưu trú',exact:true})).toHaveValue('');
});
test('host creates with selected type and retains selection after submit error',async({page})=>{
 await login(page);let captured:Record<string,unknown>|null|undefined;
 await mock(page,(u,method,body)=>u.pathname==='/hotels'&&method==='POST'?(captured=body,{status:503,json:{message:'Synthetic failure'}}):undefined);
 await page.goto('/host/hotels/newHotel');
 await page.getByRole('combobox',{name:'Loại hình lưu trú',exact:true}).selectOption('GUEST_HOUSE');
 await page.getByPlaceholder('Vi du: Blue Sea Resort').fill('Synthetic property');
 await page.getByPlaceholder('Nhap ten thanh pho...').fill('Synthetic');await page.getByRole('button',{name:'Synthetic city Vietnam',exact:true}).click();
 await page.getByPlaceholder('123 Nguyen Van Linh').fill('Synthetic street');
 await page.getByPlaceholder('0123456789',{exact:true}).fill('Synthetic license');
 await page.getByPlaceholder('Tùy chọn',{exact:true}).fill('Synthetic tax');
 await page.getByPlaceholder('012345678901',{exact:true}).fill('Synthetic identity');
 const file={name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('synthetic')};
 for(const i of [0,2,3,4])await page.locator('input[type=file]').nth(i).setInputFiles(file);
 await page.getByRole('button',{name:'Tạo khách sạn',exact:true}).click();
 await expect.poll(()=>captured?.accommodationType).toBe('GUEST_HOUSE');
 await expect(page.getByRole('combobox',{name:'Loại hình lưu trú',exact:true})).toHaveValue('GUEST_HOUSE');
});
test('approved host proposes separately, keeps published type, and reloads pending metadata',async({page})=>{
 await login(page);let pending=false;
 await mock(page,(u,method,body)=>{
  if(u.pathname.endsWith('/preview'))return{json:hotel};
  if(u.pathname.endsWith('/accommodation-type-changes')){
   if(method==='POST'){expect(body).toEqual({accommodationType:'VILLA'});pending=true;return{json:change};}
   return{json:pending?[change]:[]};
  }
 });
 await page.goto('/host/hotels/'+id);
 const panel=page.getByRole('region',{name:'Quản lý loại hình lưu trú'});
 await panel.getByRole('combobox').selectOption('VILLA');await panel.getByRole('button',{name:'Gửi đề xuất loại hình'}).click();
 await expect(panel.getByText('Đề xuất đang chờ duyệt:',{exact:false})).toContainText('Villa');
 await expect(panel.getByText('Loại hiện tại:',{exact:false})).toContainText('Hotel');
 await page.reload();await expect(panel.getByText('Đề xuất đang chờ duyệt:',{exact:false})).toContainText('Villa');
});
test('legacy draft remains unclassified until explicit save and then reloads actual code',async({page})=>{
 await login(page);let classified=false;
 await mock(page,(u,method,body)=>{
  if(u.pathname.endsWith('/preview'))return{json:{...hotel,approvedStatus:'DRAFT',accommodationType:classified?'APARTMENT':null,accommodationTypeLabel:classified?'Apartment':null}};
  if(u.pathname.endsWith('/accommodation-type-changes')){if(method==='POST'){expect(body?.accommodationType).toBe('APARTMENT');classified=true;return{json:null};}return{json:[]};}
 });
 await page.goto('/host/hotels/'+id);const panel=page.getByRole('region',{name:'Quản lý loại hình lưu trú'});
 await expect(panel.getByText('Loại hiện tại:',{exact:false})).toContainText('Chưa phân loại');expect(classified).toBe(false);
 await panel.getByRole('combobox').selectOption('APARTMENT');await panel.getByRole('button',{name:'Lưu loại hình',exact:true}).click();
 await expect(panel.getByText('Loại hiện tại:',{exact:false})).toContainText('Apartment');await page.reload();await expect(panel.getByRole('combobox')).toHaveValue('APARTMENT');
});
for(const approve of [true,false])test('admin '+(approve?'approves':'rejects')+' a specific request and handles stale conflict',async({page})=>{
 await login(page,'ADMIN');let rows=[change],first=true,decisions=0;
 await mock(page,(u,method,body)=>{
  if(u.pathname.endsWith('/accommodation-type-changes/pending'))return{json:rows};
  if(u.pathname.includes('/accommodation-type-changes/'+change.id+'/')){
   expect(u.pathname.endsWith(approve?'/approve':'/reject')).toBe(true);if(!approve)expect(body?.reason).toBe('Synthetic reason');
   decisions++;if(first)return{status:409,json:{}};rows=[];return{json:{...change,status:approve?'APPROVED':'REJECTED'}};
  }
 });
 await page.goto('/admin/pending');const panel=page.getByRole('region',{name:'Duyệt loại hình lưu trú'});
 if(!approve)await panel.getByRole('textbox').fill('Synthetic reason');
 await panel.getByRole('button',{name:approve?'Chấp thuận loại hình':'Từ chối loại hình',exact:true}).click();
 await expect(panel.getByRole('alert')).toContainText('Hãy tải lại');expect(decisions).toBe(1);
 first=false;await panel.getByRole('button',{name:'Tải lại yêu cầu loại hình'}).click();
 await panel.getByRole('button',{name:approve?'Chấp thuận loại hình':'Từ chối loại hình',exact:true}).click();
 await expect(panel.getByText('Không có yêu cầu loại hình chờ duyệt.')).toBeVisible();expect(decisions).toBe(2);
});
for(const classified of [true,false])test('public detail displays '+(classified?'approved label':'unclassified legacy'),async({page})=>{
 await mock(page,u=>u.pathname==='/api/hotel/hotels/'+id?{json:{...hotel,accommodationType:classified?'VILLA':null,accommodationTypeLabel:classified?'Villa':null}}:undefined);
 await page.goto('/hotel/'+id);
 await expect(page.getByText('Loại hình lưu trú:',{exact:false}).first()).toContainText(classified?'Villa':'Chưa phân loại');
});

test('initial hotel approval sends reviewed revision and requires reload after stale rejection',async({page})=>{
 await login(page,'ADMIN');let revision=7;const attempts:string[]=[];
 page.on('dialog',dialog=>void dialog.accept());
 await mock(page,(u)=>{
  if(u.pathname==='/api/hotel/hotels/pending/'+id)return{json:{...hotel,revision,owner:{id:owner,fullName:'Synthetic Owner',email:'synthetic@example.test'},accommodationTypeLabel:revision===7?'Hotel':'Guest House'}};
  if(u.pathname==='/api/hotel/hotels/'+id+'/approve'){
   attempts.push(u.searchParams.get('revision')!);if(revision===7){revision=8;return{status:409,json:{}};}return{json:{}};
  }
 });
 await page.goto('/admin/pending/'+id);
 await page.getByRole('button',{name:'Duyệt khách sạn',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Thông tin có thể đã thay đổi'})).toBeVisible();
 expect(attempts).toEqual(['7']);await expect(page.getByRole('button',{name:'Duyệt khách sạn',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Tải lại để xét duyệt'}).click();
 await expect(page.getByText('Loại hình lưu trú: Guest House',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Duyệt khách sạn',exact:true}).click();
 await expect.poll(()=>attempts).toEqual(['7','8']);
});
test('admin type review detail uses authorized preview in the admin area',async({page})=>{
 await login(page,'ADMIN');let preview=false,approved=false;
 await mock(page,u=>{
  if(u.pathname.endsWith('/preview')){preview=true;return{json:approved?{...hotel,accommodationType:'VILLA',accommodationTypeLabel:'Villa'}:hotel};}
  if(u.pathname.endsWith('/accommodation-type-changes/pending'))return{json:approved?[]:[change]};
  if(u.pathname.endsWith('/'+change.id+'/approve')){approved=true;return{json:{...change,status:'APPROVED'}};}
 });
 await page.goto('/admin/pending');await page.getByRole('link',{name:'Xem cơ sở '+id,exact:true}).click();
 await expect(page).toHaveURL(new RegExp('/admin/accommodation-types/'+id));
 await expect(page.getByText('Loại công bố: Hotel',{exact:true})).toBeVisible();expect(preview).toBe(true);
 await page.getByRole('button',{name:'Chấp thuận loại hình',exact:true}).click();
 await expect(page.getByText('Loại công bố: Villa',{exact:true})).toBeVisible();
});
