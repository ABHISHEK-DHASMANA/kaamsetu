import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetEmployerApplications, apiGetMyPayments, apiGetWorkerApplications,
  apiConfirmPaymentReceived, apiDisputePayment, apiGetPhonePeAvailability,
  apiCreatePayment, apiGetPaymentQuote, apiCreatePhonePeCheckout, apiRespondToPaymentRequest, apiApprovePaymentCounter, apiReportDirectPayment,
  apiGetPhonePePaymentStatus, apiGetMyPhonePePayments, apiGetPhonePePaymentQuote
} from '../../services/api';
import { Banknote, CheckCircle2, Clock3, IndianRupee, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

type ApplicationOption = {
  _id: string; status: string; paymentMode?: 'online' | 'offline' | 'direct_upi' | 'cash';
  job?: { title?: string; offeredWage?: number; wageType?: string; workDuration?: string };
  workerProfile?: { fullName?: string };
};
type LegacyPayment = {
  _id: string; amount: number; method: string; status: string; jobTitle: string;
  workerName: string; employerName: string; transactionReference?: string;
  createdAt: string; note?: string; verificationLevel?: string; employerConfirmed?: boolean;
};
type PhonePePayment = {
  merchantOrderId: string; applicationId: string; amount: number; currency: string;
  status: 'pending' | 'paid' | 'failed'; payoutStatus?: string; providerState?: string; verifiedAt?: string; createdAt: string;
};
type Quote = { applicationId: string; jobTitle: string; workerName: string; amount: number; currency: string; wageType?: string; duration?: string; paymentMode?: 'direct_upi' | 'cash' | 'online'; workerUpiId?: string | null; existingPayment?: { _id: string; status: string; method: string } | null; alreadyCollected?: boolean; directPaymentPending?: boolean; directPaymentStatus?: string | null; payoutStatus?: string | null; checkoutPending?: boolean; checkoutUrl?: string };

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
    const selected = applications.find(a => a._id === applicationId);
    if (isWorker || !applicationId || !selected) { setQuote(null); return; }
    let active = true;
    setQuoteLoading(true);
    const quoteRequest = selected.paymentMode === 'direct_upi' || selected.paymentMode === 'cash'
      ? apiGetPaymentQuote(applicationId)
      : apiGetPhonePePaymentQuote(applicationId);
    quoteRequest
      .then(data => { if (active) setQuote({ ...data.quote, paymentMode: selected.paymentMode === 'direct_upi' || selected.paymentMode === 'cash' ? selected.paymentMode : 'online' }); })
      .catch((e: any) => { if (active) { setQuote(null); setError(e.message || 'Could not calculate the job payment.'); } })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [applicationId, isWorker, applications]);

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
        if (state === 'paid') {
          setMessage('Payment collection verified by PhonePe. Worker payout is separate and will show as complete only after approved settlement confirmation.');
        } else if (state === 'failed') {
          setError('PhonePe reports that this payment failed. Check your PhonePe and bank transaction history before trying again. If money was debited, do not retry; raise a complaint with PhonePe and contact KaamSetu support.');
        } else {
          setMessage('Payment is not confirmed yet. Do not pay again while this order is pending; KaamSetu will keep checking its status.');
        }
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
  const isManualPayment = selectedApplication?.paymentMode === 'direct_upi' || selectedApplication?.paymentMode === 'cash';
  const directUpiLink = quote?.workerUpiId
    ? `upi://pay?${new URLSearchParams({
        pa: quote.workerUpiId,
        pn: quote.workerName || 'KaamSetu Worker',
        am: Number(legacyPayments.find(p => p.applicationId === applicationId && ['approved_by_worker', 'approved_by_employer'].includes(p.status))?.amount || quote.amount).toFixed(2),
        cu: 'INR',
        tn: `KaamSetu ${quote.jobTitle}`
      }).toString()}`
    : '';

  const reportManualPayment = async () => {
    const method = selectedApplication?.paymentMode;
    if (!applicationId || (method !== 'direct_upi' && method !== 'cash') || !quote) return;
    const raw = window.prompt('Enter the amount you are proposing to the worker (₹):', String(quote.amount));
    if (raw === null) return;
    const amount = Number(raw.trim());
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) {
      setError('Enter a valid amount between ₹1 and ₹10,00,000.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await apiCreatePayment({ applicationId, method, amount });
      setMessage(result.message);
      await refresh();
      await loadApplications();
      setQuote(current => current ? { ...current, existingPayment: { _id: result.payment?._id, status: result.payment?.status || 'requested_by_worker', method } } : current);
    } catch (e: any) {
      setError(e.message || 'Could not send the payment request.');
    } finally {
      setBusy(false);
    }
  };

  const respondToRequest = async (payment: LegacyPayment, action: 'accept' | 'reject' | 'counter') => {
    let amount: number | undefined;
    if (action === 'counter') {
      const raw = window.prompt('Enter the amount you are requesting (₹):', String(payment.amount));
      if (raw === null) return;
      amount = Number(raw.trim());
      if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) { setError('Enter a valid amount between ₹1 and ₹10,00,000.'); return; }
    }
    if (action === 'reject' && !window.confirm('Decline this payment amount request?')) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiRespondToPaymentRequest(payment._id, { action, amount }); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not respond to the payment request.'); }
    finally { setBusy(false); }
  };

  const approveCounter = async (payment: LegacyPayment) => {
    if (!window.confirm(`Approve the worker's revised amount of ${money(payment.amount)}?`)) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiApprovePaymentCounter(payment._id); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not approve the revised amount.'); }
    finally { setBusy(false); }
  };

  const reportTransfer = async (payment: LegacyPayment) => {
    const reference = window.prompt('Enter the UPI transaction reference from your UPI app:');
    if (!reference) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiReportDirectPayment(payment._id, reference.trim()); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not report the UPI transfer.'); }
    finally { setBusy(false); }
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
      // Re-read the server quote: an ambiguous PhonePe response may have created
      // an order that must stay locked rather than allowing the user to pay twice.
      try {
        const latest = await apiGetPhonePePaymentQuote(applicationId);
        setQuote(latest.quote);
      } catch {
        // Keep the provider error visible; never assume the checkout was not created.
      }
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
    <DashboardLayout title={isWorker ? 'My Earnings' : 'Payments'} subtitle={isWorker ? 'Track direct payments, cash reports and gateway collections' : 'Choose direct UPI, cash or approved PhonePe checkout'}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-brand-border p-4">
            <div className="text-xs text-brand-muted">Confirmed payment records</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{money(paidTotal)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-brand-border p-4">
            <div className="text-xs text-brand-muted">Pending / awaiting confirmation</div>
            <div className="text-xl font-black text-amber-600 mt-1">{money(pendingTotal)}</div>
          </div>
        </div>

        {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-sm">{message}</div>}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</div>}

        {!isWorker && (
          <section className="bg-white rounded-2xl border border-brand-border p-5 space-y-4">
            <div>
              <h2 className="font-bold text-brand-dark">Pay for completed work</h2>
              <p className="text-xs text-brand-muted mt-1">KaamSetu calculates the agreed amount on the server and sends you to PhonePe’s hosted checkout. The payment is collected into KaamSetu’s approved merchant account; worker payout is tracked separately and is not marked paid until it is independently confirmed.</p>
            </div>
            <label className="block text-xs font-semibold text-brand-muted">Job awaiting payment
              <select value={applicationId} onChange={e => setApplicationId(e.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark">
                <option value="">Select a job awaiting payment</option>
                {applications.map(a => <option key={a._id} value={a._id}>{a.workerProfile?.fullName || 'Worker'} — {a.job?.title || 'Completed job'} ({a.paymentMode === 'direct_upi' ? 'Direct UPI' : a.paymentMode === 'cash' ? 'Cash' : 'PhonePe'})</option>)}
              </select>
            </label>
            {quoteLoading && <div className="text-sm text-brand-muted">Calculating agreed payment…</div>}
            {quote && (
              <div className="rounded-xl bg-slate-50 border border-brand-border p-4 space-y-2">
                <div className="text-xs text-brand-muted">Amount due for {quote.jobTitle}</div>
                <div className="text-3xl font-black text-brand-dark">{money(quote.amount)}</div>
                <div className="text-xs text-brand-muted">Worker: {quote.workerName}{quote.wageType ? ` · Based on ${quote.wageType} wage · ${quote.duration || ''}` : ''}</div>
                {quote.paymentMode === 'direct_upi' && quote.workerUpiId && (!quote.existingPayment || ['approved_by_worker', 'approved_by_employer'].includes(quote.existingPayment.status)) && (
                  <div className="mt-3 rounded-xl bg-white border border-brand-border p-3 space-y-2">
                    <div className="text-xs font-semibold text-brand-dark">Worker's UPI ID</div>
                    <div className="font-mono text-sm break-all">{quote.workerUpiId}</div>
                    <a href={directUpiLink} className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-bold">Pay with any UPI app</a>
                  </div>
                )}
                {isManualPayment && <p className="text-[11px] text-amber-800">First the worker must approve the proposed amount. After agreement, the employer transfers via UPI and records the UPI reference. The worker confirms only after checking their account; this is not bank verification.</p>}
                {quote.existingPayment && <div className="text-xs font-semibold text-amber-800">Payment already reported · {quote.existingPayment.status.replace(/_/g, ' ')}. Do not report or pay again.</div>}
                {quote.alreadyCollected && <div className="text-xs font-semibold text-amber-700 mt-2">Payment already collected by KaamSetu. Do not pay again. Worker payout is pending approved settlement.</div>}
                {quote.checkoutPending && <div className="text-xs font-semibold text-blue-700 mt-2">A checkout is already open for this job. Continue it below to avoid creating a duplicate payment.</div>}
                {quote.directPaymentPending && <div className="text-xs font-semibold text-amber-700 mt-2">A direct UPI payment has already been recorded. Wait for the worker to confirm receipt; do not pay again.</div>}
              </div>
            )}
            {!isManualPayment && !available && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0"/>
                <span>Secure checkout is not enabled yet. The authorised KaamSetu business administrator must finish PhonePe merchant onboarding and configure the approved credentials on the backend.</span>
              </div>
            )}
            {!isManualPayment && available && !webhookConfigured && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">PhonePe server notifications are not configured yet. Payment status can still be checked when the payer returns to KaamSetu, but automatic updates while the page is closed require the merchant webhook to be configured by the authorised business administrator.</div>}
            {!isManualPayment && environment !== 'production' && available && <div className="text-xs text-amber-700">Sandbox mode: test transactions only. No real money will be transferred.</div>}
            {!isManualPayment && (
              <button type="button" onClick={startCheckout} disabled={busy || !applicationId || !quote || quote.alreadyCollected || quote.directPaymentPending || !available || quoteLoading || (quote.checkoutPending && !quote.checkoutUrl)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 text-sm font-bold disabled:opacity-50">
                <Wallet className="w-4 h-4"/>{busy ? 'Opening secure checkout…' : `${quote?.checkoutPending ? 'Resume PhonePe checkout' : 'Continue to secure checkout ' + (quote ? money(quote.amount) : '')}`}
              </button>
            )}
            {isManualPayment && (
              <button type="button" onClick={reportManualPayment} disabled={busy || !applicationId || !quote || Boolean(quote.existingPayment && !['rejected', 'cancelled'].includes(quote.existingPayment.status)) || quoteLoading || (selectedApplication?.paymentMode === 'direct_upi' && !quote.workerUpiId)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 text-sm font-bold disabled:opacity-50">
                <Wallet className="w-4 h-4"/>{busy ? 'Sending request…' : `Send ${quote ? money(quote.amount) : 'payment amount'} for worker approval`}
              </button>
            )}
            {quote?.checkoutPending && !quote.checkoutUrl && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                PhonePe has not returned a checkout link for this order yet. KaamSetu is keeping the order pending so a second charge cannot be started accidentally. Do not make another payment. Refresh the page or contact KaamSetu support if this message remains.
              </div>
            )}
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
          <div className="p-5 border-b border-brand-border"><h2 className="font-bold text-brand-dark">Direct UPI & cash payment records</h2><p className="text-xs text-brand-muted mt-1">These are party-reported records, not independent bank verification.</p></div>
          {legacyPayments.length === 0 ? <div className="p-8 text-center text-sm text-brand-muted">No direct UPI or cash payment records.</div> : <div className="divide-y divide-brand-border">
            {legacyPayments.map(payment => <div key={payment._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-brand-primary-light text-brand-primary flex items-center justify-center"><Banknote className="w-4 h-4"/></div><div><div className="font-bold text-sm text-brand-dark">{payment.jobTitle}</div><div className="text-xs text-brand-muted mt-1">{isWorker ? payment.employerName : payment.workerName} · {payment.method === 'cash' ? 'Cash' : 'Previous direct UPI'}</div>{payment.transactionReference && <div className="text-[11px] text-brand-muted mt-1">Reference: {payment.transactionReference}</div>}<div className="text-[11px] text-brand-muted mt-1">{new Date(payment.createdAt).toLocaleString('en-IN')}</div></div></div>
              <div className="flex flex-wrap items-center gap-3"><strong>{money(payment.amount)}</strong><span className="text-xs font-bold">{payment.status === 'paid' ? (payment.verificationLevel === 'party_confirmed' ? 'Worker confirmed · not bank-verified' : payment.method === 'direct_upi' ? 'Worker-confirmed (legacy)' : 'Confirmed') : payment.status === 'disputed' ? 'Disputed' : payment.status === 'requested_by_worker' ? 'Amount request · awaiting worker' : payment.status === 'countered_by_worker' ? 'Worker suggested amount · awaiting employer' : ['approved_by_worker', 'approved_by_employer'].includes(payment.status) ? 'Amount agreed · awaiting UPI transfer' : 'Employer reported · awaiting worker'}</span>
                {isWorker && payment.status === 'requested_by_worker' && <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => respondToRequest(payment, 'accept')} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold">Accept amount</button><button disabled={busy} onClick={() => respondToRequest(payment, 'counter')} className="rounded-lg border border-brand-primary text-brand-primary px-3 py-2 text-xs font-bold">Suggest amount</button><button disabled={busy} onClick={() => respondToRequest(payment, 'reject')} className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Reject</button></div>}
                {!isWorker && payment.status === 'countered_by_worker' && <button disabled={busy} onClick={() => approveCounter(payment)} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold">Approve revised amount</button>}
                {!isWorker && ['approved_by_worker', 'approved_by_employer'].includes(payment.status) && payment.method === 'direct_upi' && <button disabled={busy} onClick={() => reportTransfer(payment)} className="rounded-lg bg-brand-primary text-white px-3 py-2 text-xs font-bold">I've paid · add UPI reference</button>}
                {isWorker && payment.status === 'awaiting_worker_confirmation' && <button disabled={busy} onClick={() => confirmLegacyPayment(payment)} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1"/>Confirm received</button>}
                {payment.status === 'awaiting_worker_confirmation' && <button disabled={busy} onClick={() => disputeLegacyPayment(payment._id)} className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Dispute</button>}
              </div>
            </div>)}
          </div>}
        </section>

        <div className="text-xs text-brand-muted flex items-center gap-2"><Clock3 className="w-4 h-4"/> PhonePe payments require server-side provider verification. Direct UPI and cash records require worker confirmation and are not independently bank-verified.</div>
        <div className="text-[11px] text-brand-muted flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5"/> Gateway collection and worker payouts depend on the approved PhonePe merchant and settlement configuration.</div>
      </div>
    </DashboardLayout>
  );
};
