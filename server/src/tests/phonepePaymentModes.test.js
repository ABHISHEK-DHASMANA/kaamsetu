import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhonePePaymentFlow } from '../services/phonepeService.js';

test('PhonePe checkout uses the default PG V2 Standard Checkout flow', () => {
  const flow = buildPhonePePaymentFlow('https://kaamsetu.example/payments');
  assert.deepEqual(flow, {
    type: 'PG_CHECKOUT',
    merchantUrls: { redirectUrl: 'https://kaamsetu.example/payments' }
  });
});
