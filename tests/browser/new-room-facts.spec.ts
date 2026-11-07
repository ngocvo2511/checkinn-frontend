import {test,expect,type Page} from '@playwright/test';
const hotel='11111111-1111-4111-8111-111111111111';
async function setup(page:Page){
 const writes:any[]=[];
 await page.addInitScript(()=>{localStorage.setItem('token','synthetic-owner-token');localStorage.setItem('user',JSON.stringify({userId:'33333333-3333-4333-8333-333333333333',role:'OWNER',fullName:'Synthetic Owner'}));});
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.port!=='8080')return route.continue();
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,OPTIONS'};
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(u.pathname==='/api/hotel/api/v1'&&route.request().method()==='POST'){
   writes.push(route.request().postDataJSON());return route.fulfill({headers,json:{id:'22222222-2222-4222-8222-222222222222',hotelId:hotel,...writes[0],totalRooms:1,isActive:true,textEncoding:'PLAIN_V1'}});
  }
  return route.fulfill({headers,json:[]});
 });
 await page.goto(`/host/hotels/${hotel}/rooms/new`);
 await page.getByPlaceholder('VD: Phòng Deluxe').fill('Synthetic room');
 await page.locator('input[type=number]').nth(0).fill('250000');
 return writes;
}
test('new room keeps omitted descriptive metadata unknown without changing explicit price',async({page})=>{
 const writes=await setup(page);
 await page.getByRole('button',{name:'Thêm phòng',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].capacity).toEqual({adults:2,children:0,bedType:null,roomSize:null,breakfastIncluded:null,breakfastQuantity:null});
 expect(writes[0].basePrice).toBe(250000);expect(writes[0].roomAmount).toBe(1);
});

for(const included of [true,false])test(`new room preserves explicitly supplied zero metadata and breakfast ${included}`,async({page})=>{
 const writes=await setup(page);
 await expect(page.getByRole('checkbox',{name:'Bao gồm bữa sáng',exact:true})).toHaveAttribute('aria-checked','mixed');
 await page.getByRole('spinbutton',{name:'Diện tích phòng',exact:true}).fill('0');
 await page.getByRole('checkbox',{name:'Bao gồm bữa sáng',exact:true}).check();
 await page.getByRole('spinbutton',{name:'Số suất bữa sáng',exact:true}).fill('0');
 if(!included)await page.getByRole('checkbox',{name:'Bao gồm bữa sáng',exact:true}).uncheck();
 await page.getByRole('button',{name:'Thêm phòng',exact:true}).click();await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].capacity).toEqual({adults:2,children:0,bedType:null,roomSize:0,breakfastIncluded:included,breakfastQuantity:0});
 expect(writes[0].basePrice).toBe(250000);expect(writes[0].roomAmount).toBe(1);
});
