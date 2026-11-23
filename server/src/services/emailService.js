const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export const isEmailDeliveryConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.CLIENT_URL);

export const sendVerificationEmail = async ({ to, token }) => {
  if (!isEmailDeliveryConfigured()) {
    const error = new Error('Email delivery is not configured.');
    error.code = 'EMAIL_DELIVERY_NOT_CONFIGURED';
    throw error;
  }
  const baseUrl = process.env.CLIENT_URL.replace(/\/+$/, '');
  const verificationUrl = baseUrl + '/verify-email?token=' + encodeURIComponent(token);
  const safeEmail = escapeHtml(to);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: 'Verify your KaamSetu email address',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">' +
        '<h2>Verify your KaamSetu email</h2>' +
        '<p>Confirm that ' + safeEmail + ' belongs to you by opening the button below.</p>' +
        '<p><a href="' + verificationUrl + '" style="display:inline-block;padding:12px 20px;background:#243b78;color:#fff;text-decoration:none;border-radius:8px">Verify email address</a></p>' +
        '<p>This one-time link expires in 24 hours. If you did not create this account, you can ignore this email.</p>' +
        '<p style="font-size:12px;color:#667085">If the button does not work, copy this link into your browser: ' + verificationUrl + '</p>' +
      '</div>'
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error('Email provider rejected the verification message (HTTP ' + response.status + '): ' + detail.slice(0, 300));
  }
  return true;
};
