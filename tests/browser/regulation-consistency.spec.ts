import {test,expect,type Page} from '@playwright/test';
const base={regulationKey:'SYNTHETIC_RATE',name:'Synthetic rate',value:'2',description:'Synthetic description',active:true,version:1};
const cors={'access-control-allow-origin':'http://127.0.0.1:3311','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,PUT,OPTIONS'};
async function prepare(page:Page,mode:'deferred'|'conflict'|'history') {
 let release:(()=>void)|undefined;const saved:unknown[]=[];
 await page.addInitScript(()=>{localStorage.setItem('token','synthetic-regulation-browser-token');localStorage.setItem('user',JSON.stringify({userId:'a3000000-0000-0000-0000-000000000001',fullName:'Synthetic admin',role:'ADMIN'}));});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.port==='8080') {
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname==='/api/regulations/snapshots')return route.fulfill({status:mode==='history'?503:200,headers:cors,json:mode==='history'?{message:'synthetic-private-audit-detail'}:[]});
   if(url.pathname==='/api/regulations')return route.fulfill({headers:cors,json:[base,{...base,regulationKey:'SECOND_RATE',name:'Second rate'}]});
   if(route.request().method()==='PUT' && url.pathname.startsWith('/api/regulations/')) {
    saved.push(route.request().postDataJSON());
    if(mode==='conflict')return route.fulfill({status:409,headers:cors,json:{code:'REGULATION_CONFLICT',message:'synthetic-private-conflict-detail'}});
    await new Promise<void>(resolve=>{release=resolve;});
    return route.fulfill({headers:cors,json:{...base,...saved[0] as object,version:2}});
   }
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3311')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/admin/settings');await expect(page.locator('input[value="Synthetic rate"]')).toBeVisible();
 return {saved,release:()=>release?.()};
}
test('strict value validation and one in-flight save protect versioned drafts',async({page})=>{
 const state=await prepare(page,'deferred');const value=page.locator('main input');
 const card=page.locator('div.rounded-2xl').filter({has:page.getByRole('heading',{name:'Synthetic rate',exact:true})}).last();
 const amount=card.locator('input').nth(1);
 await amount.fill('2abc');await expect(card.getByRole('button',{name:'Lưu thay đổi'})).toBeDisabled();
 await amount.fill('3');await card.getByRole('button',{name:'Lưu thay đổi'}).click();
 await expect.poll(()=>state.saved.length).toBe(1);
 await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
 expect(await value.evaluateAll(nodes=>nodes.every(node=>(node as HTMLInputElement).disabled))).toBe(true);
 expect(state.saved[0]).toMatchObject({value:'3',version:1});
 state.release();await expect(card.getByRole('button',{name:'Lưu thay đổi'})).toBeEnabled();await expect(amount).toHaveValue('3');
});
test('conflict retains the edited value and asks for reload without exposing backend details',async({page})=>{
 await prepare(page,'conflict');const input=page.locator('input').nth(1);await input.fill('4');
 await page.getByRole('button',{name:'Lưu thay đổi'}).first().click();
 await expect(page.getByText('Quy định đã được thay đổi. Hãy tải lại dữ liệu trước khi lưu.',{exact:true})).toBeVisible();
 await expect(input).toHaveValue('4');await expect(page.getByText('synthetic-private-conflict-detail')).toHaveCount(0);
});
test('history failure is explicit while editable configuration remains available',async({page})=>{
 await prepare(page,'history');
 await expect(page.getByText('Không thể tải lịch sử thay đổi quy định. Vui lòng thử lại sau.',{exact:true})).toBeVisible();
 await expect(page.getByText('Chưa có snapshot quy định nào.',{exact:true})).toHaveCount(0);
 await expect(page.getByText('synthetic-private-audit-detail')).toHaveCount(0);
});
