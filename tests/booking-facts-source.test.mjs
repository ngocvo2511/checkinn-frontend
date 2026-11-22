import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Batch 9F F-9E-1: booking/payment pages must not state stock, room amenities, times or refund terms
// that no API provides; check-in time and cancellation terms come from GET /api/bookings/cancellation-policy.
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const booking = read('../app/booking/page.tsx');
const payment = read('../app/booking/payment/page.tsx');

test('booking page makes no scarcity claim without an availability source', () => {
  assert.doesNotMatch(booking, /Chỉ còn/);
  assert.doesNotMatch(booking, /Đừng khoảnh chừng/);
});

test('payment page shows no hardcoded room amenities, times or refund terms', () => {
  for (const claim of [/1 giường/, /Bữa sáng cho 2 người/, /WiFi miễn phí/i, /Từ 14:00/, /Trước 12:00/, /Không hoàn tiền/, /Không đổi lịch/])
    assert.doesNotMatch(payment, claim);
});

test('payment page reads check-in time and cancellation terms from the policy API and keeps unknown visible', () => {
  assert.match(payment, /bookingApi\.getCancellationPolicy\(\)/);
  assert.match(payment, /cancellationPolicy\.checkInTime/);
  assert.match(payment, /cancellationPolicy\.freeCancellationHours/);
  assert.match(payment, /Chưa tải được chính sách hủy/);
});
