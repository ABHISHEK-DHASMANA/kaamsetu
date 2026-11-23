const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export const isEmailDeliveryConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.FRONTEND_URL);

export const sendVerificationEmail = async ({ to, token, name }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!apiKey || !from || !frontendUrl) {
    const error = new Error('Email verification is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and FRONTEND_URL on the backend.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const base = frontendUrl.replace(/\/+$/, '');
  const verificationUrl = base + '/verify-email?token=' + encodeURIComponent(token);
  const safeName = escapeHtml(name || 'there');
  const safeUrl = escapeHtml(verificationUrl);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Verify your KaamSetu email address',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">' +
        '<h2>Verify your KaamSetu email</h2><p>Hello ' + safeName + ',</p>' +
        '<p>Confirm this email address to enable email-and-password sign-in.</p>' +
        '<p><a href="' + safeUrl + '" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">Verify email address</a></p>' +
        '<p>This link expires in 24 hours. If you did not request this, you can ignore this email.</p></div>'
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[Email] Verification delivery failed:', response.status, detail.slice(0, 500));
    const error = new Error('The verification email could not be delivered. Check the email provider configuration and try again.');
    error.code = 'EMAIL_DELIVERY_FAILED';
    throw error;
  }
};
