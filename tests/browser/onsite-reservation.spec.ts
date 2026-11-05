import {test,expect} from '@playwright/test';

for (const initial of ['V1_PENDING','V1_REVIEW_REQUIRED','V1_CONFIRMED']) {
  test(`onsite page renders real ${initial} and never treats reservation as a receipt`,async({page})=>{
    let state=initial; let failing=false; let mutations=0;
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.port==='8080') {
        const headers={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,OPTIONS'};
        if(route.request().method()==='OPTIONS') return route.fulfill({status:204,headers});
        if(route.request().method()!=='GET') mutations++;
        return route.fulfill({status:failing?503:200,headers,json:{id:'fixture',status:state==='V1_CONFIRMED'?'CONFIRMED':'PENDING_PAYMENT',onsiteReservationStatus:state,paymentMethod:'HOTEL',paidAmount:0}});
      }
      if(url.origin!=='http://127.0.0.1:3300')return route.abort();
      if(url.pathname==='/api/auth/session')return route.fulfill({json:null});
      return route.continue();
    });
    await page.goto('/booking/payment/hotel-confirm?bookingId=fixture');
    if(initial!=='V1_CONFIRMED') {
      await expect(page.getByText('Chưa xác nhận phòng',{exact:true})).toBeVisible();
      await expect(page.getByRole('status')).not.toContainText('Đặt phòng đã được xác nhận');
      state='V1_CONFIRMED';await page.getByRole('button',{name:'Cập nhật trạng thái',exact:true}).click();
    }
    await expect(page.getByText('Đã xác nhận phòng',{exact:true})).toBeVisible();
    await expect(page.getByText('Chưa ghi nhận thu tiền',{exact:true})).toBeVisible();
    failing=true;await page.getByRole('button',{name:'Cập nhật trạng thái',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Không thể tải trạng thái');
    await expect(page.getByText('Đã xác nhận phòng',{exact:true})).toHaveCount(0);
    await expect(page.getByText('Chưa xác minh số tiền đã thu',{exact:true})).toBeVisible();
    expect(mutations).toBe(0);
  });
}

for (const action of ['receipt','no-show','future']) {
  test(`host handles confirmed unpaid onsite booking: ${action}`,async({page})=>{
    const hotel='00000000-0000-4000-8000-0000000000e2', owner='00000000-0000-4000-8000-0000000000e1';
    let receiptCalls=0; let statusWrite='';
    const day=new Date(); day.setDate(day.getDate()+(action==='future'?10:-1));
    const booking={id:'onsite-fixture',hotelId:hotel,hotelName:'Onsite Hotel',userId:'guest',status:'CONFIRMED',onsiteReservationStatus:'V1_CONFIRMED',
      paymentMethod:'HOTEL',paidAmount:0,totalAmount:1000000,contactName:'Onsite Guest',contactPhone:'0000000000',contactEmail:'onsite@example.invalid',
      adults:2,children:0,checkInDate:day.toISOString().slice(0,10),checkOutDate:'2027-01-01',items:[]};
    await page.addInitScript(({owner})=>{localStorage.setItem('token','synthetic-owner-token');localStorage.setItem('user',JSON.stringify({userId:owner,role:'OWNER',fullName:'Synthetic Owner'}));},{owner});
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.port==='8080') {
        const headers={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
        if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
        if(url.pathname==='/api/hotel/hotels/owner')return route.fulfill({headers,json:[{id:hotel,name:'Onsite Hotel',roomTypes:[]}]});
        if(url.pathname===`/api/bookings/hotel/${hotel}`)return route.fulfill({headers,json:[booking]});
        if(url.pathname==='/api/payments/onsite-fixture/confirm') {receiptCalls++;booking.paidAmount=1000000;return route.fulfill({headers,json:{status:'COMPLETED'}});}
        if(url.pathname==='/api/bookings/onsite-fixture/status') {statusWrite=url.searchParams.get('status')??'';booking.status=statusWrite;return route.fulfill({headers,json:booking});}
        return route.fulfill({headers,json:[]});
      }
      if(url.origin!=='http://127.0.0.1:3300')return route.abort();
      if(url.pathname==='/api/auth/session')return route.fulfill({json:null});
      return route.continue();
    });
    await page.goto('/host/bookings');
    const collected=page.getByText('Tổng tiền đã thu',{exact:true}).locator('..');
    await expect(collected).toContainText('0đ');
    await page.getByRole('row').filter({hasText:'Onsite Guest'}).click();
    await expect(page.getByRole('button',{name:'Xác nhận thanh toán',exact:true})).toBeVisible();
    if(action==='future') {await expect(page.getByRole('button',{name:'Khách không đến',exact:true})).toHaveCount(0);return;}
    if(action==='receipt') {
      await page.getByRole('button',{name:'Xác nhận thanh toán',exact:true}).click();
      await expect.poll(()=>receiptCalls).toBe(1);
      await expect(collected).toContainText('1.000.000đ');
    } else {
      await page.getByRole('button',{name:'Khách không đến',exact:true}).click();
      await expect.poll(()=>statusWrite).toBe('NO_SHOW');
      expect(receiptCalls).toBe(0);
    }
  });
}
