import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  apiGetEmployerApplications, apiGetMyPayments, apiGetWorkerApplications,
  apiConfirmPaymentReceived, apiDisputePayment, apiGetPhonePeAvailability,
  apiCreatePhonePeCheckout, apiGetPhonePePaymentStatus, apiGetMyPhonePePayments,
  apiGetPhonePePaymentQuote, apiCreatePayment, apiGetWorkerProfile, apiUpdateWorkerProfile
} from '../../services/api';
import { Banknote, CheckCircle2, Clock3, IndianRupee, ShieldCheck, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

type ApplicationOption = {
  _id: string; status: string;
  job?: { title?: string; offeredWage?: number; wageType?: string; workDuration?: string };
  workerProfile?: { fullName?: string; upiId?: string };
};
type LegacyPayment = {
  _id: string; amount: number; method: string; status: string; jobTitle: string;
  workerName: string; employerName: string; transactionReference?: string;
  createdAt: string; note?: string;
};
type PhonePePayment = {
  merchantOrderId: string; applicationId: string; amount: number; currency: string;
  status: 'pending' | 'paid' | 'failed'; payoutStatus?: string; providerState?: string; verifiedAt?: string; createdAt: string;
};
type Quote = { applicationId: string; jobTitle: string; workerName: string; amount: number; currency: string; wageType: string; duration: string; alreadyCollected?: boolean; directPaymentPending?: boolean; directPaymentStatus?: string | null; payoutStatus?: string | null; checkoutPending?: boolean; checkoutUrl?: string };

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const isWorker = user?.role === 'worker';
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [legacyPayments, setLegacyPayments] = useState<LegacyPayment[]>([]);
  const [phonePePayments, setPhonePePayments] = useState<PhonePePayment[]>([]);
  const [available, setAvailable] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [environment, setEnvironment] = useState('sandbox');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [workerUpiId, setWorkerUpiId] = useState('');
  const [upiSaving, setUpiSaving] = useState(false);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [legacy, gateway] = await Promise.all([apiGetMyPayments(), apiGetMyPhonePePayments()]);
      setLegacyPayments(legacy.payments || []);
      setPhonePePayments(gateway.payments || []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    if (isWorker) {
      const data = await apiGetWorkerApplications();
      setApplications((data.applications || []).filter((a: ApplicationOption) => a.status === 'PaymentPending'));
    } else {
      const data = await apiGetEmployerApplications();
      setApplications((data.applications || []).filter((a: ApplicationOption) => a.status === 'PaymentPending'));
    }
  }, [isWorker]);

  useEffect(() => {
    let active = true;
    Promise.all([refresh(), loadApplications(), apiGetPhonePeAvailability()])
      .then(([, , status]) => {
        if (!active) return;
        setAvailable(status.available);
        setWebhookConfigured(status.webhookConfigured === true);
        setEnvironment(status.environment || 'sandbox');
      })
      .catch((e: any) => { if (active) setError(e.message || 'Unable to load payment information.'); });
    return () => { active = false; };
  }, [refresh, loadApplications]);

  useEffect(() => {
    if (!isWorker) return;
    let active = true;
    apiGetWorkerProfile()
      .then(data => { if (active) setWorkerUpiId((data.workerProfile as any)?.upiId || ''); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isWorker]);

  useEffect(() => {
    if (isWorker || !applicationId) { setQuote(null); return; }
    let active = true;
    setQuoteLoading(true);
    apiGetPhonePePaymentQuote(applicationId)
      .then(data => { if (active) setQuote(data.quote); })
      .catch((e: any) => { if (active) { setQuote(null); setError(e.message || 'Could not calculate the job payment.'); } })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [applicationId, isWorker]);

  const syncGatewayStatuses = useCallback(async () => {
    const pending = phonePePayments.filter(p => p.status === 'pending');
    if (!pending.length) return;
    await Promise.allSettled(pending.map(p => apiGetPhonePePaymentStatus(p.merchantOrderId)));
    await refresh();
    await loadApplications();
  }, [phonePePayments, refresh, loadApplications]);

  useEffect(() => {
    const orderId = searchParams.get('merchantOrderId');
    if (!orderId) return;
    let active = true;
    setMessage('Checking your PhonePe payment securely…');
    apiGetPhonePePaymentStatus(orderId)
      .then(async result => {
        if (!active) return;
        const state = result.payment?.status;
        setMessage(state === 'paid' ? 'Payment collection verified by PhonePe. Worker payout remains pending the approved settlement process.' : state === 'failed' ? 'PhonePe reports that this payment failed. You can retry checkout.' : 'Payment is not confirmed yet. We will keep checking its status.');
        await refresh();
        await loadApplications();
      })
      .catch((e: any) => { if (active) setError(e.message || 'Could not verify the payment yet.'); })
      .finally(() => {
        if (active) {
          const next = new URLSearchParams(searchParams);
          next.delete('merchantOrderId');
          setSearchParams(next, { replace: true });
        }
      });
    return () => { active = false; };
  }, [searchParams, setSearchParams, refresh, loadApplications]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
      syncGatewayStatuses().catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [refresh, syncGatewayStatuses]);

  const paidTotal = useMemo(
    () => legacyPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0)
      + phonePePayments.filter(p => p.status === 'paid' && (!isWorker || p.payoutStatus === 'paid')).reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [legacyPayments, phonePePayments]
  );
  const pendingTotal = useMemo(
    () => legacyPayments.filter(p => p.status === 'awaiting_worker_confirmation').reduce((sum, p) => sum + Number(p.amount || 0), 0)
      + phonePePayments.filter(p => p.status === 'pending' || (isWorker && p.status === 'paid' && p.payoutStatus !== 'paid')).reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [legacyPayments, phonePePayments]
  );

  const selectedApplication = applications.find(a => a._id === applicationId);
  const selectedWorkerUpiId = selectedApplication?.workerProfile?.upiId || '';
  const upiQrValue = selectedWorkerUpiId && quote && quote.amount > 0
    ? 'upi://pay?pa=' + encodeURIComponent(selectedWorkerUpiId)
      + '&pn=' + encodeURIComponent(selectedApplication?.workerProfile?.fullName || 'KaamSetu Worker')
      + '&am=' + encodeURIComponent(String(quote.amount))
      + '&cu=INR&tn=' + encodeURIComponent('KaamSetu job payment')
    : '';

  const saveWorkerUpi = async (event: React.FormEvent) => {
    event.preventDefault();
    setUpiSaving(true); setError(''); setMessage('');
    const cleanUpiId = workerUpiId.trim();
    if (!/^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(cleanUpiId)) {
      setError('Enter a valid UPI ID, for example name@bank.');
      setUpiSaving(false);
      return;
    }
    try {
      await apiUpdateWorkerProfile({ upiId: cleanUpiId } as any);
      setWorkerUpiId(cleanUpiId);
      setMessage('UPI ID saved. Employers can use it for direct payment on jobs assigned to you.');
      await loadApplications();
    } catch (e: any) {
      setError(e.message || 'Could not save your UPI ID.');
    } finally {
      setUpiSaving(false);
    }
  };

  const submitDirectUpiPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicationId || !quote || !selectedWorkerUpiId) return;
    if (reference.trim().length < 6) {
      setError('Enter the UPI transaction reference / UTR shown by your payment app.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await apiCreatePayment({
        applicationId,
        amount: quote.amount,
        method: 'direct_upi',
        transactionReference: reference.trim(),
        note: note.trim()
      });
      setMessage(result.message);
      setQuote(current => current ? { ...current, directPaymentPending: true, directPaymentStatus: 'awaiting_worker_confirmation' } : current);
      setReference('');
      setNote('');
      await refresh();
      await loadApplications();
    } catch (e: any) {
      setError(e.message || 'Could not record the UPI payment.');
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async () => {
    if (!applicationId || !quote) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (quote?.checkoutPending && quote.checkoutUrl) {
        window.location.assign(quote.checkoutUrl);
        return;
      }
      const result = await apiCreatePhonePeCheckout({ applicationId });
      if (!result.checkoutUrl) throw new Error('PhonePe did not provide a checkout link.');
      window.location.assign(result.checkoutUrl);
    } catch (e: any) {
      setError(e.message || 'Could not start secure checkout.');
      setBusy(false);
    }
  };

  const confirmLegacyPayment = async (payment: LegacyPayment) => {
    if (!window.confirm(`Confirm that ${money(payment.amount)} for ${payment.jobTitle} is visible as received. Only confirm after checking.`)) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiConfirmPaymentReceived(payment._id); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not confirm payment.'); }
    finally { setBusy(false); }
  };

  const disputeLegacyPayment = async (id: string) => {
    const reason = window.prompt('Briefly explain why this payment is incorrect or not received:');
    if (!reason) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiDisputePayment(id, reason); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not dispute payment.'); }
    finally { setBusy(false); }
  };

  const applicationName = (id: string) => {
    const app = applications.find(a => a._id === id);
    return app?.job?.title || 'Job payment';
  };

  return (
    <DashboardLayout title={isWorker ? 'My Earnings' : 'Payments'} subtitle={isWorker ? 'Track payments verified by KaamSetu' : 'Pay securely using your preferred supported UPI app'}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-brand-border p-4">
            <div className="text-xs text-brand-muted">{isWorker ? 'Payouts completed' : 'Payments collected'}</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{money(paidTotal)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-brand-border p-4">
            <div className="text-xs text-brand-muted">Pending verification</div>
            <div className="text-xl font-black text-amber-600 mt-1">{money(pendingTotal)}</div>
          </div>
        </div>

        {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-sm">{message}</div>}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</div>}

        {!isWorker && (
          <section className="bg-white rounded-2xl border border-brand-border p-5 space-y-4">
            <div>
              <h2 className="font-bold text-brand-dark">Pay for completed work</h2>
              <p className="text-xs text-brand-muted mt-1">KaamSetu calculates the agreed amount automatically. PhonePe Checkout offers supported UPI options, including Google Pay, PhonePe, Paytm and BHIM where available. On supported mobile devices it can open a UPI app; on desktop it can show a QR for scanning with a UPI app. You do not need to enter an amount or transaction reference.</p>
            </div>
            <label className="block text-xs font-semibold text-brand-muted">Job awaiting payment
              <select value={applicationId} onChange={e => setApplicationId(e.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark">
                <option value="">Select a completed job</option>
                {applications.map(a => <option key={a._id} value={a._id}>{a.workerProfile?.fullName || 'Worker'} — {a.job?.title || 'Completed job'}</option>)}
              </select>
            </label>
            {quoteLoading && <div className="text-sm text-brand-muted">Calculating agreed payment…</div>}
            {quote && (
              <div className="rounded-xl bg-slate-50 border border-brand-border p-4 space-y-2">
                <div className="text-xs text-brand-muted">Amount due for {quote.jobTitle}</div>
                <div className="text-3xl font-black text-brand-dark">{money(quote.amount)}</div>
                <div className="text-xs text-brand-muted">Worker: {quote.workerName} · Based on {quote.wageType} wage · {quote.duration}</div>
                {quote.alreadyCollected && <div className="text-xs font-semibold text-amber-700 mt-2">Payment already collected by KaamSetu. Do not pay again. Worker payout is pending approved settlement.</div>}
                {quote.checkoutPending && <div className="text-xs font-semibold text-blue-700 mt-2">A checkout is already open for this job. Continue it below to avoid creating a duplicate payment.</div>}
                {quote.directPaymentPending && <div className="text-xs font-semibold text-amber-700 mt-2">A direct UPI payment has already been recorded. Wait for the worker to confirm receipt; do not pay again.</div>}
              </div>
            )}
            {!available && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0"/>
                <span>Secure checkout is not enabled yet. The authorised KaamSetu business administrator must finish PhonePe merchant onboarding and configure the approved credentials on the backend.</span>
              </div>
            )}
            {available && !webhookConfigured && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">PhonePe server notifications are not configured yet. Payment status can still be checked when the payer returns to KaamSetu, but automatic updates while the page is closed require the merchant webhook to be configured by the authorised business administrator.</div>}
            {environment !== 'production' && available && <div className="text-xs text-amber-700">Sandbox mode: test transactions only. No real money will be transferred.</div>}
            <button type="button" onClick={startCheckout} disabled={busy || !applicationId || !quote || quote.alreadyCollected || quote.directPaymentPending || !available || quoteLoading || (quote.checkoutPending && !quote.checkoutUrl)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 text-sm font-bold disabled:opacity-50">
              <Wallet className="w-4 h-4"/>{busy ? 'Opening secure checkout…' : `${quote?.checkoutPending ? 'Resume UPI checkout' : 'Continue to UPI checkout ' + (quote ? money(quote.amount) : '')}`}
            </button>
            {!quote?.alreadyCollected && !quote?.checkoutPending && !quote?.directPaymentPending && <div className="border-t border-brand-border pt-4 space-y-3">
              <div>
                <h3 className="font-bold text-sm text-brand-dark">Or pay the worker directly with UPI</h3>
                <p className="text-xs text-brand-muted mt-1">This restores KaamSetu's earlier direct UPI option. The amount is fixed from the agreed job payment. On Android, the button opens compatible UPI apps; on desktop, scan the QR with any UPI app.</p>
              </div>
              {!selectedWorkerUpiId && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">This worker has not added a UPI ID yet. Ask them to add it in their Payments page before paying.</div>}
              {upiQrValue && <form onSubmit={submitDirectUpiPayment} className="space-y-3">
                <div className="rounded-xl border border-brand-border p-4 flex flex-col sm:flex-row items-center gap-4">
                  <QRCodeSVG value={upiQrValue} size={164} level="M"/>
                  <div className="text-xs text-brand-muted">
                    <strong className="block text-brand-dark text-sm mb-1">Pay directly to {selectedApplication?.workerProfile?.fullName || 'the worker'}</strong>
                    <span className="font-semibold">{selectedWorkerUpiId}</span>
                    <p className="mt-1">Amount: {money(quote?.amount || 0)}. Verify the payee name and amount in your UPI app before authorising.</p>
                    <a href={upiQrValue} className="inline-flex mt-3 justify-center rounded-lg bg-brand-primary text-white px-4 py-2.5 font-bold text-xs">Pay with any UPI app</a>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-brand-muted">UPI transaction reference / UTR
                  <input required value={reference} onChange={e => setReference(e.target.value)} minLength={6} maxLength={100} placeholder="Enter the reference shown after payment" className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark"/>
                </label>
                <label className="block text-xs font-semibold text-brand-muted">Note (optional)
                  <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="Payment note" className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark"/>
                </label>
                <button type="submit" disabled={busy || !reference.trim() || quote?.alreadyCollected || quote?.checkoutPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-bold disabled:opacity-50">
                  <Wallet className="w-4 h-4"/>{busy ? 'Recording payment…' : 'I have paid using UPI'}
                </button>
                <p className="text-[11px] text-brand-muted">After recording, the worker must independently confirm the money reached their UPI account. This is a two-party confirmation, not automatic bank verification.</p>
              </form>}
            </div>}
          </section>
        )}

        {isWorker && (
          <section className="bg-white rounded-2xl border border-brand-border p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-brand-dark"><ShieldCheck className="w-5 h-5 text-emerald-600"/>Your UPI payment details</div>
            <p className="text-sm text-brand-muted">Add your own UPI ID so an employer can pay you directly using Google Pay, PhonePe, Paytm, BHIM or another compatible UPI app. KaamSetu does not store or handle the money.</p>
            <form onSubmit={saveWorkerUpi} className="flex flex-col sm:flex-row gap-2">
              <input value={workerUpiId} onChange={e => setWorkerUpiId(e.target.value)} maxLength={100} placeholder="yourname@bank" className="flex-1 rounded-xl border border-brand-border p-3 text-sm" />
              <button disabled={upiSaving} className="rounded-xl bg-brand-primary text-white px-4 py-3 text-sm font-bold disabled:opacity-50">{upiSaving ? 'Saving…' : 'Save UPI ID'}</button>
            </form>
            {workerUpiId && <div className="inline-flex flex-col items-center gap-2 rounded-xl border border-brand-border p-4">
              <QRCodeSVG value={'upi://pay?pa=' + encodeURIComponent(workerUpiId) + '&pn=' + encodeURIComponent(user?.name || 'KaamSetu Worker') + '&cu=INR'} size={164} level="M"/>
              <span className="text-xs font-semibold text-brand-dark">{workerUpiId}</span>
              <span className="text-[11px] text-brand-muted">UPI ID format saved; your bank account has not been independently verified by KaamSetu.</span>
            </div>}
          </section>
        )}

        <section className="bg-white rounded-2xl border border-brand-border overflow-hidden">
          <div className="p-5 border-b border-brand-border flex items-center justify-between gap-3">
            <div><h2 className="font-bold text-brand-dark">{isWorker ? 'Payment and payout history' : 'Gateway payment history'}</h2><p className="text-xs text-brand-muted mt-1">{phonePePayments.length} gateway record(s)</p></div>
            <button onClick={() => { refresh().catch(() => undefined); syncGatewayStatuses().catch(() => undefined); }} disabled={refreshing} className="rounded-lg border border-brand-border p-2 text-brand-muted disabled:opacity-50" aria-label="Refresh payments"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/></button>
          </div>
          {phonePePayments.length === 0 ? <div className="p-8 text-center text-sm text-brand-muted">No gateway payments yet.</div> : <div className="divide-y divide-brand-border">
            {phonePePayments.map(payment => (
              <div key={payment.merchantOrderId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div><div className="font-semibold text-sm text-brand-dark">{applicationName(payment.applicationId)}</div><div className="text-xs text-brand-muted mt-1">Order {payment.merchantOrderId} · {new Date(payment.createdAt).toLocaleString('en-IN')}</div></div>
                <div className="flex items-center gap-3"><strong className="text-brand-dark">{money(payment.amount)}</strong><span className={`text-xs font-bold rounded-full px-2.5 py-1 ${payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{payment.status === 'paid' ? (payment.payoutStatus === 'paid' ? 'Paid to worker' : 'Collected · payout pending') : payment.status === 'failed' ? 'Failed' : 'Pending'}</span></div>
              </div>
            ))}
          </div>}
        </section>

        <section className="bg-white rounded-2xl border border-brand-border overflow-hidden">
          <div className="p-5 border-b border-brand-border"><h2 className="font-bold text-brand-dark">Previous payment records</h2><p className="text-xs text-brand-muted mt-1">Older direct UPI and cash records are retained for history.</p></div>
          {legacyPayments.length === 0 ? <div className="p-8 text-center text-sm text-brand-muted">No previous payment records.</div> : <div className="divide-y divide-brand-border">
            {legacyPayments.map(payment => <div key={payment._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-brand-primary-light text-brand-primary flex items-center justify-center"><Banknote className="w-4 h-4"/></div><div><div className="font-bold text-sm text-brand-dark">{payment.jobTitle}</div><div className="text-xs text-brand-muted mt-1">{isWorker ? payment.employerName : payment.workerName} · {payment.method === 'cash' ? 'Cash' : 'Previous direct UPI'}</div>{payment.transactionReference && <div className="text-[11px] text-brand-muted mt-1">Reference: {payment.transactionReference}</div>}<div className="text-[11px] text-brand-muted mt-1">{new Date(payment.createdAt).toLocaleString('en-IN')}</div></div></div>
              <div className="flex flex-wrap items-center gap-3"><strong>{money(payment.amount)}</strong><span className="text-xs font-bold">{payment.status === 'paid' ? 'Confirmed' : payment.status === 'disputed' ? 'Disputed' : 'Awaiting worker confirmation'}</span>
                {isWorker && payment.status === 'awaiting_worker_confirmation' && <button disabled={busy} onClick={() => confirmLegacyPayment(payment)} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1"/>Confirm received</button>}
                {payment.status === 'awaiting_worker_confirmation' && <button disabled={busy} onClick={() => disputeLegacyPayment(payment._id)} className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Dispute</button>}
              </div>
            </div>)}
          </div>}
        </section>

        <div className="text-xs text-brand-muted flex items-center gap-2"><Clock3 className="w-4 h-4"/> Direct UPI payments are transferred to the worker's UPI account. A transaction reference alone is not proof; the worker must confirm receipt. PhonePe gateway collection is tracked separately from worker payout.</div>
        <div className="text-[11px] text-brand-muted flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5"/> Gateway collection and worker payouts depend on the approved PhonePe merchant and settlement configuration.</div>
      </div>
    </DashboardLayout>
  );
};
