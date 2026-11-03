import { test, expect } from '@playwright/test';

const id = '00000000-0000-4000-8000-0000000000f1';
const owner = '00000000-0000-4000-8000-0000000000f2';
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Authorization,Content-Type', 'access-control-allow-methods': 'GET,OPTIONS' };

test('changing an address clears its old pin immediately and stale geocoding cannot replace a manual pin', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  let geocodeStarted = false;
  await page.addInitScript(({ owner }) => {
    localStorage.setItem('token', 'synthetic-owner-token');
    localStorage.setItem('user', JSON.stringify({ userId: owner, role: 'OWNER', fullName: 'Synthetic Owner' }));
  }, { owner });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'nominatim.openstreetmap.org') {
      geocodeStarted = true;
      await gate;
      return route.fulfill({ json: [{ place_rank: 30, category: 'building', lat: '15', lon: '109' }] });
    }
    if (url.port === '8080') {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      return route.fulfill({ headers: cors, json: url.pathname === '/cities'
        ? [{ id, name: 'Synthetic city', latitude: 12, longitude: 108 }] : [] });
    }
    if (url.origin !== 'http://127.0.0.1:3300') return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({ json: null });
    return route.continue();
  });
  await page.goto('/host/hotels/newHotel');
  await page.getByPlaceholder('Nhap ten thanh pho...').fill('Synthetic');
  await page.getByRole('button', { name: 'Synthetic city Vietnam', exact: true }).click();
  const street = page.getByPlaceholder('123 Nguyen Van Linh');
  await street.fill('Synthetic street');
  await expect.poll(() => geocodeStarted).toBe(true);
  await page.getByPlaceholder('Dán link Google Maps hoặc tọa độ...').fill('12, 108');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page.getByText('Tọa độ: 12.000000, 108.000000', { exact: true })).toBeVisible();
  release();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Tọa độ: 12.000000, 108.000000', { exact: true })).toBeVisible();
  await expect(page.getByText('Tọa độ: 15.000000, 109.000000', { exact: true })).toHaveCount(0);
  await street.fill('X'); // No replacement lookup can hide a stale-pin bug.
  await expect(page.getByText(/^Tọa độ:/)).toHaveCount(0);
});

for (const allowed of [true, false]) {
  test(allowed ? 'host opens unpublished hotel through authenticated preview' : 'denied preview shows error without a public detail fallback', async ({ page }) => {
    let previewCalls = 0;
    let publicCalls = 0;
    await page.addInitScript(({ owner }) => {
      localStorage.setItem('token', 'synthetic-owner-token');
      localStorage.setItem('user', JSON.stringify({ userId: owner, role: 'OWNER', fullName: 'Synthetic Owner' }));
    }, { owner });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.port === '8080') {
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
        if (url.pathname === `/api/hotel/hotels/${id}/preview`) {
          previewCalls++;
          expect(route.request().headers()['authorization']).toBe('Bearer synthetic-owner-token');
          return route.fulfill({ status: allowed ? 200 : 403, headers: cors, json: allowed ? {
            id, ownerId: owner, name: 'Synthetic unpublished hotel', approvedStatus: 'PENDING', isActive: false,
            cityId: '00000000-0000-4000-8000-0000000000f3', address: { street: '', city: 'Synthetic city', country: 'Vietnam' },
            roomTypes: [], mediaAssets: [], policies: [], amenityCategories: [], faqs: [],
          } : { message: 'Forbidden' } });
        }
        if (url.pathname === `/api/hotel/hotels/${id}`) publicCalls++;
        if (url.pathname.endsWith('/documents')) return route.fulfill({ headers: cors, json: {} });
        return route.fulfill({ status: 200, headers: cors, json: [] });
      }
      if (url.origin !== 'http://127.0.0.1:3300') return route.abort();
      if (url.pathname === '/api/auth/session') return route.fulfill({ json: null });
      return route.continue();
    });
    await page.goto(`/host/hotels/${id}`);
    if (allowed) {
      await expect(page.getByRole('heading', { name: 'Synthetic unpublished hotel', exact: true })).toBeVisible();
      await expect(page.getByText('Tạm dừng', { exact: true })).toBeVisible();
    } else await expect(page.getByText('Không thể xem khách sạn: 403', { exact: true })).toBeVisible();
    expect(previewCalls).toBeGreaterThan(0);
    expect(publicCalls).toBe(0);
  });
}


