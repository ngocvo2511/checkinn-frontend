import {test,expect,type Page} from '@playwright/test';
const id='11111111-1111-4111-8111-111111111111',roomId='22222222-2222-4222-8222-222222222222',owner='33333333-3333-4333-8333-333333333333';
const base={textEncoding:'PLAIN_V1',id:roomId,hotelId:id,name:'Synthetic room facts',description:'Original description',isActive:true,basePrice:200000,totalRooms:2,amenities:[],mediaAssets:[],capacity:{adults:2,children:0,bedType:null,roomSize:null,breakfastIncluded:null,breakfastQuantity:null}};
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,PUT,OPTIONS'};
async function mock(page:Page,initial:any,host=false){
 let current={...initial};const writes:any[]=[];
 if(host)await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-owner-token');localStorage.setItem('user',JSON.stringify({userId:owner,role:'OWNER',fullName:'Synthetic Owner'}));},{owner});
 await page.route('**/*',async route=>{const u=new URL(route.request().url());
  if(u.port==='8080'){
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(u.pathname===`/api/hotel/api/v1/${roomId}`&&route.request().method()==='PUT'){
    const body=route.request().postDataJSON();writes.push(body);current={...current,...body};return route.fulfill({headers:cors,json:current});
   }
   if(u.pathname===`/api/hotel/api/v1/${roomId}/preview`)return route.fulfill({headers:cors,json:current});
   if(u.pathname===`/api/hotel/hotels/${id}`)return route.fulfill({headers:cors,json:{textEncoding:'PLAIN_V1',id,name:'Room facts property',address:{},isActive:true,approvedStatus:'APPROVED',roomTypes:[current],mediaAssets:[],amenityCategories:[],policies:[],faqs:[]}});
   if(u.pathname.includes('/stats/'))return route.fulfill({headers:cors,json:{totalReviews:0,averageRating:0,recentReviews:[]}});
   if(u.pathname.includes('/reviews/'))return route.fulfill({headers:cors,json:{content:[],totalElements:0,totalPages:0}});
   return route.fulfill({headers:cors,json:[]});
  }
  if(u.origin!=='http://127.0.0.1:3300')return route.abort();
  if(u.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
 });return {writes:()=>writes,current:()=>current};
}
for(const capacity of [null,{adults:2,children:null},{adults:0,children:0}])test(`public card/modal keep incomplete capacity unknown: ${JSON.stringify(capacity)}`,async({page})=>{
 await mock(page,{...base,capacity});await page.goto('/hotel/'+id);
 await expect(page.getByText('Chưa xác minh sức chứa',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Chọn',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Xem chi tiết phòng',exact:true}).click();await expect(page.getByText('Chưa xác minh sức chứa',{exact:true})).toHaveCount(2);
});
test('owner description edit never manufactures unknown breakfast/room metadata or rewrites stock/price',async({page})=>{
 const api=await mock(page,base,true);await page.goto(`/host/hotels/${id}/rooms/${roomId}`);
 await page.getByPlaceholder('Mô tả về phòng...').fill('Description changed only');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect.poll(()=>api.writes().length).toBe(1);expect(api.writes()[0]).toEqual({description:'Description changed only'});expect(api.current().capacity.breakfastIncluded).toBeNull();
});
test('owner unrelated edit preserves unknown configured inventory and capacity instead of using observed availability',async({page})=>{
 const api=await mock(page,{...base,totalRooms:null,availableRooms:5,capacity:null},true);await page.goto(`/host/hotels/${id}/rooms/${roomId}`);
 await expect(page.getByRole('spinbutton',{name:'Số lượng phòng',exact:true})).toHaveValue('');await expect(page.getByRole('spinbutton',{name:'Số lượng phòng',exact:true})).toBeDisabled();
 await expect(page.getByRole('spinbutton',{name:'Người lớn',exact:true})).toHaveValue('');
 await page.getByPlaceholder('Mô tả về phòng...').fill('Unrelated edit');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect.poll(()=>api.writes().length).toBe(1);expect(api.writes()[0]).toEqual({description:'Unrelated edit'});
});

test('known capacity including zero children remains selectable without unknown warnings',async({page})=>{
 await mock(page,base);await page.goto('/hotel/'+id);await expect(page.getByRole('button',{name:'Chọn',exact:true})).toBeEnabled();await expect(page.getByText('Chưa xác minh sức chứa',{exact:true})).toHaveCount(0);
});
test('public unknown configured inventory is not replaced with dated availability',async({page})=>{
 await mock(page,{...base,totalRooms:null,availableRooms:99});await page.goto('/hotel/'+id);
 await expect(page.getByText('Chưa xác minh số lượng phòng',{exact:true})).toBeVisible();await expect(page.getByText('Tổng số phòng: 99',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Chọn',exact:true})).toBeDisabled();
});
test('owner can explicitly update all six supported metadata fields without changing price or inventory',async({page})=>{
 const api=await mock(page,base,true);await page.goto(`/host/hotels/${id}/rooms/${roomId}`);
 await expect(page.getByRole('checkbox',{name:'Bao gồm bữa sáng',exact:true})).toHaveAttribute('aria-checked','mixed');
 await page.getByRole('textbox',{name:'Loại giường',exact:true}).fill('"Queen bed"');await page.getByRole('spinbutton',{name:'Diện tích phòng',exact:true}).fill('24');
 await page.getByRole('checkbox',{name:'Bao gồm bữa sáng',exact:true}).check();await page.getByRole('spinbutton',{name:'Số suất bữa sáng',exact:true}).fill('2');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect.poll(()=>api.writes().length).toBe(1);expect(api.writes()[0]).toEqual({capacity:{adults:2,children:0,bedType:'"Queen bed"',roomSize:24,breakfastIncluded:true,breakfastQuantity:2}});expect(api.current().basePrice).toBe(200000);expect(api.current().totalRooms).toBe(2);
});
test('owner must provide both required capacity counts when reviewing unknown data',async({page})=>{
 const api=await mock(page,{...base,capacity:null},true);await page.goto(`/host/hotels/${id}/rooms/${roomId}`);
 await page.getByRole('spinbutton',{name:'Người lớn',exact:true}).fill('3');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect(page.getByText('Nhập đủ sức chứa người lớn và trẻ em hợp lệ',{exact:true})).toBeVisible();expect(api.writes().length).toBe(0);
 await page.getByRole('spinbutton',{name:'Trẻ em',exact:true}).fill('1');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect.poll(()=>api.writes().length).toBe(1);
 expect(api.writes()[0]).toEqual({capacity:{adults:3,children:1,bedType:null,roomSize:null,breakfastIncluded:null,breakfastQuantity:null}});
});
test('unchanged owner form never sends an empty or full replacement mutation',async({page})=>{
 const api=await mock(page,base,true);await page.goto(`/host/hotels/${id}/rooms/${roomId}`);await expect(page.getByRole('heading',{name:'Chỉnh sửa phòng',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByText('Không có thay đổi để lưu.',{exact:true})).toBeVisible();expect(api.writes().length).toBe(0);
});
