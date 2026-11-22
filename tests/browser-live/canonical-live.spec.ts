import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

// Batch 9G (STD-028): real frontend → real Gateway → real services on the disposable canonical stack.
// No page.route interception. The fixture (synthetic hotel/rooms/booking + a real CUSTOMER JWT obtained through the
// Gateway login) is written by checkinn/docker/canonical-smoke.py into an ignored private file.
type Fixture = { hotelName: string; hotelId: string; approvedRoom: string; pendingRoom: string; bookingId: string;
  checkIn: string; checkOut: string; token: string; user: { userId: string; fullName: string; role: string } };
const fixturePath = process.env.CANONICAL_LIVE_FIXTURE;
const fixture: Fixture | null = fixturePath ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : null;

test.skip(!fixture, 'CANONICAL_LIVE_FIXTURE not provided (run through docker/canonical-smoke.py)');

const gatewayCalls: string[] = [];
async function watch(page: Page) {
  page.on('request', (request) => { if (request.url().startsWith('http://127.0.0.1:58080/')) gatewayCalls.push(new URL(request.url()).pathname); });
}
async function signIn(page: Page) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: fixture!.token, user: fixture!.user });
}

test('search shows the published hotel from the real catalog', async ({ page }) => {
  await watch(page);
  const q = new URLSearchParams({ hotelName: fixture!.hotelName, checkIn: fixture!.checkIn, checkOut: fixture!.checkOut, rooms: '1', adults: '2', children: '0' });
  await page.goto('/search?' + q.toString());
  await expect(page.getByText(fixture!.hotelName).first()).toBeVisible({ timeout: 60000 });
  expect(gatewayCalls.some((p) => p.includes('/api/hotel/hotels/offers'))).toBeTruthy();
});

test('hotel detail lists the approved room and hides the unapproved one', async ({ page }) => {
  await watch(page);
  await page.goto(`/hotel/${fixture!.hotelId}?checkIn=${fixture!.checkIn}&checkOut=${fixture!.checkOut}&rooms=1&adults=2&children=0`);
  await expect(page.getByText(fixture!.approvedRoom).first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByText(fixture!.pendingRoom)).toHaveCount(0);
});

test('payment page shows the real booking and the cancellation policy from the API', async ({ page }) => {
  await watch(page);
  await signIn(page);
  await page.goto(`/booking/payment?bookingId=${fixture!.bookingId}`);
  await expect(page.getByText(fixture!.hotelName).first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByText(/miễn phí hủy trước giờ nhận phòng ít nhất \d+ giờ/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Không hoàn tiền')).toHaveCount(0);
  expect(gatewayCalls.some((p) => p === `/api/bookings/${fixture!.bookingId}`)).toBeTruthy();
  expect(gatewayCalls.some((p) => p === '/api/bookings/cancellation-policy')).toBeTruthy();
});
