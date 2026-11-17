import {test,expect,type Page} from '@playwright/test';
const hotel='f1000000-0000-0000-0000-000000000001',room='f1000000-0000-0000-0000-000000000002',owner='f1000000-0000-0000-0000-000000000003';
const request={id:'f1000000-0000-0000-0000-000000000004',room_id:room,hotel_id:hotel,previous_quantity:null,proposed_quantity:3,source:'Synthetic room register',requested_by:owner,requested_at:'2026-11-07T00:00:00Z',status:'PENDING',revision:1,reviewed_by:null,reviewed_at:null,review_reason:null};
const initial={revision:0,managed:false,verified:false,currentQuantity:null,latestRequest:null,approvedRequest:null};
const cors={'access-control-allow-origin':'http://127.0.0.1:3300','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
async function mock(page:Page,admin=false,fail=false,start:any=initial,success=false){
 let state:any=start;let decided=false;const proposals:any[]=[],writes:any[]=[],reviews:any[]=[];
 await page.addInitScript(({owner,admin})=>{localStorage.setItem('token','synthetic-inventory-token');localStorage.setItem('user',JSON.stringify({userId:owner,role:admin?'ADMIN':'OWNER',fullName:'Synthetic inventory actor'}));},{owner,admin});
 await page.route('**/*',async route=>{const url=new URL(route.request().url()),method=route.request().method();
  if(url.port==='8080'){
   if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname.endsWith('/inventory-review')){
    if(method==='POST'){proposals.push(route.request().postDataJSON());if(fail)return route.fulfill({status:409,headers:cors,json:{}});state={...initial,managed:true,revision:1,latestRequest:request};return route.fulfill({status:201,headers:cors,json:request});}
    return route.fulfill({headers:cors,json:state});
   }
   if(url.pathname.endsWith('/inventory-reviews'))return fail?route.fulfill({status:503,headers:cors,json:{}}):route.fulfill({headers:cors,json:decided?[]:[request]});
   if(url.pathname.endsWith('/review')){const body=route.request().postDataJSON();reviews.push(body);if(success){decided=true;return route.fulfill({headers:cors,json:{...request,status:body.approve?'APPROVED':'REJECTED',revision:2,reviewed_by:owner,reviewed_at:'2026-11-07T00:10:00Z',review_reason:body.reason}});}return route.fulfill({status:409,headers:cors,json:{}});}
   if(url.pathname.endsWith('/preview'))return route.fulfill({headers:cors,json:{textEncoding:'PLAIN_V1',id:room,hotelId:hotel,name:'Synthetic room',description:'Initial',basePrice:200000,totalRooms:null,capacity:{adults:2,children:0},amenities:[],isActive:true,mediaAssets:[]}});
   if(method==='PUT'){writes.push(route.request().postDataJSON());return route.fulfill({headers:cors,json:{}});}
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3300')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 return {proposals,writes,reviews};
}
test('owner proposes unknown stock without changing price or losing unsaved description',async({page})=>{
 const api=await mock(page);await page.goto(`/host/hotels/${hotel}/rooms/${room}`);
 await expect(page.getByText('Phòng chưa thể nhận booking mới. Cần ADMIN phê duyệt số phòng và nguồn xác minh.')).toBeVisible();
 await expect(page.getByRole('spinbutton',{name:'Số lượng phòng',exact:true})).toBeDisabled();
 await page.getByPlaceholder('Mô tả về phòng...').fill('Unsaved description');
 await page.getByRole('spinbutton',{name:'Số phòng đề xuất',exact:true}).fill('3');await page.getByRole('textbox',{name:'Nguồn xác minh số phòng'}).fill('Synthetic room register');
 await page.getByRole('button',{name:'Gửi đề xuất số phòng'}).click();
 await expect(page.getByRole('status').filter({hasText:'Đã gửi đề xuất'})).toContainText('Đã gửi đề xuất');await expect(page.getByText('Số phòng đang lưu: Chưa biết · Chưa xác minh nguồn')).toBeVisible();
 expect(api.proposals).toEqual([{quantity:3,revision:0,source:'Synthetic room register'}]);expect(api.writes).toEqual([]);
 await expect(page.getByPlaceholder('Mô tả về phòng...')).toHaveValue('Unsaved description');
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect.poll(()=>api.writes.length).toBe(1);expect(api.writes[0]).toEqual({description:'Unsaved description'});
});
test('stale owner proposal remains editable and is never retried automatically',async({page})=>{
 const api=await mock(page,false,true);await page.goto(`/host/hotels/${hotel}/rooms/${room}`);
 await page.getByRole('spinbutton',{name:'Số phòng đề xuất',exact:true}).fill('3');await page.getByRole('textbox',{name:'Nguồn xác minh số phòng'}).fill('Synthetic evidence');await page.getByRole('button',{name:'Gửi đề xuất số phòng'}).click();
 await expect(page.getByRole('alert').filter({hasText:'Không gửi được'})).toBeVisible();expect(api.proposals.length).toBe(1);await expect(page.getByRole('textbox',{name:'Nguồn xác minh số phòng'})).toHaveValue('Synthetic evidence');
});
test('admin requires review reason and shows conflict without inventing successful approval',async({page})=>{
 const api=await mock(page,true);await page.goto('/admin/inventory-reviews');
 await expect(page.getByRole('button',{name:'Duyệt số phòng',exact:true})).toBeDisabled();await page.getByRole('textbox',{name:'Lý do quyết định'}).fill('Manual checked source');await page.getByRole('button',{name:'Duyệt số phòng',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Không duyệt được'})).toBeVisible();expect(api.reviews).toEqual([{approve:true,reason:'Manual checked source',revision:1}]);await expect(page.getByText('Trạng thái: PENDING')).toBeVisible();
});
test('admin queue outage displays an error rather than no pending requests',async({page})=>{
 await mock(page,true,true);await page.goto('/admin/inventory-reviews');await expect(page.getByRole('alert').filter({hasText:'Không tải được'})).toBeVisible();await expect(page.getByText('Không có yêu cầu ở trang này.')).toHaveCount(0);
});

for(const approve of [true,false])test(`admin ${approve?'approval':'rejection'} refreshes queue after successful response`,async({page})=>{
 const api=await mock(page,true,false,initial,true);await page.goto('/admin/inventory-reviews');
 await page.getByRole('textbox',{name:'Lý do quyết định'}).fill('Reviewed source');
 await page.getByRole('button',{name:approve?'Duyệt số phòng':'Từ chối số phòng',exact:true}).click();
 await expect(page.getByText('Không có yêu cầu ở trang này.')).toBeVisible();
 expect(api.reviews).toEqual([{approve,reason:'Reviewed source',revision:1}]);
});

test('rejected owner can see reason and submit replacement with current revision',async({page})=>{
 const rejected={...request,status:'REJECTED',revision:2,reviewed_by:owner,reviewed_at:'2026-11-07T00:10:00Z',review_reason:'Evidence incomplete'};
 const api=await mock(page,false,false,{...initial,managed:true,revision:2,latestRequest:rejected});
 await page.goto(`/host/hotels/${hotel}/rooms/${room}`);
 await expect(page.getByText('Đề xuất gần nhất: 3 · REJECTED · Evidence incomplete')).toBeVisible();
 await expect(page.getByText('Phòng chưa thể nhận booking mới. Cần ADMIN phê duyệt số phòng và nguồn xác minh.')).toBeVisible();
 await page.getByRole('spinbutton',{name:'Số phòng đề xuất',exact:true}).fill('3');
 await page.getByRole('textbox',{name:'Nguồn xác minh số phòng'}).fill('Replacement evidence');
 await page.getByRole('button',{name:'Gửi đề xuất số phòng'}).click();
 await expect.poll(()=>api.proposals.length).toBe(1);
 expect(api.proposals[0]).toEqual({quantity:3,revision:2,source:'Replacement evidence'});
});
