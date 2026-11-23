# KaamSetu authentication and verification setup

This document covers the external settings required by the account, email, and phone verification changes.

## Firebase Phone Authentication

The browser uses Firebase Authentication Phone sign-in with Firebase's reCAPTCHA verifier. The backend verifies the resulting Firebase ID token with Firebase Admin before accepting a phone number at registration or login.

### Firebase Console

1. Open the Firebase project configured by VITE_FIREBASE_PROJECT_ID (currently kaamsetu-83aef).
2. In Authentication → Sign-in method, enable Phone.
3. In Authentication → Settings → Authorized domains, add every hostname used by the live site. Include the stable Vercel production alias and any custom domain; add preview domains only if you intend to test OTP on them.
4. Review Authentication → Settings → SMS region policy and allow the countries in which KaamSetu is intended to operate.
5. Check Firebase SMS quotas, billing requirements, and the Authentication usage dashboard if messages are not delivered. Do not disable app verification or use fake production OTPs.

### Vercel frontend environment

Set these values in the Vercel project's Production and Preview environments as needed:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

These are Firebase web-app configuration values. Never put the Firebase Admin private key in a VITE_ variable.

### Render backend environment

Set:

- FIREBASE_PROJECT_ID=kaamsetu-83aef
- FIREBASE_SERVICE_ACCOUNT_JSON to the complete Firebase service-account JSON string for the same project.
- Keep the service-account private key only in Render's secret environment settings. Do not commit it to GitHub.

The backend rejects registration with a phone number unless the supplied Firebase ID token proves that the same phone number completed Phone Authentication.

## Email verification

KaamSetu sends one-time, 24-hour email verification links using the Resend API. The raw token is not stored; only its SHA-256 hash and expiry are stored.

Create a Resend account, verify a sending domain, and create an API key. Configure these Render environment variables:

- RESEND_API_KEY — secret Resend API key.
- EMAIL_FROM — sender identity on the verified domain, for example KaamSetu <no-reply@example.com>.
- CLIENT_URL — the public frontend origin, for example https://kaamsetu-codexbuilde.vercel.app (no trailing slash is required).

If these values are absent or Resend rejects the message, email registration fails clearly and no account is created. Users can request a fresh verification link from the login page. Email/password login is blocked until the verification link is used.

## Account deletion and retained records

Workers and employers can request deletion from their profile page. The current password is required. The account is disabled and identifying account/profile details are anonymized or removed. Historical jobs, applications, reviews, and payment records are retained so payment reconciliation and work history are not destroyed. Employer open jobs are closed. Messages sent by the deleted account, saved jobs, notifications, and blocks are removed.

## UPI and bank verification status

KaamSetu currently has no UPI existence/ownership verification provider configured. It validates UPI ID syntax only and explicitly labels the result as format-checked, not verified. Do not treat this as proof that the VPA exists or belongs to the worker. A production verification integration would require an approved payment/banking partner and its server-side credentials and onboarding.

The current codebase does not collect or store bank account numbers or IFSC codes. Therefore no bank-account verification is performed. If bank details are added later, use a regulated provider's account-validation/penny-drop API, verify the account-holder name server-side, and store only the minimum required verification result. Never mark an account verified from an IFSC/account-number regex alone.

## Build and smoke tests

- Backend: cd server && npm test
- Frontend: cd client && npm run build
- Test real SMS delivery and email delivery only after configuring the production Firebase and Resend settings. Automated local tests cannot prove delivery to a real phone or inbox.
