import {test,expect,type Page} from '@playwright/test';
const id='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222';
const marker='synthetic-private-identity-marker';
const hotel={textEncoding:'PLAIN_V1',id,name:'Synthetic document hotel',description:'Synthetic description',ownerId:owner,starRating:3,
 approvedStatus:'REJECTED',isActive:false,accommodationType:'HOTEL',cityId:1,address:{street:'Synthetic',city:'Synthetic',country:'VN'},
 roomTypes:[],mediaAssets:[],amenityCategories:[],policies:[],faqs:[],questions:[]};
const urls={businessLicenseUrl:'https://signed.example.invalid/business.pdf',operationLicenseUrl:'https://signed.example.invalid/operation.pdf',
 ownerIdentityFrontUrl:'https://signed.example.invalid/front.png',ownerIdentityBackUrl:'https://signed.example.invalid/back.png'};
const docs={hotelId:id,approvedStatus:'REJECTED',businessLicenseNumber:'SYNTHETIC-LICENSE',taxId:'0011223344',operationLicenseNumber:'SYNTHETIC-OPERATION',ownerIdentityNumber:marker,...urls};
const cors={'access-control-allow-origin':'http://127.0.0.1:3312','access-control-allow-headers':'authorization,content-type,accept','access-control-allow-methods':'GET,PUT,POST,OPTIONS'};
async function prepare(page:Page,mode:'recover'|'empty'|'refresh-failure'|'upload') {
 let reads=0,writes=0,uploads=0;const logs:string[]=[];page.on('console',m=>logs.push(m.text()));
 await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-document-token');localStorage.setItem('user',JSON.stringify({userId:owner,fullName:'Synthetic owner',role:'OWNER'}));},{owner});
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.port==='8080') {
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(u.pathname.endsWith('/documents')) {
    if(route.request().method()==='POST'){uploads++;return route.fulfill({headers:cors,json:{message:'Tải tài liệu xác thực thành công'}});}
    reads++;
    if((mode==='recover'&&reads===1)||(mode==='refresh-failure'&&writes>0))return route.fulfill({status:503,headers:cors,json:{message:marker}});
    return route.fulfill({headers:cors,json:mode==='empty'?{hotelId:id,approvedStatus:'DRAFT'}:{...docs,approvedStatus:writes?'DRAFT':docs.approvedStatus}});
   }
   if(u.pathname.endsWith('/preview'))return route.fulfill({headers:cors,json:{...hotel,approvedStatus:writes?'DRAFT':hotel.approvedStatus}});
   if(u.pathname.endsWith('/'+id) && route.request().method()==='PUT'){writes++;return route.fulfill({headers:cors,json:{...hotel,approvedStatus:'DRAFT'}});}
   return route.fulfill({headers:cors,json:[]});
  }
  if(u.origin!=='http://127.0.0.1:3312')return route.abort();
  if(u.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/host/hotels/'+id);await expect(page.getByRole('heading',{name:'Giấy tờ pháp lý',exact:true})).toBeVisible();
 return {logs,reads:()=>reads,writes:()=>writes,uploads:()=>uploads};
}
test('storage outage is unknown and retry restores documents without logging private values',async({page})=>{
 const state=await prepare(page,'recover'),section=page.locator('#documents');
 await expect(section.getByRole('alert')).toContainText('Chưa thể xác định tài liệu đã tải lên');
 await expect(section.getByText('Chưa có',{exact:true})).toHaveCount(0);await expect(section.getByRole('button',{name:'Chỉnh sửa'})).toBeDisabled();
 await section.getByRole('button',{name:'Thử tải lại hồ sơ'}).click();
 await expect(section.getByText(marker,{exact:true})).toBeVisible();await expect(section.getByRole('alert')).toHaveCount(0);
 await expect(section.getByRole('button',{name:'Chỉnh sửa'})).toBeEnabled();expect(state.reads()).toBe(2);expect(state.logs.join('\n')).not.toContain(marker);
});
test('genuinely empty source documents retain the ordinary missing-document UI',async({page})=>{
 await prepare(page,'empty');const section=page.locator('#documents');
 await expect(section.getByText('Chưa có',{exact:true})).toHaveCount(3);
 await expect(section.getByText('Tùy chọn',{exact:true})).toHaveCount(1);await expect(section.getByRole('alert')).toHaveCount(0);
 await expect(section.getByRole('button',{name:'Chỉnh sửa'})).toBeEnabled();
});
test('successful file upload accepts the controller acknowledgement exactly once and restores its preview',async({page})=>{
 const state=await prepare(page,'upload'),section=page.locator('#documents');
 await section.getByRole('button',{name:'Chỉnh sửa'}).click();
 await page.locator('form input[type="file"]').first().setInputFiles({name:'synthetic-license.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
 await page.getByRole('button',{name:'Lưu giấy tờ',exact:true}).click();
 await expect.poll(state.uploads).toBe(1);await expect.poll(state.reads).toBe(2);
 await expect(section.getByRole('alert')).toHaveCount(0);await expect(section.getByText(marker,{exact:true})).toBeVisible();
 expect(state.writes()).toBe(1);expect(state.logs.join('\n')).not.toContain(marker);
});
test('successful metadata save does not invent pending approval or leave stale previews after refresh failure',async({page})=>{
 const state=await prepare(page,'refresh-failure'),section=page.locator('#documents');
 await section.getByRole('button',{name:'Chỉnh sửa'}).click();await page.getByRole('button',{name:'Lưu giấy tờ',exact:true}).click();
 await expect.poll(state.writes).toBe(1);
 await expect(section.getByRole('alert')).toContainText('Chưa thể xác định tài liệu đã tải lên');
 await expect(section.getByText('Chưa có',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Đã cập nhật hồ sơ. Kiểm tra trạng thái hiện tại trước khi gửi duyệt.',{exact:true})).toBeVisible();
 await expect(page.getByText('Hồ sơ và tài liệu pháp lý đã được gửi lại thành công! Trạng thái chuyển về "Chờ duyệt" để Quản trị viên thẩm định.',{exact:true})).toHaveCount(0);
 expect(state.logs.join('\n')).not.toContain(marker);
});
