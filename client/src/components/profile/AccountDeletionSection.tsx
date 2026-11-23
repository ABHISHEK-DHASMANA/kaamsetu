import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';
import { apiDeleteAccount } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AccountDeletionSection: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (confirmation !== 'DELETE') {
      setError('Type DELETE exactly to confirm this action.');
      return;
    }
    if (!password) {
      setError('Enter your current password to verify your identity.');
      return;
    }
    setBusy(true);
    try {
      await apiDeleteAccount(password);
      logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Account deletion could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-2xl mt-6 rounded-3xl border border-red-200 bg-white p-6 sm:p-8 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5" /></div>
        <div>
          <h2 className="text-base font-black text-slate-900">Delete Account</h2>
          <p className="mt-1 text-xs text-slate-600">Permanently remove your KaamSetu account and personal profile information.</p>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Your profile, saved jobs, notifications and messages you sent will be removed. Job, application, review and payment history is retained for records and reconciliation. Employer open jobs will be closed.</p>
      </div>
      <form onSubmit={handleDelete} className="space-y-3">
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">Current password (identity verification)</label>
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required />
        </div>
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">Type DELETE to confirm</label>
          <input type="text" autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="DELETE" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required />
        </div>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <button type="submit" disabled={busy || confirmation !== 'DELETE' || !password} className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 disabled:opacity-50 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />{busy ? 'Deleting account…' : 'Permanently delete my account'}
        </button>
      </form>
    </section>
  );
};
