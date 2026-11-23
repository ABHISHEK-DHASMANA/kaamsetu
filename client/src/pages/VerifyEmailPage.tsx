import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { apiVerifyEmail } from '../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const started = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address…');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get('token') || '';
    if (!token) {
      setStatus('error');
      setMessage('This verification link is incomplete. Request a new link from the sign-in page.');
      return;
    }
    let active = true;
    apiVerifyEmail(token).then(result => {
      if (!active) return;
      setStatus('success');
      setMessage(result.message);
    }).catch((error: any) => {
      if (!active) return;
      setStatus('error');
      setMessage(error.message || 'This verification link is invalid or expired.');
    });
    return () => { active = false; };
  }, [params]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-brand-border bg-white shadow-xl p-7 sm:p-9 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-primary-light flex items-center justify-center">
            {status === 'loading' ? <Loader2 className="w-7 h-7 animate-spin text-brand-primary" /> : status === 'success' ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <AlertCircle className="w-7 h-7 text-red-600" />}
          </div>
          <h1 className="text-xl font-black text-brand-dark">{status === 'loading' ? 'Verifying email' : status === 'success' ? 'Email verified' : 'Verification failed'}</h1>
          <p className="text-sm text-brand-muted">{message}</p>
          {status !== 'loading' && <Link to="/login" className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold"><Mail className="w-4 h-4" />Continue to sign in</Link>}
        </div>
      </main>
      <Footer />
    </div>
  );
};
