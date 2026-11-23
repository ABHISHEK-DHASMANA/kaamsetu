import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetEmployerApplications, apiGetMyPayments, apiGetWorkerApplications,
  apiConfirmPaymentReceived, apiDisputePayment, apiGetPhonePeAvailability,
  apiCreatePhonePeCheckout, apiGetPhonePePaymentStatus, apiGetMyPhonePePayments,
  apiGetPhonePePaymentQuote
} from '../../services/api';
import { Banknote, CheckCircle2, Clock3, IndianRupee, ShieldCheck, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

type ApplicationOption = {
  _id: string; status: string;
  job?: { title?: string; offeredWage?: number; wageType?: string; workDuration?: string };
  workerProfile?: { fullName?: string };
};
type LegacyPayment = {
  _id: string; amount: number; method: string; status: string; jobTitle: string;
  workerName: string; employerName: string; transactionReference?: string;
  createdAt: string; note?: string;
};
type PhonePePayment = {
  merchantOrderId: string; applicationId: string; amount: number; currency: string;
  status: 'pending' | 'paid' | 'failed'; providerState?: string; verifiedAt?: string; createdAt: string;
};
type Quote = { applicationId: string; jobTitle: string; workerName: string; amount: number; currency: string; wageType: string; duration: string };

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
  const [environment, setEnvironment] = useState('sandbox');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        setEnvironment(status.environment || 'sandbox');
      })
      .catch((e: any) => { if (active) setError(e.message || 'Unable to load payment information.'); });
    return () => { active = false; };
  }, [refresh, loadApplications]);

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
        setMessage(state === 'paid' ? 'Payment verified successfully. The worker has been notified.' : state === 'failed' ? 'PhonePe reports that this payment failed. You can retry checkout.' : 'Payment is not confirmed yet. We will keep checking its status.');
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
    }, 12000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selectedApplication = applications.find(a => a._id === applicationId);
  const paidTotal = useMemo(
    () => legacyPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0)
      + phonePePayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [legacyPayments, phonePePayments]
  );
  const pendingTotal = useMemo(
    () => legacyPayments.filter(p => p.status === 'awaiting_worker_confirmation').reduce((sum, p) => sum + Number(p.amount || 0), 0)
      + phonePePayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [legacyPayments, phonePePayments]
  );

  const startCheckout = async () => {
    if (!applicationId || !quote) return;
    setBusy(true); setError(''); setMessage('');
    try {
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
    <DashboardLayout title={isWorker ? 'My Earnings' : 'Payments'} subtitle={isWorker ? 'Track payments verified by KaamSetu' : 'Pay the agreed job amount securely through PhonePe'}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-brand-border p-4">
            <div className="text-xs text-brand-muted">Confirmed payments</div>
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
              <p className="text-xs text-brand-muted mt-1">KaamSetu automatically calculates the amount from the job's agreed wage and duration. You do not need to enter an amount, UPI ID or transaction reference.</p>
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
              </div>
            )}
            {!available && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0"/>
                <span>Secure checkout is not enabled yet. The authorised KaamSetu business administrator must finish PhonePe merchant onboarding and configure production credentials on the backend.</span>
              </div>
            )}
            {environment !== 'production' && available && <div className="text-xs text-amber-700">Sandbox mode: test transactions only. No real money will be transferred.</div>}
            <button type="button" onClick={startCheckout} disabled={busy || !applicationId || !quote || !available || quoteLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 text-sm font-bold disabled:opacity-50">
              <Wallet className="w-4 h-4"/>{busy ? 'Opening secure checkout…' : `Continue to pay ${quote ? money(quote.amount) : ''}`}
            </button>
          </section>
        )}

        {isWorker && (
          <section className="bg-white rounded-2xl border border-brand-border p-5">
            <div className="flex items-center gap-2 font-bold text-brand-dark"><ShieldCheck className="w-5 h-5 text-emerald-600"/>Automatic payment confirmation</div>
            <p className="text-sm text-brand-muted mt-2">When an employer pays through KaamSetu's secure PhonePe checkout, the payment is verified with PhonePe. You do not need to enter bank details, UPI IDs or transaction references.</p>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-brand-border overflow-hidden">
          <div className="p-5 border-b border-brand-border flex items-center justify-between gap-3">
            <div><h2 className="font-bold text-brand-dark">{isWorker ? 'Verified earnings' : 'Gateway payment history'}</h2><p className="text-xs text-brand-muted mt-1">{phonePePayments.length} gateway record(s)</p></div>
            <button onClick={() => { refresh().catch(() => undefined); syncGatewayStatuses().catch(() => undefined); }} disabled={refreshing} className="rounded-lg border border-brand-border p-2 text-brand-muted disabled:opacity-50" aria-label="Refresh payments"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/></button>
          </div>
          {phonePePayments.length === 0 ? <div className="p-8 text-center text-sm text-brand-muted">No gateway payments yet.</div> : <div className="divide-y divide-brand-border">
            {phonePePayments.map(payment => (
              <div key={payment.merchantOrderId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div><div className="font-semibold text-sm text-brand-dark">{applicationName(payment.applicationId)}</div><div className="text-xs text-brand-muted mt-1">Order {payment.merchantOrderId} · {new Date(payment.createdAt).toLocaleString('en-IN')}</div></div>
                <div className="flex items-center gap-3"><strong className="text-brand-dark">{money(payment.amount)}</strong><span className={`text-xs font-bold rounded-full px-2.5 py-1 ${payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{payment.status === 'paid' ? 'Paid · Verified' : payment.status === 'failed' ? 'Failed' : 'Pending'}</span></div>
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

        <div className="text-xs text-brand-muted flex items-center gap-2"><Clock3 className="w-4 h-4"/> Payment statuses are updated from the provider's server-side order status. A pending or failed transaction is never shown as paid.</div>
        <div className="text-[11px] text-brand-muted flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5"/> Gateway collection and worker payouts depend on the approved PhonePe merchant and settlement configuration.</div>
      </div>
    </DashboardLayout>
  );
};
