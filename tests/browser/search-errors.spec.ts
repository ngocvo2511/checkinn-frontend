import { test, expect } from '@playwright/test';
const catalog = [{code:'HOTEL',label:'Hotel'},{code:'VILLA',label:'Villa'},{code:'APARTMENT',label:'Apartment'},{code:'GUEST_HOUSE',label:'Guest House'}];
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'GET,OPTIONS' };
const hotel = { id:'fixture', name:'Synthetic hotel', isActive:true, approvedStatus:'APPROVED', lowestPrice:200000, address:{}, roomTypes:[
  {id:'good', isActive:true, basePrice:200000, totalRooms:2, capacity:{adults:2,children:0}},
  {id:'bad', isActive:true, basePrice:200000, totalRooms:2, capacity:{adults:2,children:0}}
] };
async function mock(page: import('@playwright/test').Page, respond: (url: URL) => {status?:number;json?:unknown}) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.port === '8080') {
      if (url.pathname.endsWith('/accommodation-types')) return route.fulfill({headers:cors,json:catalog});
      if (route.request().method() === 'OPTIONS') return route.fulfill({status:204, headers:cors});
      return route.fulfill({headers:cors, ...respond(url)});
    }
    if (url.origin !== 'http://127.0.0.1:3300') return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({json:null});
    return route.continue();
  });
}
for (const mode of ['name', 'location', 'partial availability', 'malformed availability']) {
  test(`search shows an error instead of no matches for ${mode} failure, then retries`, async ({ page }) => {
    let failing = true;
    await mock(page, url => {
      if (url.pathname.endsWith('/hotels/offers')) {
        if (failing) return mode === 'malformed availability' ? {json:[{hotel,offer:{}}]} : {status:503,json:{}};
        return {json:[{hotel,offer:{roomTypeId:'good',quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:2,checkIn:'2026-12-01',checkOut:'2026-12-02',checkedAt:'2026-11-04T00:00:00Z'}}]};
      }
      return {json:[]};
    });
    await page.goto(`/search?${mode === 'name' ? 'hotelName' : 'cityName'}=Fixture&checkIn=2026-12-01&checkOut=2026-12-02`);
    await expect(page.getByTestId('search-error')).toBeVisible();
    await expect(page.getByText('Không tìm thấy khách sạn phù hợp', {exact:true})).toHaveCount(0);
    await expect(page.getByText('Tìm thấy 0 khách sạn', {exact:true})).toHaveCount(0);
    failing = false;
    await page.getByRole('button',{name:'Thử lại',exact:true}).click();
    if (mode === 'name') await expect(page).toHaveURL(/\/hotel\/fixture/);
    else await expect(page.getByText('Synthetic hotel',{exact:true})).toBeVisible();
  });
}
test('successful empty response shows no matches without dependency error', async ({page}) => {
  await mock(page, () => ({json:[]}));
  await page.goto('/search?cityName=Fixture');
  await expect(page.getByText('Không tìm thấy khách sạn phù hợp',{exact:true})).toBeVisible();
  await expect(page.getByRole('group',{name:'Loại hình lưu trú',exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:/Villa|Apartment|Guest House/})).toHaveCount(3);
  await expect(page.getByRole('alert').filter({hasText:/Không thể|không hợp lệ/})).toHaveCount(0);
});
for (const picker of ['home','search']) {
  test(`${picker} autocomplete distinguishes failure, clears error on successful replacement`, async ({page}) => {
    let failing = true;
    await mock(page, url => url.pathname.includes('/hotels/search') && failing ? {status:503,json:{}} : {json:[]});
    await page.goto(picker === 'home' ? '/' : '/search?cityName=Fixture');
    if (picker === 'home') await page.getByRole('button',{name:/Bạn muốn đi đâu/}).click();
    else await page.getByRole('button',{name:/Fixture/}).first().click();
    const input = page.getByPlaceholder(picker === 'home' ? 'Tìm điểm đến hoặc khách sạn...' : 'Tìm kiếm địa điểm...');
    await input.fill('Fixture');
    await expect(page.getByRole('alert').filter({hasText:'Không thể tìm kiếm'})).toBeVisible();
    await expect(page.getByText('Không tìm thấy kết quả',{exact:true})).toHaveCount(0);
    failing = false;
    await input.fill('Replacement');
    await expect(page.getByText('Không tìm thấy kết quả',{exact:true})).toBeVisible();
    await expect(page.getByRole('alert').filter({hasText:/Không thể|không hợp lệ/})).toHaveCount(0);
  });
}

