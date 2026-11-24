import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { apiResendVerification } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LogIn, User, Briefcase, ShieldCheck, Phone, Mail, Lock, AlertCircle, Sparkles, CheckCircle2, Chrome } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, loginWithFirebase, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [notice, setNotice] = useState<string | null>(() => {
    const registered = searchParams.get('registered');
    if (registered === 'email') return 'Your account was created. Check your inbox and verify the link before signing in with email and password.';
    if (registered === 'phone') return 'Your account was created. Sign in using your verified email and password.';
    return null;
  });
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'worker' | 'employer' | 'admin'>('worker');
  const navigate = useNavigate();

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const destination = (role?: string) => {
    const actualRole = role || activeTab;
    navigate(actualRole === 'worker' ? '/worker/dashboard' : actualRole === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
  };
  const handleGoogle = async () => {
    setErrorMsg(null); setNotice(null); setBusy(true); setUnverifiedEmail(null);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      await loginWithFirebase(result.user);
      destination();
    } catch (err: any) {
      setErrorMsg(err.code === 'auth/unauthorized-domain'
        ? `Firebase is blocking this website (${window.location.hostname}). Add this exact hostname in Firebase Console → Authentication → Settings → Authorized domains, then reload the site.`
        : err.code === 'auth/popup-closed-by-user' ? 'Google sign-in was cancelled.' : err.message || 'Google sign-in failed.');
    } finally { setBusy(false); }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || identifier.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setResendMessage('Please enter your email address first.');
      return;
    }
    setResendBusy(true);
    setResendMessage(null);
    try {
      // 1. First attempt to resend via Firebase if user is currently loaded or can be signed in temporarily
      let sentViaFirebase = false;
      try {
        if (firebaseAuth.currentUser && firebaseAuth.currentUser.email === targetEmail) {
          await sendEmailVerification(firebaseAuth.currentUser);
          sentViaFirebase = true;
        } else if (password) {
          const userCred = await signInWithEmailAndPassword(firebaseAuth, targetEmail, password);
          await sendEmailVerification(userCred.user);
          await signOut(firebaseAuth);
          sentViaFirebase = true;
        }
      } catch (fbErr: any) {
        console.warn('[Firebase] Direct resend attempt:', fbErr.message);
      }

      if (sentViaFirebase) {
        setResendMessage('A new Firebase verification email has been sent to ' + targetEmail + '. Please check your inbox.');
      } else {
        // Fallback to backend resend endpoint
        const result = await apiResendVerification(targetEmail);
        setResendMessage(result.message || 'Verification link sent to ' + targetEmail);
      }
    } catch (err: any) {
      setResendMessage(err.message || 'Could not send a verification email.');
    } finally {
      setResendBusy(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);
    setResendMessage(null);
    setUnverifiedEmail(null);

    const emailInput = identifier.trim().toLowerCase();
    if (!emailInput.includes('@')) {
      setErrorMsg('Sign in using your registered email address and password. Phone numbers are contact details until verified.');
      return;
    }

    try {
      // 1. Try Firebase Authentication with email & password
      let fbUser: any = null;
      let firebaseAvailable = true;

      try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, emailInput, password);
        fbUser = userCredential.user;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          setErrorMsg('Invalid email or password.');
          return;
        } else if (fbErr.code === 'auth/user-not-found') {
          // Check backend directly in case user exists in database but not Firebase
          firebaseAvailable = false;
        } else if (fbErr.code === 'auth/too-many-requests') {
          setErrorMsg('Access to this account has been temporarily disabled due to many failed login attempts. Try again later or reset password.');
          return;
        } else {
          // If network error or config issue, fall back to backend login
          firebaseAvailable = false;
        }
      }

      // 2. If Firebase user found, check email verification status
      if (fbUser) {
        // Force refresh user token to get latest emailVerified status
        await fbUser.reload();
        if (!fbUser.emailVerified) {
          setUnverifiedEmail(emailInput);
          await signOut(firebaseAuth);
          setErrorMsg('Your email address has not been verified yet. Please check your inbox for the verification email.');
          return;
        }

        // Firebase email is verified! Now authenticate with backend via ID token
        await loginWithFirebase(fbUser);
        destination();
        return;
      }

      // 3. Fallback to standard backend login
      await login(emailInput, password);
      destination();
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      if (msg.toLowerCase().includes('not been verified') || msg.toLowerCase().includes('not verified')) {
        setUnverifiedEmail(emailInput);
      }
      setErrorMsg(msg);
    }
  };
  const handleQuickDemoClick = async (type: 'worker' | 'employer') => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await quickLogin(type);
      destination(type);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border shadow-xl p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-brand-accent font-black text-2xl mx-auto">K</div>
            <h1 className="text-2xl font-black text-brand-dark tracking-tight">Welcome Back</h1>
            <p className="text-xs text-brand-muted">Sign in securely to your KAAMSETU account</p>
          </div>

          {import.meta.env.DEV && (
          <div className="p-4 rounded-2xl bg-brand-accent-light/50 border border-brand-accent/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark"><Sparkles className="w-4 h-4 text-brand-accent" />One-Click Evaluation Logins</div>
            <div className="grid grid-cols-3 gap-2">
              {(['worker','employer'] as const).map(type => (
                <button key={type} type="button" onClick={() => handleQuickDemoClick(type)} disabled={busy || isLoading} className="py-2 px-1 rounded-xl bg-white border border-brand-border text-brand-dark text-[11px] font-bold flex flex-col items-center disabled:opacity-50">
                  {type === 'worker' ? <User className="w-4 h-4" /> : type === 'employer' ? <Briefcase className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {type === 'worker' ? 'Worker Demo' : 'Employer Demo'}
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {(['worker','employer','admin'] as const).map(role => <button key={role} type="button" onClick={() => setActiveTab(role)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${activeTab === role ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted'}`}>{role}</button>)}
          </div>

          {errorMsg && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}</div>}
          {notice && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{notice}</div>}

          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 space-y-1">
            <div className="text-xs font-bold text-blue-900">Phone verification temporarily unavailable</div>
            <p className="text-xs leading-relaxed text-blue-800">You can sign in with Google or your verified email and password. Mobile numbers are used as contact details and are not treated as verified without an OTP.</p>
          </section>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy || isLoading}
            className="w-full py-3 px-4 rounded-xl border border-brand-border bg-white hover:bg-slate-50 text-brand-dark text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-brand-primary" />
            Continue with Google
          </button>

          <div className="relative flex items-center"><div className="flex-1 border-t border-brand-border" /><span className="px-3 text-[10px] text-brand-muted">OR USE PASSWORD</span><div className="flex-1 border-t border-brand-border" /></div>
          {(unverifiedEmail || (errorMsg?.toLowerCase().includes('not been verified') && identifier.includes('@'))) && (
            <button type="button" onClick={handleResendVerification} disabled={resendBusy} className="w-full rounded-xl border border-brand-primary text-brand-primary py-2.5 text-xs font-bold disabled:opacity-50">
              {resendBusy ? 'Sending verification link…' : 'Resend email verification link'}
            </button>
          )}
          {resendMessage && <p role="status" className="text-xs text-brand-muted">{resendMessage}</p>}
          <form onSubmit={handleManualLogin} className="space-y-3">
            <div className="relative"><Mail className="w-4 h-4 text-brand-muted absolute left-3 top-3" /><input type="email" autoComplete="username" required placeholder="Verified email address" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark" /></div>
            <div className="relative"><Lock className="w-4 h-4 text-brand-muted absolute left-3 top-3" /><input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark" /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"><LogIn className="w-4 h-4" />Sign In with Password</button>
          </form>
          <div className="text-center text-xs text-brand-muted pt-2 border-t border-brand-border">Don't have an account? <Link to="/register" className="font-bold text-brand-primary hover:underline">Create Profile Free</Link></div>
          <p className="text-[10px] leading-relaxed text-center text-brand-muted">Sign in with your verified email and password, or continue with a previously linked Google account. Phone numbers are contact details until verified.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};
