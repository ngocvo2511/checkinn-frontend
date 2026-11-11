import {test,expect,type Page} from '@playwright/test';
const id='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222';
const marker='synthetic-private-amenity-error';
const hotel={textEncoding:'PLAIN_V1',id,name:'Synthetic amenity hotel',description:'Synthetic description',ownerId:owner,starRating:3,
 approvedStatus:'DRAFT',isActive:false,accommodationType:'HOTEL',cityId:1,address:{street:'Synthetic',city:'Synthetic',country:'VN'},
 roomTypes:[],mediaAssets:[],policies:[{category:'Synthetic policy',content:'Synthetic policy content'}],faqs:[],amenityCategories:[{id:'synthetic-category',title:'Synthetic category',items:[{id:'item-a',title:'Original synthetic item',verifiedCodes:[]},{id:'item-b',title:'Second synthetic item',verifiedCodes:[]}]}]};
const cors={'access-control-allow-origin':'http://127.0.0.1:3315','access-control-allow-headers':'authorization,content-type,accept','access-control-allow-methods':'GET,PUT,OPTIONS'};
async function prepare(page:Page,fail=false,recover=false,kind:'amenities'|'policies'='amenities',pending?:Promise<void>){
 let categoryReads=0;
 const writes:any[]=[];const logs:string[]=[];page.on('console',message=>logs.push(message.text()));
 await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-amenity-token');localStorage.setItem('user',JSON.stringify({userId:owner,fullName:'Synthetic owner',role:'OWNER'}));},{owner});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.port==='8080'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname.endsWith('/amenities')&&route.request().method()==='PUT'){
    const payload=route.request().postDataJSON();writes.push(payload);if(pending)await pending;
    if(fail)return route.fulfill({status:503,headers:cors,json:{message:marker}});
    return route.fulfill({headers:cors,json:{...hotel,amenityCategories:payload.amenityCategories.map((category:any,n:number)=>({id:'new-category-'+n,title:category.title,items:category.amenities.map((item:any,m:number)=>({id:'new-item-'+m,title:item.title,verifiedCodes:[]}))}))}});
   }
   if(url.pathname.endsWith('/'+kind+'/categories')){
    categoryReads++;
    return recover&&categoryReads===1?route.fulfill({status:503,headers:cors,json:{message:marker}}):route.fulfill({headers:cors,json:[]});
   }
   if(url.pathname.endsWith('/documents'))return route.fulfill({headers:cors,json:{hotelId:id,approvedStatus:'DRAFT'}});
   if(url.pathname.endsWith('/preview'))return route.fulfill({headers:cors,json:hotel});
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3315')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/host/hotels/'+id,{waitUntil:'domcontentloaded'});const section=page.locator(kind==='amenities'?'#amenities':'#policies');
 await section.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();
 const modal=page.locator('div.fixed').filter({has:page.getByRole('heading',{name:kind==='amenities'?'Chỉnh sửa tiện ích':'Chỉnh sửa chính sách',exact:true})});
 return {section,modal,writes,logs,categoryReads:()=>categoryReads};
}
test('blank item is not silently removed from the whole replacement',async({page})=>{
 const state=await prepare(page);await state.modal.getByPlaceholder('Nhập tiện ích (vd: Lễ tân 24h)').first().fill(' ');
 await state.modal.getByRole('button',{name:'Lưu tiện ích',exact:true}).click();
 await expect(state.modal.getByRole('alert')).toContainText('Hãy hoàn thiện hoặc xóa dòng không dùng');expect(state.writes).toHaveLength(0);
 await expect(state.section.getByText('Original synthetic item',{exact:true})).toBeVisible();
});
test('503 retains the draft and does not retry or log upstream content',async({page})=>{
 const state=await prepare(page,true);const input=state.modal.getByPlaceholder('Nhập tiện ích (vd: Lễ tân 24h)').first();await input.fill('New synthetic item');
 await state.modal.getByRole('button',{name:'Lưu tiện ích',exact:true}).click();
 await expect(state.modal.getByRole('alert')).toContainText('Chưa thể xác nhận nội dung đã lưu');await expect(input).toHaveValue('New synthetic item');expect(state.writes).toHaveLength(1);expect(state.logs.join('\n')).not.toContain(marker);
});
test('successful replacement uses the canonical items acknowledgement',async({page})=>{
 const state=await prepare(page);await state.modal.getByPlaceholder('Nhập tiện ích (vd: Lễ tân 24h)').first().fill('New synthetic item');await state.modal.getByRole('button',{name:'Lưu tiện ích',exact:true}).click();
 await expect(state.modal).toHaveCount(0);await expect(state.section.getByText('New synthetic item',{exact:true})).toBeVisible();expect(state.writes).toHaveLength(1);
});
test('explicitly removing all categories can clear the optional collection',async({page})=>{
 const state=await prepare(page);await state.modal.getByTitle('Xóa danh mục',{exact:true}).click();await state.modal.getByRole('button',{name:'Lưu tiện ích',exact:true}).click();
 await expect(state.modal).toHaveCount(0);expect(state.writes).toEqual([{amenityCategories:[]}]);expect(state.categoryReads()).toBe(1);await expect(state.section.getByText('Original synthetic item',{exact:true})).toHaveCount(0);
});

for(const kind of ['amenities','policies'] as const)test(`${kind}: category failure has bounded reads and explicit retry preserves the draft`,async({page})=>{
 const state=await prepare(page,false,true,kind);
 await expect(state.modal.getByRole('alert')).toContainText(kind==='amenities'?'Không thể tải danh mục gợi ý':'Không thể tải danh mục chính sách');expect(state.categoryReads()).toBe(1);
 if(kind==='policies')await expect(state.modal.locator('select')).toHaveValue('Synthetic policy');
 await state.modal.getByRole('button',{name:kind==='amenities'?'Thử tải lại danh mục tiện ích':'Thử tải lại danh mục chính sách'}).click();
 await expect(state.modal.getByRole('alert')).toHaveCount(0);expect(state.categoryReads()).toBe(2);expect(state.logs.join('\n')).not.toContain(marker);
 if(kind==='amenities')await expect(state.modal.getByPlaceholder('Nhập tiện ích (vd: Lễ tân 24h)').first()).toHaveValue('Original synthetic item');
 else await expect(state.modal.locator('select')).toHaveValue('Synthetic policy');
});

test('amenities: pending save freezes draft and close controls',async({page})=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 const state=await prepare(page,false,false,'amenities',pending);
 try{
  await state.modal.getByRole('button',{name:'Lưu tiện ích',exact:true}).click();
  await expect.poll(()=>state.writes.length).toBe(1);
  for(const input of await state.modal.locator('input').all())await expect(input).toBeDisabled();
  for(const button of await state.modal.getByRole('button').all())await expect(button).toBeDisabled();
  release();await expect(state.modal).toHaveCount(0);expect(state.writes).toHaveLength(1);
 }finally{release();}
});