test('search displays server offer price instead of the cheapest catalog room', async ({page}) => {
  await mock(page, url => {
    if (url.pathname.endsWith('/hotels/offers')) return {json:[{hotel:{...hotel,lowestPrice:100000},offer:{roomTypeId:'good',quantity:1,unitPrice:300000,totalPerNight:300000,availableRooms:2,checkIn:'2026-12-01',checkOut:'2026-12-02',checkedAt:'2026-11-04T00:00:00Z'}}]};
    return {json:[]};
  });
  await page.goto('/search?cityName=Fixture&checkIn=2026-12-01&checkOut=2026-12-02');
  await expect(page.getByText('300.000 VND',{exact:true})).toBeVisible();
  await expect(page.getByText('100.000 VND',{exact:true})).toHaveCount(0);
});

for (const key of ['cityId','provinceId']) {
  test(`direct search URL keeps ${key} authoritative even without cityName`, async ({page}) => {
    let observed = false;
    await mock(page, url => {
      if (url.pathname.endsWith('/hotels/offers')) {
        observed = true;
        expect(url.searchParams.get(key)).toBe('00000000-0000-4000-8000-0000000000f1');
        expect(url.searchParams.has('cityName')).toBe(false);
      }
      return {json:[]};
    });
    await page.goto(`/search?${key}=00000000-0000-4000-8000-0000000000f1`);
    await expect(page.getByText('Không tìm thấy khách sạn phù hợp',{exact:true})).toBeVisible();
    expect(observed).toBe(true);
  });
}

test('budget defaults, zero, reset and rating changes remain synchronized through URL and back', async ({page}) => {
  let price = '';
  await mock(page, url => {
    if (url.pathname.endsWith('/hotels/offers')) price = url.searchParams.get('maxPrice') || '';
    return {json:[]};
  });
  await page.goto('/search?cityName=Fixture');
  await expect.poll(() => price).toBe('24000000');
  await expect(page.getByRole('textbox',{name:'Giá tối đa'})).toHaveValue('24.000.000');
  await page.getByRole('textbox',{name:'Giá tối đa'}).fill('800000');
  await page.getByRole('textbox',{name:'Giá tối đa'}).blur();
  await expect.poll(() => price).toBe('800000');
  await page.getByRole('checkbox',{name:'5 star',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'5 star',exact:true})).toBeChecked();
  await expect(page).toHaveURL(/star=5/);
  expect(new URL(page.url()).searchParams.get('maxPrice')).toBe('800000');
  await page.reload();
  await expect(page.getByRole('textbox',{name:'Giá tối đa'})).toHaveValue('800.000');
  await expect(page.getByRole('checkbox',{name:'5 star',exact:true})).toBeChecked();
  await page.getByRole('textbox',{name:'Giá tối đa'}).fill('0');
  await page.getByRole('textbox',{name:'Giá tối đa'}).blur();
  await expect.poll(() => price).toBe('0');
  await page.goBack();
  await expect(page.getByRole('textbox',{name:'Giá tối đa'})).toHaveValue('800.000');
  await page.getByRole('button',{name:'Đặt lại',exact:true}).click();
  await expect.poll(() => price).toBe('24000000');
  await expect(page.getByRole('checkbox',{name:'5 star',exact:true})).toBeChecked();
});

test('choosing a province preserves its type through the picker, URL and offer request', async ({page}) => {
  const id='00000000-0000-4000-8000-0000000000f1';
  let seen=false;
  await mock(page,url => {
    if (url.pathname.includes('/cities/')) return {json:[{id,name:'Fixture province',type:'PROVINCE'}]};
    if (url.pathname.endsWith('/hotels/offers') && url.searchParams.get('provinceId') === id) {
      seen=true; expect(url.searchParams.has('cityId')).toBe(false); expect(url.searchParams.has('cityName')).toBe(false);
    }
    return {json:[]};
  });
  await page.goto('/search?cityName=Fixture&checkIn=2026-12-01&checkOut=2026-12-02');
  await page.getByRole('button',{name:'Fixture',exact:true}).click();
  await page.getByPlaceholder('Tìm kiếm địa điểm...').fill('province');
  await page.getByText('Fixture province',{exact:true}).click();
  await page.getByRole('button',{name:'Tìm khách sạn',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`provinceId=${id}`));
  await expect.poll(()=>seen).toBe(true);
});
