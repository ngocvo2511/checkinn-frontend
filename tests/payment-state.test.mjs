import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartPayment, paymentOutcome } from '../lib/booking/payment-state.ts';

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
