import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPhonePeWebhookAuthHash,
  isValidPhonePeWebhookAuthorization
} from '../services/phonepeWebhookAuth.js';

test('creates the SHA-256 webhook authorization hash', () => {
  assert.equal(
    createPhonePeWebhookAuthHash('kaamsetu', 'test-password'),
    '2d1f4f6db7d8f17a7a8c3c9d12d6b92ed1bd2e6e0e3a35c3a0f1a43f2e4c6f90'
  );
});

test('accepts the matching PhonePe SHA authorization header', () => {
  const hash = createPhonePeWebhookAuthHash('merchant-user', 'merchant-password');
  assert.equal(isValidPhonePeWebhookAuthorization(hash, 'merchant-user', 'merchant-password'), true);
});

test('rejects a wrong hash, malformed header, or missing credentials', () => {
  const hash = createPhonePeWebhookAuthHash('merchant-user', 'merchant-password');
  assert.equal(isValidPhonePeWebhookAuthorization(hash, 'merchant-user', 'wrong-password'), false);
  assert.equal(isValidPhonePeWebhookAuthorization('not-a-hash', 'merchant-user', 'merchant-password'), false);
  assert.equal(isValidPhonePeWebhookAuthorization(hash, '', 'merchant-password'), false);
});
