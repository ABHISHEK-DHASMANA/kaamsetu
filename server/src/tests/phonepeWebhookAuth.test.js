import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPhonePeWebhookAuthHash,
  isValidPhonePeWebhookAuthorization
} from '../services/phonepeWebhookAuth.js';

test('creates the SHA-256 webhook authorization hash', () => {
  assert.equal(
    createPhonePeWebhookAuthHash('kaamsetu', 'test-password'),
    'c3653ff10002ae75c96a7d419fab914d8754b031c6d018ca374be4cf5f6d7196'
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
