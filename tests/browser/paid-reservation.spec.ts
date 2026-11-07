import {test,expect} from '@playwright/test';
const id='55555555-5555-4555-8555-555555555555';
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,OPTIONS'};
for (const next of ['V1_CONFIRMED','V1_REVIEW_REQUIRED','ERROR']) {
  test(`paid return reads recovery ${next} without submitting the provider callback again`,async ({page}) => {
    let current='V1_PENDING',callbackReads=0,bookingReads=0,mutations=0;
    await page.addInitScript(()=>{localStorage.setItem('token','synthetic-internal-token');localStorage.setItem('user',JSON.stringify({userId:'55555555-5555-4555-8555-555555555555',role:'CUSTOMER',fullName:'Synthetic Guest'}));});
    await page.route('**/*',async route => {
      const url=new URL(route.request().url());
      if(url.port==='8080') {
        if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
        if(route.request().method()!=='GET')mutations++;
        if(url.pathname==='/api/payments/vnpay/return') {callbackReads++;return route.fulfill({headers:cors,json:{id:'synthetic-payment',bookingId:id,amount:1000000,method:'VNPAY',status:'COMPLETED',vnpayResponseCode:'00'}});}
        if(url.pathname===`/api/bookings/${id}`) {
          bookingReads++;
          if(current==='ERROR')return route.fulfill({status:503,headers:cors,json:{message:'Unavailable'}});
          return route.fulfill({headers:cors,json:{id,status:current==='V1_CONFIRMED'?'CONFIRMED':'PENDING_PAYMENT',paidAmount:1000000,totalAmount:1000000,paymentMethod:'VNPAY',paidReservationStatus:current}});
        }
        return route.fulfill({headers:cors,json:[]});
      }
      if(url.origin!=='http://127.0.0.1:3300')return route.abort();
      if(url.pathname==='/api/auth/session')return route.fulfill({json:null});return route.continue();
    });
    await page.goto('/booking/payment/return?vnp_TxnRef=synthetic-order&vnp_SecureHash=synthetic-test');
    await expect(page.getByRole('status')).toContainText('Đã ghi nhận thanh toán. Đang kiểm tra xác nhận phòng');
    await expect(page.getByText('Thành công',{exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Thử lại thanh toán',exact:true})).toHaveCount(0);
    current=next;
    if(next==='V1_CONFIRMED') {
      // Verify autonomous read-only polling; no manual action/callback is needed.
      await expect(page.getByText('Thành công',{exact:true})).toBeVisible({timeout:8000});
    } else {
      await page.getByRole('button',{name:'Cập nhật trạng thái đặt phòng',exact:true}).click();
      await expect(page.getByRole('status')).toContainText(next==='ERROR'?'đặt phòng chưa được xác nhận':'Đơn cần được đối soát');
      await expect(page.getByText('Thành công',{exact:true})).toHaveCount(0);
    }
    expect(bookingReads).toBeGreaterThanOrEqual(2);expect(callbackReads).toBe(1);expect(mutations).toBe(0);
  });
}
