import { createHash, timingSafeEqual } from 'node:crypto';

export const createPhonePeWebhookAuthHash = (username, password) =>
  createHash('sha256').update(`${username}:${password}`, 'utf8').digest('hex');

export const isValidPhonePeWebhookAuthorization = (
  authorization,
  username = process.env.PHONEPE_WEBHOOK_USERNAME,
  password = process.env.PHONEPE_WEBHOOK_PASSWORD
) => {
  if (!username || !password || typeof authorization !== 'string') return false;
  const supplied = authorization.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  const expected = createPhonePeWebhookAuthHash(username, password);
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
};
