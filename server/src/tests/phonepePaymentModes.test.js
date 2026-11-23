import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhonePePaymentFlow } from '../services/phonepeService.js';

test('PhonePe checkout enables UPI intent and QR flows', () => {
  const flow = buildPhonePePaymentFlow('https://kaamsetu.example/payments');
  assert.equal(flow.type, 'PG_CHECKOUT');
  assert.equal(flow.merchantUrls.redirectUrl, 'https://kaamsetu.example/payments');
  assert.deepEqual(flow.paymentModeConfig, {
    version: 'V2',
    enabledPaymentModes: [{ type: 'UPI', flows: ['INTENT', 'QR'] }]
  });
});

test('PhonePe checkout does not hard-code or restrict the UPI app list', () => {
  const flow = buildPhonePePaymentFlow('https://kaamsetu.example/payments');
  const upiMode = flow.paymentModeConfig.enabledPaymentModes.find(mode => mode.type === 'UPI');
  assert.equal(Object.hasOwn(upiMode, 'apps'), false);
});