test('host can open an inactive room using authenticated private preview', async ({ page }) => {
  const room = '00000000-0000-4000-8000-0000000000f4';
  let previews = 0; let publicReads = 0;
  await page.addInitScript(({ owner }) => {
    localStorage.setItem('token','synthetic-owner-token');
    localStorage.setItem('user',JSON.stringify({ userId:owner,role:'OWNER',fullName:'Synthetic Owner' }));
  }, { owner });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.port === '8080') {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status:204,headers:cors });
      if (url.pathname === `/api/hotel/api/v1/${room}/preview`) {
        previews++; expect(route.request().headers()['authorization']).toBe('Bearer synthetic-owner-token');
        return route.fulfill({ headers:cors,json:{ id:room,hotelId:id,name:'Synthetic inactive room',isActive:false,basePrice:1000000,totalRooms:2,capacity:{adults:2,children:0},amenities:[],mediaAssets:[] } });
      }
      if (url.pathname === `/api/hotel/api/v1/${room}`) publicReads++;
      return route.fulfill({ status:200,headers:cors,json:[] });
    }
    if (url.origin !== 'http://127.0.0.1:3300') return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({ json:null });
    return route.continue();
  });
  await page.goto(`/host/hotels/${id}/rooms/${room}`);
  await expect(page.getByRole('heading',{name:'Chỉnh sửa phòng',exact:true})).toBeVisible();
  await expect(page.locator('input[value="Synthetic inactive room"]')).toBeVisible();
  expect(previews).toBeGreaterThan(0); expect(publicReads).toBe(0);
});

test('public hotel never uses city coordinates as an exact hotel pin', async ({ page }) => {
  let mapRequests = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname.endsWith('tile.openstreetmap.org')) mapRequests++;
    if (url.port === '8080') {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status:204,headers:cors });
      if (url.pathname === `/api/hotel/hotels/${id}`) return route.fulfill({ headers:cors,json:{
        id,name:'Synthetic city origin hotel',isActive:true,approvedStatus:'APPROVED',starRating:3,roomTypes:[],mediaAssets:[],policies:[],faqs:[],amenityCategories:[],
        address:{street:'Synthetic street',city:'Synthetic city',country:'VN',latitude:12,longitude:108,coordinateSource:'CITY_CENTROID'},
        city:{id:owner,name:'Synthetic city',latitude:16,longitude:109},
      } });
      if (url.pathname.includes('/stats/')) return route.fulfill({ headers:cors,json:{totalReviews:0,averageRating:0,ratingDistribution:{}} });
      if (url.pathname.includes('/reviews/')) return route.fulfill({ headers:cors,json:{content:[],totalElements:0,totalPages:0} });
      return route.fulfill({ headers:cors,json:[] });
    }
    if (url.origin !== 'http://127.0.0.1:3300') return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({ json:null });
    return route.continue();
  });
  await page.goto(`/hotel/${id}`);
  await expect(page.getByRole('heading',{name:'Synthetic city origin hotel',exact:true})).toBeVisible();
  await expect(page.getByText('Tọa độ bản đồ đang được cập nhật',{exact:true})).toBeVisible();
  await expect(page.getByText('Gợi ý theo khu vực thành phố; chưa có tọa độ khách sạn để tính khoảng cách từ nơi lưu trú.',{exact:true})).toBeVisible();
  expect(mapRequests).toBe(0);
});
