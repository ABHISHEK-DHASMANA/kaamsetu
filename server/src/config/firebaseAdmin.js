import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseAuth = null;

export const getFirebaseAdminAuth = () => {
  if (firebaseAuth) return firebaseAuth;

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) {
    throw new Error('Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawCredentials);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.');
  }

  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error('Firebase service-account JSON is missing required fields.');
  }

  const expectedProjectId = process.env.FIREBASE_PROJECT_ID || 'kaamsetu-83aef';
  if (serviceAccount.project_id !== expectedProjectId) {
    throw new Error('Firebase service-account project does not match the configured project.');
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

  firebaseAuth = getAuth(app);
  return firebaseAuth;
};
