import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { apiVerifyEmail } from '../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address…');
  const requestStarted = useRef(false);

  useEffect(() => {
    if (requestStarted.current) return;
    requestStarted.current = true;
    const token = params.get('token') || '';
    if (!token) {
      setStatus('error');
      setMessage('The verification link is incomplete. Request a new verification email.');
      return;
    }
    apiVerifyEmail(token).then(result => {
      setStatus('success');
      setMessage(result.message);
    }).catch((error: any) => {
      setStatus('error');
      setMessage(error.message || 'This verification link is invalid or expired.');
    });
  }, [params]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-brand-border bg-white shadow-xl p-7 sm:p-9 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center">
            {status === 'loading' ? <Loader2 className="w-7 h-7 animate-spin" /> : status === 'success' ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <AlertCircle className="w-7 h-7 text-red-600" />}
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
