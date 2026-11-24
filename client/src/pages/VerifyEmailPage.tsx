import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
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

    // Check for Firebase Action Code params (oobCode or mode)
    const oobCode = params.get('oobCode') || params.get('code') || '';
    const mode = params.get('mode') || '';
    const legacyToken = params.get('token') || '';

    let active = true;

    const handleVerification = async () => {
      // 1. Firebase Action Code Verification
      if (oobCode) {
        try {
          // Verify code and apply verification directly with Firebase
          await applyActionCode(firebaseAuth, oobCode);
          if (!active) return;
          setStatus('success');
          setMessage('Your email address has been verified successfully via Firebase! You can now sign in using your email and password.');
          return;
        } catch (firebaseErr: any) {
          if (!active) return;
          console.warn('[Firebase] Action code error:', firebaseErr.code, firebaseErr.message);
          let userMsg = 'This verification link is invalid, expired, or has already been used.';
          if (firebaseErr.code === 'auth/invalid-action-code') {
            userMsg = 'This verification link is invalid or has already been used. Please log in or request a new verification email.';
          } else if (firebaseErr.code === 'auth/expired-action-code') {
            userMsg = 'This verification link has expired. Please sign in to request a fresh verification link.';
          } else if (firebaseErr.code === 'auth/user-disabled') {
            userMsg = 'This account has been disabled.';
          }
          setStatus('error');
          setMessage(userMsg);
          return;
        }
      }

      // 2. Legacy backend token verification
      if (legacyToken) {
        try {
          const result = await apiVerifyEmail(legacyToken);
          if (!active) return;
          setStatus('success');
          setMessage(result.message || 'Your email address has been verified. You can now sign in.');
        } catch (error: any) {
          if (!active) return;
          setStatus('error');
          setMessage(error.message || 'This verification link is invalid or expired.');
        }
        return;
      }

      // 3. Neither param provided
      if (!active) return;
      setStatus('error');
      setMessage('This verification link is incomplete or missing. Request a new link from the sign-in page.');
    };

    handleVerification();

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
