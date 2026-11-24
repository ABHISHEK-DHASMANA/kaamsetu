import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setDb, getDb } from '../services/storage.js';
import {
  createPayment, getPaymentQuote, respondToPaymentRequest,
  approvePaymentCounter, reportDirectPayment, confirmPaymentReceived
} from '../controllers/paymentController.js';

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

test('payment quote exposes UPI only to the employer assigned to the application', async () => {
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

test('worker can counter employer amount, employer approves, UPI reference is reported, and worker confirms receipt', async () => {
  resetDb();
  const created = response();
  await createPayment({ user: { _id: 'employer-1', role: 'employer' }, body: { applicationId: 'application-1', method: 'direct_upi', amount: 700 } }, created);
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.payment.status, 'requested_by_worker');
  assert.equal(created.body.payment.amount, 700);

  const countered = response();
  await respondToPaymentRequest({ user: { _id: 'worker-1', role: 'worker' }, params: { id: created.body.payment._id }, body: { action: 'counter', amount: 800 } }, countered);
  assert.equal(countered.statusCode, 200);
  assert.equal(countered.body.payment.status, 'countered_by_worker');
  assert.equal(countered.body.payment.amount, 800);

  const approved = response();
  await approvePaymentCounter({ user: { _id: 'employer-1', role: 'employer' }, params: { id: created.body.payment._id } }, approved);
  assert.equal(approved.statusCode, 200);
  assert.equal(approved.body.payment.status, 'approved_by_employer');
  assert.equal(approved.body.payment.amount, 800);

  const reported = response();
  await reportDirectPayment({ user: { _id: 'employer-1', role: 'employer' }, params: { id: created.body.payment._id }, body: { transactionReference: 'UPI123456789' } }, reported);
  assert.equal(reported.statusCode, 200);
  assert.equal(reported.body.payment.status, 'awaiting_worker_confirmation');
  assert.equal(reported.body.payment.transactionReference, 'UPI123456789');

  const confirmed = response();
  await confirmPaymentReceived({ user: { _id: 'worker-1', role: 'worker' }, params: { id: created.body.payment._id } }, confirmed);
  assert.equal(confirmed.statusCode, 200);
  assert.equal(confirmed.body.payment.status, 'paid');
  assert.equal(confirmed.body.payment.verificationLevel, 'party_confirmed');
  assert.match(confirmed.body.message, /not independent bank or gateway verification/i);
  assert.equal(getDb().applications[0].status, 'Completed');
  assert.equal(getDb().workerProfiles[0].skillPassport.completedJobsCount, 1);
});


test('legacy online payment mode uses direct UPI quote and accepts direct UPI request', async () => {
  resetDb();
  getDb().applications[0].paymentMode = 'online';
  const quote = response();
  await getPaymentQuote({ user: { _id: 'employer-1', role: 'employer' }, params: { applicationId: 'application-1' } }, quote);
  assert.equal(quote.statusCode, 200);
  assert.equal(quote.body.quote.workerUpiId, 'worker@okaxis');

  const created = response();
  await createPayment({ user: { _id: 'employer-1', role: 'employer' }, body: { applicationId: 'application-1', method: 'direct_upi', amount: 600 } }, created);
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.payment.method, 'direct_upi');

  const accepted = response();
  await respondToPaymentRequest({ user: { _id: 'worker-1', role: 'worker' }, params: { id: created.body.payment._id }, body: { action: 'accept' } }, accepted);
  assert.equal(accepted.statusCode, 200);

  const reported = response();
  await reportDirectPayment({ user: { _id: 'employer-1', role: 'employer' }, params: { id: created.body.payment._id }, body: { transactionReference: 'UPI123456789' } }, reported);
  assert.equal(reported.statusCode, 200);
});

test('worker can accept the employer amount without a counter-offer', async () => {
  resetDb();
  const created = response();
  await createPayment({ user: { _id: 'employer-1', role: 'employer' }, body: { applicationId: 'application-1', method: 'direct_upi', amount: 600 } }, created);
  const accepted = response();
  await respondToPaymentRequest({ user: { _id: 'worker-1', role: 'worker' }, params: { id: created.body.payment._id }, body: { action: 'accept' } }, accepted);
  assert.equal(accepted.statusCode, 200);
  assert.equal(accepted.body.payment.status, 'approved_by_worker');
  const premature = response();
  await confirmPaymentReceived({ user: { _id: 'worker-1', role: 'worker' }, params: { id: created.body.payment._id } }, premature);
  assert.equal(premature.statusCode, 409);
});

test('another employer cannot create a payment request for this application', async () => {
  resetDb();
  const res = response();
  await createPayment({ user: { _id: 'other-employer', role: 'employer' }, body: { applicationId: 'application-1', method: 'direct_upi', amount: 600 } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(getDb().payments.length, 0);
});
