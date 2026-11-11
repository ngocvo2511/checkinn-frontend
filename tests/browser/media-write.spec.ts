import {test,expect,type Page} from '@playwright/test';
const hotelId='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222',roomId='33333333-3333-4333-8333-333333333333';
const first='44444444-4444-4444-8444-444444444444',second='55555555-5555-4555-8555-555555555555',third='66666666-6666-4666-8666-666666666666';
const cors={'access-control-allow-origin':'http://127.0.0.1:3316','access-control-allow-headers':'authorization,content-type,accept','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'};
async function prepare(page:Page,kind:'hotel'|'room'|'newRoom',mode:'pending'|'upload'|'unknown'|'partial'|'success',failFirstRecovery=false){
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});const writes:string[]=[];let reads=0,recoveries=0;
 const logs:string[]=[],logReads:Promise<void>[]=[];page.on('console',message=>{logReads.push(Promise.all(message.args().map(async arg=>{logs.push(JSON.stringify(await arg.jsonValue().catch(()=>null)));})).then(()=>undefined));});
 const targetId=kind==='hotel'?hotelId:roomId,targetType=kind==='hotel'?'HOTEL':'ROOM_TYPE';
 const asset=(id:string,flag=false,sort=0)=>({id,targetId,targetType,url:'https://example.invalid/'+id+'.png?synthetic-private-media-signature',isThumbnail:flag,sortOrder:sort});
 let media=kind==='newRoom'?[]:[asset(first,true),asset(second,false,1)];
 const room=()=>({textEncoding:'PLAIN_V1',id:roomId,hotelId,name:'Synthetic room',description:'Synthetic description',basePrice:125000,totalRooms:2,isActive:true,capacity:{adults:2,children:0},amenities:[],mediaAssets:media});
 const hotel=()=>({textEncoding:'PLAIN_V1',id:hotelId,name:'Synthetic media hotel',description:'Synthetic description',ownerId:owner,starRating:3,approvedStatus:'DRAFT',isActive:false,accommodationType:'HOTEL',cityId:1,address:{street:'Synthetic',city:'Synthetic',country:'VN'},roomTypes:[],policies:[],faqs:[],amenityCategories:[],mediaAssets:media});
 await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-media-token');localStorage.setItem('user',JSON.stringify({userId:owner,fullName:'Synthetic owner',role:'OWNER'}));},{owner});
 page.on('dialog',dialog=>dialog.accept());
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),method=request.method();
  if(url.port==='8080'){
   if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname.endsWith('/api/v1')&&method==='POST')return route.fulfill({headers:cors,json:room()});
   if(url.pathname.includes('/medias')&&['POST','DELETE','PATCH'].includes(method)){
    writes.push(method);
    if(mode==='pending'||mode==='upload')await gate;
    if(method==='DELETE'){media=media.filter(row=>row.id!==first).map(row=>({...row,sortOrder:row.sortOrder-1}));return route.fulfill({headers:cors,body:'Deleted'});}
    if(mode==='partial')return route.fulfill({status:503,headers:cors,body:'synthetic-private-provider'});
    if(mode==='unknown'){media=kind==='newRoom'?[asset(third,true,0)]:[asset(first),asset(second,true,1)];return route.fulfill({headers:cors,json:{...asset(second,true,1),id:first}});}
    if(method==='POST'){const added=asset(third,kind==='newRoom',kind==='newRoom'?0:2);media=[...media,added];return route.fulfill({headers:cors,json:added});}
    media=media.map(row=>({...row,isThumbnail:row.id===second}));return route.fulfill({headers:cors,json:media.find(row=>row.id===second)});
   }
   if(url.pathname.endsWith('/medias/preview')){reads++;recoveries++;return failFirstRecovery&&recoveries===1?route.fulfill({status:503,headers:cors,body:'synthetic-private-recovery'}):route.fulfill({headers:cors,json:media});}
   if(url.pathname.endsWith('/inventory-review'))return route.fulfill({headers:cors,json:{revision:0,managed:false,verified:false,currentQuantity:2,latestRequest:null,approvedRequest:null}});
   if(url.pathname.endsWith('/documents'))return route.fulfill({headers:cors,json:{hotelId,approvedStatus:'DRAFT'}});
   if(url.pathname.endsWith('/preview')){reads++;return route.fulfill({headers:cors,json:kind==='hotel'?hotel():room()});}
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3316')return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/host/hotels/'+hotelId+(kind==='room'?'/rooms/'+roomId:kind==='newRoom'?'/rooms/new':''));
 if(kind==='newRoom'){await page.locator('input[type=text]').first().fill('Synthetic new room');await page.locator('input[type=number]').first().fill('125000');await page.getByRole('button',{name:'Thêm phòng',exact:true}).click();}
 const gallery=kind==='hotel'?page.locator('#photos'):page.getByRole('heading',{name:'Hình ảnh phòng',exact:true}).locator('..');
 await expect(gallery).toBeVisible();
 return {gallery,writes,release,recoveries:()=>recoveries,logs:async()=>{await Promise.all(logReads);return logs.join('\n');},reads:()=>reads};
}
for(const kind of ['hotel','room'] as const){
 for(const mode of ['pending','upload'] as const)test(`${kind}: ${mode} locks all media controls until acknowledgement`,async({page})=>{
  const state=await prepare(page,kind,mode);
  try{
   if(mode==='pending'){await state.gallery.hover();await state.gallery.getByTitle('Đặt làm ảnh đại diện').click();}
   else await state.gallery.locator('input[type=file]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('synthetic')});
   await expect.poll(()=>state.writes.length).toBe(1);
   await expect(state.gallery.locator('input[type=file]')).toBeDisabled();
   for(const button of await state.gallery.getByRole('button').all())await expect(button).toBeDisabled();
   state.release();await expect(state.gallery.locator('input[type=file]')).toBeEnabled();expect(state.writes).toHaveLength(1);
  }finally{state.release();}
 });
 test(`${kind}: contradictory ACK blocks writes until explicit authoritative reload`,async({page})=>{
  const state=await prepare(page,kind,'unknown');await state.gallery.hover();await state.gallery.getByTitle('Đặt làm ảnh đại diện').click();
  await expect(page.getByRole('button',{name:'Tải lại để kiểm tra ảnh',exact:true})).toBeVisible();
  await expect(state.gallery.locator('input[type=file]')).toBeDisabled();expect(state.writes).toEqual(['PATCH']);
  await page.getByRole('button',{name:'Tải lại để kiểm tra ảnh',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tải lại để kiểm tra ảnh',exact:true})).toHaveCount(0);
  await expect(state.gallery.locator('input[type=file]')).toBeEnabled();expect(state.writes).toEqual(['PATCH']);expect(state.reads()).toBeGreaterThan(1);
 });
 test(`${kind}: acknowledged delete survives failed automatic thumbnail selection`,async({page})=>{
  const state=await prepare(page,kind,'partial');await state.gallery.hover();await state.gallery.getByTitle('Xóa hình ảnh',{exact:true}).first().click();
  await expect(page.getByRole('alert').filter({hasText:'Ảnh đã được xóa'})).toBeVisible();
  await expect(state.gallery.getByTitle('Xóa hình ảnh',{exact:true})).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Tải lại để kiểm tra ảnh',exact:true})).toBeVisible();expect(state.writes).toEqual(['DELETE','PATCH']);
 });
}

test('hotel: gallery never logs signed media URLs',async({page})=>{
 const state=await prepare(page,'hotel','success');expect(await state.logs()).not.toContain('synthetic-private-media-signature');
});

for(const mode of ['upload','unknown'] as const)test(`new room: ${mode} uses the same media safety contract`,async({page})=>{
 const state=await prepare(page,'newRoom',mode);
 try{
  await state.gallery.locator('input[type=file]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('synthetic')});
  await expect.poll(()=>state.writes.length).toBe(1);
  await expect(state.gallery.locator('input[type=file]')).toBeDisabled();
  if(mode==='upload'){state.release();await expect(state.gallery.locator('input[type=file]')).toBeEnabled();await expect(state.gallery.getByText('Ảnh đại diện',{exact:true})).toHaveCount(1);}
  else{await page.getByRole('button',{name:'Tải lại để kiểm tra ảnh',exact:true}).click();await expect(page).toHaveURL(new RegExp('/rooms/new$'));expect(state.writes).toEqual(['POST']);await expect.poll(()=>state.reads()).toBe(1);await expect(state.gallery.locator('input[type=file]')).toBeEnabled();await expect(state.gallery.getByTitle('Xóa hình ảnh',{exact:true})).toHaveCount(1);}
 }finally{state.release();}
});
test('new hotel: partial gallery failure preserves the draft and cannot replay acknowledged uploads',async({page})=>{
 let creates=0,uploads=0,approvals=0;const methods:string[]=[];
 await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-wizard-token');localStorage.setItem('user',JSON.stringify({userId:owner,fullName:'Synthetic owner',role:'OWNER'}));},{owner});
 const saved={id:first,targetId:hotelId,targetType:'HOTEL',url:'https://example.invalid/synthetic.png',isThumbnail:true,sortOrder:0};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.port==='8080'){
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(url.pathname==='/hotels'&&req.method()==='POST'){creates++;return route.fulfill({headers:cors,json:{id:hotelId}});}
   if(url.pathname.endsWith('/documents'))return route.fulfill({headers:cors,json:{message:'Synthetic documents saved',hotelId,approvedStatus:'DRAFT'}});
   if(url.pathname.endsWith('/medias')&&req.method()==='POST'){uploads++;methods.push('POST');return uploads===1?route.fulfill({headers:cors,json:saved}):route.fulfill({status:503,headers:cors,body:'synthetic-private-provider'});}
   if(url.pathname.endsWith('/submit-approval')){approvals++;return route.fulfill({headers:cors,json:{}});}
   if(url.pathname.endsWith('/accommodation-types'))return route.fulfill({headers:cors,json:['HOTEL','VILLA','APARTMENT','GUEST_HOUSE'].map(code=>({code,label:code}))});
   if(url.pathname.endsWith('/cities'))return route.fulfill({headers:cors,json:[{id:'77777777-7777-4777-8777-777777777777',name:'Synthetic city'}]});
   if(url.pathname.endsWith('/preview'))return route.fulfill({headers:cors,json:{textEncoding:'PLAIN_V1',id:hotelId,name:'Synthetic wizard hotel',ownerId:owner,approvedStatus:'DRAFT',isActive:false,accommodationType:'HOTEL',address:{street:'Synthetic',city:'Synthetic city',country:'VN'},mediaAssets:[saved],roomTypes:[],amenityCategories:[],policies:[],faqs:[]}});
   return route.fulfill({headers:cors,json:[]});
  }
  if(url.origin!=='http://127.0.0.1:3316')return route.abort();
  if(url.pathname.startsWith('/api/'))return route.fulfill({json:null});return route.continue();
 });
 await page.goto('/host/hotels/newHotel');
 await page.getByRole('combobox',{name:'Loại hình lưu trú'}).selectOption('HOTEL');
 await page.getByPlaceholder('Vi du: Blue Sea Resort').fill('Synthetic wizard hotel');
 await page.getByPlaceholder('123 Nguyen Van Linh').fill('Synthetic street');
 await page.getByPlaceholder('Nhap ten thanh pho...').fill('Synthetic city');
 await page.getByRole('button',{name:'Synthetic city Vietnam',exact:true}).click();
 await page.getByPlaceholder('0123456789',{exact:true}).fill('0000000000');
 await page.getByPlaceholder('Tùy chọn',{exact:true}).fill('0000000000');
 await page.getByPlaceholder('012345678901',{exact:true}).fill('000000000000');
 const file={name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('synthetic')};
 for(const label of ['Giấy phép kinh doanh','Ảnh CCCD mặt trước','Ảnh CCCD mặt sau','Ảnh thumbnail']){
  await page.locator('label').filter({hasText:label}).locator('..').locator('input[type=file]').setInputFiles(file);
 }
 await page.locator('input[type=file][multiple]').setInputFiles([file,{...file,name:'synthetic-second.png'}]);
 await page.getByRole('button',{name:'Tạo khách sạn',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Lưu bản nháp thành công - Chưa gửi duyệt',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Đồng ý',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Đã dừng tải ảnh'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Tiếp tục gửi duyệt',exact:true})).toBeDisabled();
 expect({creates,uploads,approvals}).toEqual({creates:1,uploads:2,approvals:0});
 await page.getByRole('button',{name:'Mở bản nháp để kiểm tra ảnh',exact:true}).click();
 await expect(page).toHaveURL(new RegExp('/host/hotels/'+hotelId+'$'));
 await expect(page.locator('#photos').getByTitle('Xóa hình ảnh',{exact:true})).toHaveCount(1);expect(methods).toEqual(['POST','POST']);
});

test('room: failed reconciliation stays blocked and a manual GET retry preserves unsaved form fields',async({page})=>{
 const state=await prepare(page,'room','unknown',true);
 const name=page.getByPlaceholder('VD: Phòng Deluxe');await name.fill('Unsaved synthetic room name');
 await state.gallery.hover();await state.gallery.getByTitle('Đặt làm ảnh đại diện').click();
 const reload=page.getByRole('button',{name:'Tải lại để kiểm tra ảnh',exact:true});await reload.click();
 await expect.poll(()=>state.recoveries()).toBe(1);await expect(reload).toBeEnabled();
 await expect(state.gallery.locator('input[type=file]')).toBeDisabled();await expect(name).toHaveValue('Unsaved synthetic room name');
 expect(state.writes).toEqual(['PATCH']);
 await reload.click();await expect(state.gallery.locator('input[type=file]')).toBeEnabled();
 await expect(name).toHaveValue('Unsaved synthetic room name');expect(state.recoveries()).toBe(2);expect(state.writes).toEqual(['PATCH']);
});
