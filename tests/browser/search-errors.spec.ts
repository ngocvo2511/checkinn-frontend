import {offerPage} from './offer-fixtures';
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
      const response=respond(url);
      if(url.pathname.endsWith('/hotels/offers/page')&&Array.isArray(response.json))response.json=offerPage(url,response.json);
      // Summary fixtures carry one row per requested identity, preserving error modes.
      if(url.pathname.endsWith('/reviews/summaries')&&response.json&&typeof response.json==='object'&&!Array.isArray(response.json)){
        const stats=response.json as {totalReviews?:number;averageRating?:number};
        if(typeof stats.totalReviews==='number')response.json=url.searchParams.getAll('hotelIds').map(hotelId=>({hotelId,...stats,averageRating:stats.totalReviews===0?null:stats.averageRating}));
      }
      return route.fulfill({headers:cors, ...response});
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
      if (url.pathname.endsWith('/hotels/offers/page')) {
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

test('search does not fabricate amenities, ratings, discounts, location or points for missing catalog facts', async ({page}) => {
  await mock(page, url => url.pathname.endsWith('/hotels/offers/page')
    ? {json:[{hotel,offer:{roomTypeId:'good',quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null}}]}
    : {json:{totalReviews:0,averageRating:0}});
  await page.goto('/search?cityName=Fixture');
  await expect(page.getByText('Synthetic hotel',{exact:true})).toBeVisible();
  await expect(page.getByText('Free WiFi',{exact:true})).toHaveCount(0);
  await expect(page.getByText('240.000 VND',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/\d+ Points/)).toHaveCount(0);
  await expect(page.getByText('Chưa có đánh giá',{exact:true})).toBeVisible();
  await expect(page.getByText('Chưa cung cấp vị trí',{exact:true})).toBeVisible();
});

test('detail shows configured stock as total and never invents hotel policies or amenities', async ({page}) => {
  await mock(page, url => {
    if (url.pathname.endsWith('/hotels/fixture')) return {json:{...hotel,policies:[],faqs:[],amenityCategories:[]}};
    if (url.pathname.includes('/stats/')) return {json:{totalReviews:0,averageRating:0}};
    return {json:[]};
  });
  await page.goto('/hotel/fixture');
  await expect(page.getByText('Synthetic hotel',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('Chỉ còn 2 phòng',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Tổng số phòng: 2',{exact:true})).toHaveCount(2);
  await expect(page.getByText('Chưa cung cấp chính sách của cơ sở lưu trú.',{exact:true})).toBeVisible();
  await expect(page.getByText('Chưa cung cấp câu hỏi thường gặp.',{exact:true})).toBeVisible();
  await expect(page.getByText('Không được hoàn tiền',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Wi-Fi miễn phí',{exact:true})).toHaveCount(0);
});

test('amenity filtering uses all observed hotel labels and lets an unknown URL selection be cleared', async ({page}) => {
  const withAmenities = {...hotel,amenityCategories:[{id:'category',title:'Hotel amenities',items:['A','B','C','D','E'].map(title=>({id:title,title}))}]};
  await mock(page, url => url.pathname.endsWith('/hotels/offers/page')
    ? {json:url.searchParams.getAll('amenities').includes('Unknown')?offerPage(url,[],{availableAmenities:['A','B','C','D','E']}):[{hotel:withAmenities,offer:{roomTypeId:'good',quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null}}]}
    : {json:{totalReviews:0,averageRating:0}});
  await page.goto('/search?cityName=Fixture&amenity=E');
  await expect(page.getByText('Synthetic hotel',{exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:'E',exact:true})).toBeChecked();
  await page.reload();
  await expect(page.getByText('Synthetic hotel',{exact:true})).toBeVisible();
  await page.goto('/search?cityName=Fixture&amenity=Unknown');
  await expect(page.getByText('Không tìm thấy khách sạn phù hợp',{exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Unknown',exact:true}).click();
  await expect(page).not.toHaveURL(/amenity=Unknown/);
  await expect(page.getByRole('checkbox',{name:'Unknown',exact:true})).toHaveCount(0);
  await expect(page.getByText('Synthetic hotel',{exact:true})).toBeVisible();
});

test('a rating-filter dependency failure is unknown rather than no matches and can be retried', async ({page}) => {
  let failing = true;
  await mock(page, url => {
    if (url.pathname.endsWith('/hotels/offers/page')) return failing ? {status:503,json:{}} : {json:[{hotel,offer:{roomTypeId:'good',quantity:1,unitPrice:200000,totalPerNight:200000,availableRooms:null,checkIn:null,checkOut:null,checkedAt:null},reviews:{hotelId:hotel.id,totalReviews:2,averageRating:8.5}}]};
    return {json:[]};
  });
  await page.goto('/search?cityName=Fixture&guestRating=8');
  await expect(page.getByTestId('search-error')).toContainText('Không thể xác minh đánh giá');
  await expect(page.getByText('Không tìm thấy khách sạn phù hợp',{exact:true})).toHaveCount(0);
  failing = false;
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await expect(page.getByText('Synthetic hotel',{exact:true})).toBeVisible();
  await expect(page.getByText('8.5/10',{exact:false})).toBeVisible();
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
    if (url.pathname.endsWith('/hotels/offers/page')) return {json:[{hotel:{...hotel,lowestPrice:100000},offer:{roomTypeId:'good',quantity:1,unitPrice:300000,totalPerNight:300000,availableRooms:2,checkIn:'2026-12-01',checkOut:'2026-12-02',checkedAt:'2026-11-04T00:00:00Z'}}]};
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
      if (url.pathname.endsWith('/hotels/offers/page')) {
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
    if (url.pathname.endsWith('/hotels/offers/page')) price = url.searchParams.get('maxPrice') || '';
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
    if (url.pathname.endsWith('/hotels/offers/page') && url.searchParams.get('provinceId') === id) {
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
