import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setDb, getDb } from '../services/storage.js';
import { createPayment, getPaymentQuote, confirmPaymentReceived } from '../controllers/paymentController.js';

const resetDb = () => setDb({
  users: [],
  workerProfiles: [{ _id: 'worker-profile-1', userId: 'worker-1', fullName: 'Test Worker', upiId: 'worker@okaxis', skillPassport: { completedJobsCount: 0 } }],
  employerProfiles: [{ _id: 'employer-profile-1', userId: 'employer-1', companyName: 'Test Employer' }],
  jobs: [{ _id: 'job-1', title: 'Painting work', offeredWage: 600, wageType: 'daily', workDuration: '1 day' }],
  applications: [{ _id: 'application-1', jobId: 'job-1', workerId: 'worker-1', employerId: 'employer-1', status: 'PaymentPending', paymentMode: 'direct_upi' }],
  payments: [], notifications: [], reviews: [], reports: []
});

const response = () => ({
  statusCode: 200, body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

afterEach(() => resetDb());

test('payment quote only exposes worker UPI to the employer assigned to that application', async () => {
  resetDb();
  const res = response();
  await getPaymentQuote({ user: { _id: 'employer-1', role: 'employer' }, params: { applicationId: 'application-1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.quote.amount, 600);
  assert.equal(res.body.quote.workerUpiId, 'worker@okaxis');
  const unauthorized = response();
  await getPaymentQuote({ user: { _id: 'other-employer', role: 'employer' }, params: { applicationId: 'application-1' } }, unauthorized);
  assert.equal(unauthorized.statusCode, 404);
});

test('direct UPI payment report awaits worker confirmation and completes the job only after confirmation', async () => {
  resetDb();
  const created = response();
  await createPayment({ user: { _id: 'employer-1', role: 'employer' }, body: { applicationId: 'application-1', method: 'direct_upi', amount: 1 } }, created);
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.payment.amount, 600);
  assert.equal(created.body.payment.status, 'awaiting_worker_confirmation');
  assert.equal(created.body.payment.verificationLevel, 'employer_reported');
  const confirmed = response();
  await confirmPaymentReceived({ user: { _id: 'worker-1', role: 'worker' }, params: { id: created.body.payment._id } }, confirmed);
  assert.equal(confirmed.statusCode, 200);
  assert.equal(confirmed.body.payment.status, 'paid');
  assert.equal(confirmed.body.payment.verificationLevel, 'party_confirmed');
  assert.match(confirmed.body.message, /not independent bank or gateway verification/i);
  assert.equal(getDb().applications[0].status, 'Completed');
  assert.equal(getDb().workerProfiles[0].skillPassport.completedJobsCount, 1);
});

test('another employer cannot record a payment for this application', async () => {
  resetDb();
  const res = response();
  await createPayment({ user: { _id: 'other-employer', role: 'employer' }, body: { applicationId: 'application-1', method: 'direct_upi' } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(getDb().payments.length, 0);
});
