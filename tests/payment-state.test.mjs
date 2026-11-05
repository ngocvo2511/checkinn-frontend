import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartPayment, paymentOutcome, holdSecondsRemaining, canRecordOnsiteReceipt, onsiteReservationMessage } from '../lib/booking/payment-state.ts';

test('onsite room confirmation is separate from money and cannot be charged again', () => {
  const booking = {status:'CONFIRMED',paymentMethod:'HOTEL',paidAmount:0,onsiteReservationStatus:'V1_CONFIRMED'};
  assert.equal(canStartPayment(booking),false);
  assert.equal(canRecordOnsiteReceipt(booking),true);
  assert.equal(canRecordOnsiteReceipt({...booking,paidAmount:1000000}),false);
  for (const state of ['V1_PENDING','V1_REVIEW_REQUIRED']) {
    assert.equal(canRecordOnsiteReceipt({...booking,status:'PENDING_PAYMENT',onsiteReservationStatus:state}),false);
    assert.equal(canStartPayment({...booking,status:'PENDING_PAYMENT',onsiteReservationStatus:state}),false);
    assert.doesNotMatch(onsiteReservationMessage({...booking,status:'PENDING_PAYMENT',onsiteReservationStatus:state}), /Đặt phòng đã được xác nhận/);
  }
  assert.match(onsiteReservationMessage(booking),/thực thu tiền/);
  assert.doesNotMatch(onsiteReservationMessage({...booking,status:'CANCELLED'}),/Đặt phòng đã được xác nhận/);
});
import { bookingAttempt } from '../lib/booking/creation-command.ts';

test('booking retries retain a command key; changed input starts a different attempt', () => {
  const first = bookingAttempt(null, { hotelId: 'hotel', quantity: 1 });
  assert.match(first.key, /^[\da-f-]{36}$/);
  assert.equal(bookingAttempt(first, { hotelId: 'hotel', quantity: 1 }), first);
  const changed = bookingAttempt(first, { hotelId: 'hotel', quantity: 2 });
  assert.notEqual(changed.key, first.key);
  assert.notEqual(bookingAttempt(null, { hotelId: 'hotel', quantity: 1 }).key, first.key);
});

test('hold countdown requires an absolute server deadline and never manufactures a TTL', () => {
  const now = Date.parse('2026-11-05T03:00:00Z');
  for (const deadline of [undefined, null, '', 'bad-date', '2026-11-05T03:15:00', '2026-02-30T03:15:00Z']) {
    assert.equal(holdSecondsRemaining(deadline, now), null);
  }
  assert.equal(holdSecondsRemaining('2026-11-05T03:15:00Z', now), 900);
  assert.equal(holdSecondsRemaining('2026-11-05T10:15:00+07:00', now), 900);
  assert.equal(holdSecondsRemaining('2026-11-05T02:59:59Z', now), 0);
  assert.equal(holdSecondsRemaining('2026-11-05T03:00:00Z', now), 0);
});

test('received money waiting for stock reconciliation cannot be charged again', () => {
  assert.equal(canStartPayment({ status: 'PENDING_PAYMENT', paidAmount: 1000000 }), false);
  assert.equal(paymentOutcome('COMPLETED', 'PENDING_PAYMENT').status, 'pending');
  assert.match(paymentOutcome('COMPLETED', 'PENDING_PAYMENT').message, /không thanh toán lại/);
});
test('reservation confirmation requires both financial and booking confirmation', () => {
  assert.equal(paymentOutcome('COMPLETED', 'CONFIRMED').status, 'success');
  assert.equal(paymentOutcome('PENDING', 'CONFIRMED').status, 'pending');
  assert.equal(paymentOutcome('COMPLETED').status, 'pending');
});
test('cancelled booking with money received points to refund review', () => {
  const outcome = paymentOutcome('COMPLETED', 'CANCELLED');
  assert.equal(outcome.status, 'pending');
  assert.match(outcome.message, /hoàn tiền/);
});
test('only an unpaid pending booking can start payment', () => {
  assert.equal(canStartPayment({ status: 'PENDING', paidAmount: 0 }), true);
  assert.equal(canStartPayment({ status: 'PENDING_PAYMENT', paidAmount: '0' }), true);
  for (const paidAmount of [undefined, null, -1, NaN, 'unknown']) {
    assert.equal(canStartPayment({ status: 'PENDING', paidAmount }), false);
  }
  assert.equal(canStartPayment({ status: 'CANCELLED', paidAmount: 0 }), false);
});
