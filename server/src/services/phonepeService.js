let cachedToken = null;
let tokenExpiresAt = 0;

const getConfig = () => {
  const environment = (process.env.PHONEPE_ENV || 'sandbox').toLowerCase();
  const sandbox = environment !== 'production';
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION;

  if (!clientId || !clientSecret || !clientVersion) {
    const error = new Error('PhonePe checkout is not configured. Ask the authorized business representative to configure merchant credentials.');
    error.statusCode = 503;
    throw error;
  }

  return {
    sandbox,
    clientId,
    clientSecret,
    clientVersion,
    apiBase: sandbox ? 'https://api-preprod.phonepe.com/apis/pg-sandbox' : 'https://api.phonepe.com/apis/pg'
  };
};

const readJson = async response => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'PhonePe service request failed.');
    error.statusCode = 502;
    throw error;
  }
  return body;
};

const getAccessToken = async config => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const authBase = config.sandbox
    ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
    : 'https://api.phonepe.com/apis/identity-manager';
  const form = new URLSearchParams({
    client_id: config.clientId,
    client_version: config.clientVersion,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials'
  });

  const response = await fetch(`${authBase}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
  const data = await readJson(response);
  if (!data.access_token) throw new Error('PhonePe did not return an access token.');

  cachedToken = data.access_token;
  tokenExpiresAt = Number(data.expires_at || 0) * 1000 || Date.now() + 25 * 60 * 1000;
  return cachedToken;
};

export const createPhonePeCheckout = async ({ merchantOrderId, amountPaisa, redirectUrl }) => {
  const config = getConfig();
  const token = await getAccessToken(config);
  const response = await fetch(`${config.apiBase}/checkout/v2/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `O-Bearer ${token}`
    },
    body: JSON.stringify({
      merchantOrderId,
      amount: amountPaisa,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: { redirectUrl }
      }
    })
  });

  return readJson(response);
};

export const fetchPhonePeOrderStatus = async merchantOrderId => {
  const config = getConfig();
  const token = await getAccessToken(config);
  const response = await fetch(
    `${config.apiBase}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`,
    { headers: { Authorization: `O-Bearer ${token}` } }
  );
  return readJson(response);
};

export const isPhonePeConfigured = () =>
  Boolean(process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET && process.env.PHONEPE_CLIENT_VERSION);
