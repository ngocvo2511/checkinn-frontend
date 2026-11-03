import { test, expect, type Page, type Route } from '@playwright/test';

const userId = '00000000-0000-4000-8000-0000000000e1';
const checkIn = new Date();
checkIn.setUTCDate(checkIn.getUTCDate() + 10);
const checkOut = new Date(checkIn);
checkOut.setUTCDate(checkOut.getUTCDate() + 1);
const bookingUrl = '/booking?' + new URLSearchParams({
  hotelId: '00000000-0000-4000-8000-0000000000e2', hotelName: 'Synthetic Hotel',
  roomId: '00000000-0000-4000-8000-0000000000e3', roomName: 'Synthetic Room',
  roomPrice: '1000000', quantity: '1', checkIn: checkIn.toISOString().slice(0, 10), checkOut: checkOut.toISOString().slice(0, 10),
});
const cappedQuote = { pointsToUse: 714, discountAmount: 499800, redemptionRate: 700 };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Authorization,Content-Type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };

for (const outcome of ['SETTLED', 'REVIEW_REQUIRED']) {
  test(`booking details refreshes pending points to ${outcome} without changing the paid receipt`, async ({ page }) => {
    await setup(page, route => route.fulfill({ json: cappedQuote }));
    let loyaltyStatus = 'PENDING';
    await page.route('**/api/bookings/00000000-0000-4000-8000-0000000000e4', route => route.fulfill({ headers: cors, json: {
      id: '00000000-0000-4000-8000-0000000000e4', hotelName: 'Synthetic Hotel', status: 'CONFIRMED', loyaltyStatus,
      totalAmount: 500000, paidAmount: 500000, checkInDate: '2027-01-01', checkOutDate: '2027-01-02', adults: 2, children: 0,
      contactName: 'Synthetic Guest', contactEmail: 'fixture@example.invalid', contactPhone: '0000000000', items: [],
    } }));
    await page.goto('/booking/00000000-0000-4000-8000-0000000000e4');
    await expect(page.getByRole('status')).toContainText('Điểm thưởng đang được xử lý');
    loyaltyStatus = outcome;
    await page.getByRole('button', { name: 'Cập nhật trạng thái điểm' }).click();
    if (outcome === 'SETTLED') await expect(page.getByRole('status')).toHaveCount(0);
    else await expect(page.getByRole('status')).toContainText('cần được đối soát');
    await expect(page.getByText('CONFIRMED', { exact: true })).toBeVisible();
  });
}

async function setup(page: Page, quoteHandler: (route: Route) => Promise<void>, onBooking?: (body: { pointsToUse: number }) => void,
  balance = { totalPoints: 1000, usedPoints: 0, availablePoints: 1000, reservedPoints: 0 }) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, role: 'CUSTOMER', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  await page.addInitScript(({ userId, payload }) => {
    localStorage.setItem('token', 'fixture.' + payload + '.unsigned');
    localStorage.setItem('user', JSON.stringify({ userId, role: 'CUSTOMER', fullName: 'Synthetic Guest', email: 'quote@example.invalid' }));
  }, { userId, payload });
  // Browser tests use synthetic route fixtures; no request may mutate a real backend.
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.port === '8080') {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (url.pathname === '/api/bookings/cancellation-policy') return route.fulfill({ json: {
        version: 'STANDARD_24H_V1', checkInTime: '14:00', timeZone: 'Asia/Ho_Chi_Minh', freeCancellationHours: 24,
      }, headers: cors });
      if (url.pathname === `/api/loyalty-points/${userId}`) return route.fulfill({ json: balance, headers: cors });
      if (url.pathname === '/api/bookings' && route.request().method() === 'POST') {
        onBooking?.(route.request().postDataJSON());
        return route.fulfill({ status: 503, json: { message: 'Synthetic test stops before booking persistence' }, headers: cors });
      }
      return route.fulfill({ status: 404, json: {}, headers: cors });
    }
    if (url.origin !== 'http://127.0.0.1:3300') return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({ json: null });
    if (url.pathname === `/api/loyalty-points/${userId}/quote`) return quoteHandler(route);
    return route.continue();
  });
  await page.goto(bookingUrl);
  await expect(page.getByRole('spinbutton')).toBeVisible();
  await page.getByRole('checkbox', { name: /Tôi đã đọc/ }).check();
}

test('production booking UI displays server rate/cap and submits actual quoted points', async ({ page }) => {
  let submitted: { pointsToUse: number } | undefined;
  await setup(page, route => route.fulfill({ json: cappedQuote }), body => { submitted = body; });
  await page.getByRole('spinbutton').fill('900');
  await expect(page.getByText(/Báo giá: 714 điểm/)).toBeVisible();
  await expect(page.getByText('500.200 VND', { exact: true })).toBeVisible();
  await page.locator('form input[type="text"]').first().fill('Synthetic Guest');
  await page.locator('input[type="email"]').fill('quote@example.invalid');
  await page.locator('input[type="tel"]').fill('912345678');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect.poll(() => submitted?.pointsToUse).toBe(714);
});

test('pending/error quote disables continuation until retry or explicit clear', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await setup(page, async route => { await gate; await route.fulfill({ status: 503, json: { message: 'unavailable' } }); });
  await page.getByRole('spinbutton').fill('900');
  await expect(page.getByText('Chờ báo giá điểm', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole('button', { name: 'Thử lại báo giá điểm' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Không dùng điểm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeEnabled();
});

test('an ambiguous legacy balance cannot fund booking and explains reconciliation', async ({ page }) => {
  await setup(page, route => route.fulfill({ status: 409, json: {} }));
  await page.getByRole('spinbutton').fill('100');
  await expect(page.getByText(/Điểm thưởng cần được đối soát/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Không dùng điểm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeEnabled();
});

test('older response never overwrites a newer points selection', async ({ page }) => {
  let release: () => void = () => {};
  let seen = false;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await setup(page, async route => {
    if (route.request().postDataJSON().pointsToUse === 900) {
      seen = true;
      await gate;
      await route.fulfill({ json: cappedQuote }).catch(() => {}); // The browser may have cancelled this replaced request.
    } else await route.fulfill({ json: { pointsToUse: 100, discountAmount: 70000, redemptionRate: 700 } });
  });
  await page.getByRole('spinbutton').fill('900');
  await expect.poll(() => seen).toBe(true);
  await page.getByRole('spinbutton').fill('100');
  await expect(page.getByText(/Báo giá: 100 điểm/)).toBeVisible();
  release();
  await expect(page.getByText('930.000 VND', { exact: true })).toBeVisible();
  await expect(page.getByText(/Báo giá: 714 điểm/)).toHaveCount(0);
});

test('points held by another booking are explained and excluded from selectable balance', async ({ page }) => {
  let requested = 0;
  await setup(page, async route => {
    requested = route.request().postDataJSON().pointsToUse;
    await route.fulfill({ json: { pointsToUse: 400, discountAmount: 200000, redemptionRate: 500 } });
  }, undefined, { totalPoints: 1000, usedPoints: 0, availablePoints: 400, reservedPoints: 600 });
  await expect(page.getByText('Đang giữ cho đặt phòng khác: 600 điểm')).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveAttribute('max', '400');
  await page.getByRole('spinbutton').fill('900');
  await expect.poll(() => requested).toBe(400);
  await expect(page.getByText(/Báo giá: 400 điểm/)).toBeVisible();
});
