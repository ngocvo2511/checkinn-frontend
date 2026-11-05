import { test, expect } from '@playwright/test';

for (const scenario of ['missing', 'malformed', 'timezone-less', 'expired', 'active']) {
  test(`payment deadline ${scenario} never falls back to creation plus fifteen minutes`, async ({ page }) => {
    const userId = '00000000-0000-4000-8000-0000000000e1';
    const bookingId = '00000000-0000-4000-8000-0000000000e4';
    const payload = Buffer.from(JSON.stringify({ sub: userId, role: 'CUSTOMER', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    await page.addInitScript(({ userId, payload }) => {
      localStorage.setItem('token', 'fixture.' + payload + '.unsigned');
      localStorage.setItem('user', JSON.stringify({ userId, role: 'CUSTOMER', fullName: 'Synthetic Guest' }));
    }, { userId, payload });
    let deadline: string | undefined = scenario === 'active' ? new Date(Date.now() + 600000).toISOString()
      : scenario === 'expired' ? new Date(Date.now() - 10000).toISOString()
      : scenario === 'malformed' ? 'invalid' : scenario === 'timezone-less' ? '2027-01-01T03:15:00' : undefined;
    let mutations = 0;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.port === '8080') {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Authorization,Content-Type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (url.pathname === `/api/bookings/${bookingId}`) return route.fulfill({ headers, json: {
          id: bookingId, userId, hotelName: 'Synthetic Hotel', status: 'PENDING', totalAmount: 1000000, paidAmount: 0,
          checkInDate: '2027-01-01', checkOutDate: '2027-01-02', adults: 2, children: 0,
          holdExpiresAt: deadline, createdAt: new Date().toISOString(), items: [],
        } });
        if (route.request().method() === 'POST') mutations++;
        return route.fulfill({ status: 503, headers, json: {} });
      }
      if (url.pathname.startsWith('/api/auth')) return route.fulfill({ json: {} });
      return route.continue();
    });
    await page.goto(`/booking/payment?bookingId=${bookingId}`);
    const pay = page.getByRole('button', { name: 'Xác nhận', exact: false });
    if (scenario === 'active') {
      await expect(pay).toBeEnabled();
      await expect(page.getByText(/00:09:\d{2}|00:10:00/)).toBeVisible();
      // A later response without a deadline must clear the old one.
      deadline = undefined;
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expect(page.getByText('Chưa xác minh thời hạn giữ chỗ')).toBeVisible();
    } else if (scenario === 'expired') {
      await expect(page.getByText('00:00:00', { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText('Chưa xác minh thời hạn giữ chỗ')).toBeVisible();
    }
    await expect(pay).toBeDisabled();
    expect(mutations).toBe(0);
  });
}
