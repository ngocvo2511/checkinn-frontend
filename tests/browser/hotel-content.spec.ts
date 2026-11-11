import {test,expect,type Page} from '@playwright/test';
const id='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222';
const marker='synthetic-private-content-error';
const hotel={textEncoding:'PLAIN_V1',id,name:'Synthetic content hotel',description:'Synthetic description',ownerId:owner,starRating:3,
 approvedStatus:'DRAFT',isActive:false,accommodationType:'HOTEL',cityId:1,address:{street:'Synthetic',city:'Synthetic',country:'VN'},
 roomTypes:[],mediaAssets:[],amenityCategories:[],policies:[{category:'Synthetic policy',content:'Original synthetic policy'}],
 faqs:[{question:'Original synthetic question',answer:'Original synthetic answer'}]};
const cors={'access-control-allow-origin':'http://127.0.0.1:3314','access-control-allow-headers':'authorization,content-type,accept','access-control-allow-methods':'GET,PUT,OPTIONS'};
async function prepare(page:Page,kind:'policies'|'questions',fail=false,pending?:Promise<void>){
 const writes:unknown[]=[];const logs:string[]=[];page.on('console',message=>logs.push(message.text()));
 await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-content-token');localStorage.setItem('user',JSON.stringify({userId:owner,fullName:'Synthetic owner',role:'OWNER'}));},{owner});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.port==='8080'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname.endsWith('/'+kind)&&route.request().method()==='PUT'){
    const payload=route.request().postDataJSON();writes.push(payload);if(pending)await pending;
    if(fail)return route.fulfill({status:503,headers:cors,json:{message:marker}});
    return route.fulfill({headers:cors,json:{...hotel,[kind==='questions'?'faqs':'policies']:payload}});
   }
   if(url.pathname.endsWith('/policies/categories'))return route.fulfill({headers:cors,json:[{type:'Synthetic policy'}]});
   if(url.pathname.endsWith('/documents'))return route.fulfill({headers:cors,json:{hotelId:id,approvedStatus:'DRAFT'}});
   if(url.pathname.endsWith('/preview'))return route.fulfill({headers:cors,json:hotel});
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3314')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/host/hotels/'+id);
 const section=page.locator(kind==='questions'?'#faqs':'#policies');await section.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();
 const modal=page.locator('div.fixed').filter({has:page.getByRole('heading',{name:kind==='questions'?'Chỉnh sửa FAQ':'Chỉnh sửa chính sách',exact:true})});
 return {section,modal,writes,logs};
}
for(const kind of ['policies','questions'] as const){
 test(`${kind}: blank draft rows are rejected without silently clearing saved content`,async({page})=>{
  const state=await prepare(page,kind);await state.modal.locator('textarea').fill(' ');
  if(kind==='questions')await state.modal.locator('input').fill(' ');
  await state.modal.getByRole('button',{name:kind==='questions'?'Lưu FAQ':'Lưu chính sách',exact:true}).click();
  await expect(state.modal.getByRole('alert')).toContainText('Hãy hoàn thiện hoặc xóa dòng không dùng');
  expect(state.writes).toHaveLength(0);await expect(state.section.getByText(kind==='questions'?'Original synthetic question':'Original synthetic policy',{exact:true})).toBeVisible();
 });
 test(`${kind}: failed update retains the draft and never retries or logs the upstream body`,async({page})=>{
  const state=await prepare(page,kind,true);await state.modal.locator('textarea').fill('New synthetic content');
  await state.modal.getByRole('button',{name:kind==='questions'?'Lưu FAQ':'Lưu chính sách',exact:true}).click();
  await expect(state.modal.getByRole('alert')).toContainText('Chưa thể xác nhận nội dung đã lưu');
  await expect(state.modal.locator('textarea')).toHaveValue('New synthetic content');expect(state.writes).toHaveLength(1);expect(state.logs.join('\n')).not.toContain(marker);
 });
 test(`${kind}: successful update displays the acknowledged content`,async({page})=>{
  const state=await prepare(page,kind);await state.modal.locator('textarea').fill('New synthetic content');
  await state.modal.getByRole('button',{name:kind==='questions'?'Lưu FAQ':'Lưu chính sách',exact:true}).click();
  await expect(state.modal).toHaveCount(0);await expect(state.section.getByText('New synthetic content',{exact:true})).toBeVisible();expect(state.writes).toHaveLength(1);
 });
}

for(const kind of ['policies','questions'] as const)test(`${kind}: pending save freezes draft and close controls`,async({page})=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 const state=await prepare(page,kind,false,pending);
 try{
  await state.modal.getByRole('button',{name:kind==='questions'?'Lưu FAQ':'Lưu chính sách',exact:true}).click();
  await expect.poll(()=>state.writes.length).toBe(1);
  await expect(state.modal.locator('textarea')).toBeDisabled();
  for(const button of await state.modal.getByRole('button').all())await expect(button).toBeDisabled();
  release();await expect(state.modal).toHaveCount(0);expect(state.writes).toHaveLength(1);
 }finally{release();}
});
