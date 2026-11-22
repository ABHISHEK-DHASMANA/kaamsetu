import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { apiCreatePayment, apiGetEmployerApplications, apiGetMyPayments, apiGetWorkerApplications, apiConfirmPaymentReceived, apiDisputePayment, apiGetWorkerProfile, apiUpdateWorkerProfile } from '../../services/api';
import { Banknote, CheckCircle2, Clock3, IndianRupee, QrCode, ShieldAlert, Smartphone, Wallet } from 'lucide-react';

type Payment = {
  _id: string; amount: number; method: 'cash' | 'direct_upi' | 'online';
  status: string; jobTitle: string; workerName: string; employerName: string;
  transactionReference?: string; createdAt: string; note?: string;
};
type ApplicationOption = { _id: string; status: string; workerProfile?: { fullName?: string; upiId?: string }; job?: { title?: string; offeredWage?: number } };

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const isWorker = user?.role === 'worker';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [summary, setSummary] = useState({ paidTotal: 0, directUpiTotal: 0, cashTotal: 0, pendingTotal: 0, paidCount: 0 });
  const [applicationId, setApplicationId] = useState('');
  const [amount, setAmount] = useState('');
  const method: 'direct_upi' = 'direct_upi';
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [workerUpiId, setWorkerUpiId] = useState('');
  const [upiSaving, setUpiSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    const data = await apiGetMyPayments();
    setPayments(data.payments || []);
    setSummary(data.summary || { paidTotal: 0, directUpiTotal: 0, cashTotal: 0, pendingTotal: 0, paidCount: 0 });
  };

  useEffect(() => {
    let active = true;
    const loadApplications = () => {
      if (!isWorker) {
        apiGetEmployerApplications().then(data => {
          if (active) setApplications((data.applications || []).filter((a: ApplicationOption) => a.status === 'PaymentPending'));
        }).catch(e => { if (active) setError(e.message || 'Unable to load completed jobs.'); });
      } else {
        apiGetWorkerApplications().then(data => {
          if (active) setApplications((data.applications || []).filter((a: any) => a.status === 'PaymentPending'));
        }).catch(() => undefined);
      }
    };
    const load = () => {
      refresh().catch(e => { if (active) setError(e.message || 'Unable to load payments.'); });
      loadApplications();
    };
    load();
    if (isWorker) {
      apiGetWorkerProfile().then(data => {
        if (active) setWorkerUpiId((data.workerProfile as any)?.upiId || '');
      }).catch(() => undefined);
    }
    // Keep both sides in sync: employer sees worker confirmation and worker sees new payment requests.
    const interval = window.setInterval(load, 12000);
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [isWorker]);

  const pending = useMemo(() => payments.filter(p => p.status === 'awaiting_worker_confirmation'), [payments]);
  const selectedApplication = applications.find(a => a._id === applicationId);
  const selectedWorkerUpiId = selectedApplication?.workerProfile?.upiId;
  const upiQrValue = selectedWorkerUpiId && amount && Number(amount) > 0 ? 'upi://pay?pa=' + encodeURIComponent(selectedWorkerUpiId) + '&pn=' + encodeURIComponent(selectedApplication?.workerProfile?.fullName || 'KaamSetu Worker') + '&am=' + encodeURIComponent(amount) + '&cu=INR&tn=KaamSetu%20job%20payment' : '';
  const upiAppParams = selectedWorkerUpiId && amount && Number(amount) > 0 ? new URLSearchParams({ pa: selectedWorkerUpiId, pn: selectedApplication?.workerProfile?.fullName || 'KaamSetu Worker', am: amount, cu: 'INR', tn: 'KaamSetu job payment' }).toString() : '';
  const phonePeLink = upiAppParams ? 'phonepe://pay?' + upiAppParams : '';
  const googlePayLink = upiAppParams ? 'tez://upi/pay?' + upiAppParams : '';

  const saveWorkerUpi = async (event: React.FormEvent) => {
    event.preventDefault(); setUpiSaving(true); setError(''); setMessage('');
    if (!/^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(workerUpiId.trim())) {
      setError('Enter a valid UPI ID, for example name@bank.'); setUpiSaving(false); return;
    }
    try { await apiUpdateWorkerProfile({ upiId: workerUpiId.trim() } as any); setMessage('Your UPI ID has been saved. Employers can see it only for accepted/completed work.'); }
    catch (e: any) { setError(e.message || 'Could not save UPI ID.'); }
    finally { setUpiSaving(false); }
  };

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    if (reference.trim().length < 6) {
      setError('Enter the UPI transaction reference/UTR from your payment app.'); setBusy(false); return;
    }
    try {
      const result = await apiCreatePayment({ applicationId, amount: Number(amount), method, transactionReference: reference, note });
      setMessage(result.message); setApplicationId(''); setAmount(''); setReference(''); setNote('');
      await refresh();
      apiGetEmployerApplications().then(data => setApplications((data.applications || []).filter((a: ApplicationOption) => a.status === 'PaymentPending'))).catch(() => undefined);
    } catch (e: any) { setError(e.message || 'Could not record payment.'); }
    finally { setBusy(false); }
  };

  const confirm = async (payment: Payment) => {
    const check = payment.method === 'direct_upi'
      ? `Confirm that ₹${payment.amount} for ${payment.jobTitle} is visible as received in your UPI app, and that the transaction details match.`
      : `Confirm that you physically received ₹${payment.amount} in cash for ${payment.jobTitle}.`;
    if (!window.confirm(`${check}\\n\\nOnly confirm after checking. Continue?`)) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiConfirmPaymentReceived(payment._id); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not confirm payment.'); }
    finally { setBusy(false); }
  };

  const dispute = async (id: string) => {
    const reason = window.prompt('Briefly explain why this payment is incorrect or not received:');
    if (!reason) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiDisputePayment(id, reason); setMessage(result.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Could not dispute payment.'); }
    finally { setBusy(false); }
  };

  return (
    <DashboardLayout title={isWorker ? 'My Earnings' : 'Online payments'} subtitle={isWorker ? 'Confirm online payment received from employers' : 'Complete online payments for finished work'}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-brand-border p-4"><div className="text-xs text-brand-muted">Confirmed {isWorker ? 'earnings' : 'payments'}</div><div className="text-xl font-black text-emerald-600 mt-1">{money(summary.paidTotal)}</div></div>
          <div className="bg-white rounded-2xl border border-brand-border p-4"><div className="text-xs text-brand-muted">Pending</div><div className="text-xl font-black text-amber-600 mt-1">{money(summary.pendingTotal)}</div></div>
          <div className="bg-white rounded-2xl border border-brand-border p-4"><div className="text-xs text-brand-muted">Direct UPI</div><div className="text-xl font-black text-brand-dark mt-1">{money(summary.directUpiTotal)}</div></div>
          <div className="bg-white rounded-2xl border border-brand-border p-4"><div className="text-xs text-brand-muted">Cash</div><div className="text-xl font-black text-brand-dark mt-1">{money(summary.cashTotal)}</div></div>
        </div>

        {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-sm">{message}</div>}
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">{error}</div>}

        {isWorker && <form onSubmit={saveWorkerUpi} className="bg-white rounded-2xl border border-brand-border p-5 space-y-3"><div><h2 className="font-bold text-brand-dark">Your UPI payment QR</h2><p className="text-xs text-brand-muted mt-1">Add your own UPI ID to let an employer scan and pay you directly after an accepted job is completed.</p></div><div className="flex flex-col sm:flex-row gap-2"><input value={workerUpiId} onChange={e => setWorkerUpiId(e.target.value)} maxLength={100} placeholder="yourname@bank" className="flex-1 rounded-xl border border-brand-border p-3 text-sm"/><button disabled={upiSaving} className="rounded-xl bg-brand-primary text-white px-4 py-3 text-sm font-bold disabled:opacity-50">{upiSaving ? 'Saving...' : 'Save UPI ID'}</button></div>{workerUpiId && <div className="inline-flex flex-col items-center gap-2 rounded-xl border border-brand-border p-4"><QRCodeSVG value={'upi://pay?pa=' + encodeURIComponent(workerUpiId) + '&pn=' + encodeURIComponent(user?.name || 'KaamSetu Worker') + '&cu=INR'} size={176} level="M"/><span className="text-xs font-semibold text-brand-dark">{workerUpiId}</span><span className="text-[11px] text-brand-muted">Share this QR with the employer in person</span></div>}</form>}

        {!isWorker && (
          <form onSubmit={submitPayment} className="bg-white rounded-2xl border border-brand-border p-5 space-y-4">
            <div><h2 className="font-bold text-brand-dark">Complete online payment</h2><p className="text-xs text-brand-muted mt-1">Select a job waiting for online payment, complete the transfer in your UPI app, and enter its transaction reference. The worker confirms receipt before the job is marked completed.</p></div>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-brand-muted">Completed job / worker
                <select required value={applicationId} onChange={e => setApplicationId(e.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark">
                  <option value="">Select completed job</option>
                  {applications.map(a => <option key={a._id} value={a._id}>{a.workerProfile?.fullName || 'Worker'} — {a.job?.title || 'Completed job'}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-brand-muted">Total amount (₹)
                <input required type="number" min="1" max="1000000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 800" className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark" />
              </label>
            </div>
            {method === "direct_upi" && selectedWorkerUpiId && upiQrValue && <div className="rounded-xl border border-brand-border p-4 flex flex-col sm:flex-row items-center gap-4"><QRCodeSVG value={upiQrValue} size={160} level="M"/><div className="text-xs text-brand-muted"><strong className="block text-brand-dark text-sm mb-1">Scan to pay worker directly</strong>{selectedWorkerUpiId}<p className="mt-1">Amount: {money(Number(amount))}. Scan using a supported UPI app and verify the payee name and amount before paying.</p><div className="mt-3 flex flex-wrap gap-2"><a href={phonePeLink} className="inline-flex rounded-lg bg-purple-700 text-white px-3 py-2 font-bold">Open PhonePe</a><a href={googlePayLink} className="inline-flex rounded-lg bg-blue-700 text-white px-3 py-2 font-bold">Open Google Pay</a><a href={upiQrValue} className="inline-flex rounded-lg border border-brand-border text-brand-dark px-3 py-2 font-bold">Other UPI apps</a></div><p className="mt-2 text-[10px] text-brand-muted">Open a supported UPI app if installed. Check the payee name and amount before authorizing payment.</p></div></div>}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="text-xs font-semibold text-brand-muted">Payment method
                <div className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark bg-slate-50">Online UPI (PhonePe / Google Pay / other UPI apps)</div>
              </div>
              <label className="text-xs font-semibold text-brand-muted">UPI transaction reference / UTR (required)
                <input required value={reference} onChange={e => setReference(e.target.value)} minLength={6} maxLength={100} placeholder="Enter reference shown in PhonePe / GPay" className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark" />
              </label>}
            </div>
            <label className="block text-xs font-semibold text-brand-muted">Note (optional)
              <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="Payment details" className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm text-brand-dark" />
            </label>
            <button disabled={busy || !applicationId || !amount || !selectedWorkerUpiId} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 text-sm font-bold disabled:opacity-50"><Wallet className="w-4 h-4" />{busy ? 'Please wait...' : 'I have completed online payment'}</button>
          </form>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0" />
          <div className="text-xs text-blue-900"><strong>Online payment safety:</strong> UPI goes directly from the employer's UPI app to the worker's saved UPI ID. The employer records the transaction reference; the worker independently checks their own app before confirming. This is a two-party record, not automatic bank verification. KaamSetu does not collect or hold the money. Offline payment jobs skip this page and go straight to ratings.</div>
        </div>


        <section className="bg-white rounded-2xl border border-brand-border overflow-hidden">
          <div className="p-5 border-b border-brand-border"><h2 className="font-bold text-brand-dark">{isWorker ? 'Payment history' : 'Payments to workers'}</h2><p className="text-xs text-brand-muted mt-1">{payments.length} record(s)</p></div>
          {payments.length === 0 ? <div className="p-10 text-center text-sm text-brand-muted">No payment records yet.</div> : <div className="divide-y divide-brand-border">
            {payments.map(payment => <div key={payment._id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-brand-primary-light text-brand-primary flex items-center justify-center">{payment.method === 'cash' ? <Banknote className="w-5 h-5" /> : payment.method === 'online' ? <Smartphone className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}</div><div><div className="font-bold text-sm text-brand-dark">{payment.jobTitle}</div><div className="text-xs text-brand-muted mt-1">{isWorker ? payment.employerName : payment.workerName} · Online UPI</div>{payment.transactionReference && <div className="text-[11px] text-brand-muted mt-1">Ref: {payment.transactionReference}</div>}<div className="text-[11px] text-brand-muted mt-1">{new Date(payment.createdAt).toLocaleString('en-IN')}</div></div></div>
              <div className="flex flex-wrap items-center gap-3"><div className="font-black text-brand-dark">{money(payment.amount)}</div><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'disputed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{payment.status === 'paid' ? 'Paid · Confirmed' : payment.status === 'disputed' ? 'Disputed' : 'Awaiting worker confirmation'}</span>
                {isWorker && payment.status === 'awaiting_worker_confirmation' && <button disabled={busy} onClick={() => confirm(payment)} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Confirm received</button>}
                {payment.status === 'awaiting_worker_confirmation' && <button disabled={busy} onClick={() => dispute(payment._id)} className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-xs font-bold disabled:opacity-50">Dispute</button>}
              </div>
            </div>)}
          </div>}
        </section>
        {isWorker && <div className="text-xs text-brand-muted flex items-center gap-2"><Clock3 className="w-4 h-4" /> {pending.length} payment(s) waiting for your confirmation. Confirm only after checking that you received the money.</div>}
        <div className="text-[11px] text-brand-muted flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" /> KaamSetu records payments between employers and workers; it does not hold funds or deduct a platform commission.</div>
      </div>
    </DashboardLayout>
  );
};
