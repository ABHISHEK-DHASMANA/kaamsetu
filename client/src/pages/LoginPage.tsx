import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, linkWithPhoneNumber, type ConfirmationResult, type User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../services/firebase';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LogIn, User, Briefcase, ShieldCheck, Phone, Mail, Lock, AlertCircle, Sparkles, CheckCircle2, Chrome } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, loginWithFirebase, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'worker' | 'employer' | 'admin'>('worker');
  const recaptcha = useRef<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();

  const destination = (role?: string) => {
    const actualRole = role || activeTab;
    navigate(actualRole === 'worker' ? '/worker/dashboard' : actualRole === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
  };
  const getVerifier = () => {
    if (!recaptcha.current) {
      recaptcha.current = new RecaptchaVerifier(firebaseAuth, 'firebase-recaptcha', { size: 'invisible' });
    }
    return recaptcha.current;
  };
  const normalizedPhone = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) throw new Error('Enter a valid 10-digit Indian mobile number.');
    return '+91' + digits;
  };
  const completeLogin = async (firebaseUser: FirebaseUser) => {
    await loginWithFirebase(firebaseUser);
    destination();
  };
  const sendPhoneOtp = async () => {
    setErrorMsg(null); setNotice(null); setBusy(true);
    try {
      const result = googleUser
        ? await linkWithPhoneNumber(googleUser, normalizedPhone(), getVerifier())
        : await signInWithPhoneNumber(firebaseAuth, normalizedPhone(), getVerifier());
      setConfirmation(result);
      setNotice('OTP sent. Enter the verification code received on your phone.');
    } catch (err: any) {
      setErrorMsg(err.code === 'auth/unauthorized-domain'
        ? `Firebase is blocking this website (${window.location.hostname}). Add this exact hostname in Firebase Console → Authentication → Settings → Authorized domains, then reload the site.`
        : err.code === 'auth/credential-already-in-use'
          ? 'This phone number is already linked to another Firebase account. Sign in using that phone number instead.'
          : err.code === 'auth/too-many-requests'
            ? 'Too many attempts. Please wait before requesting another OTP.'
            : err.message || 'Could not send OTP. Check the number and try again.');
      recaptcha.current?.clear(); recaptcha.current = null;
    } finally { setBusy(false); }
  };
  const verifyOtp = async () => {
    if (!confirmation || otp.trim().length < 6) { setErrorMsg('Enter the 6-digit OTP.'); return; }
    setErrorMsg(null); setBusy(true);
    try {
      const result = await confirmation.confirm(otp.trim());
      await completeLogin(result.user);
    } catch (err: any) {
      setErrorMsg(err.code === 'auth/invalid-verification-code' ? 'That OTP is incorrect. Please try again.' : err.message || 'OTP verification failed.');
    } finally { setBusy(false); }
  };
  const handleGoogle = async () => {
    setErrorMsg(null); setNotice(null); setBusy(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const current = result.user;
      await completeLogin(current);
    } catch (err: any) {
      setErrorMsg(err.code === 'auth/unauthorized-domain'
        ? `Firebase is blocking this website (${window.location.hostname}). Add this exact hostname in Firebase Console → Authentication → Settings → Authorized domains, then reload the site.`
        : err.code === 'auth/popup-closed-by-user' ? 'Google sign-in was cancelled.' : err.message || 'Google sign-in failed.');
    } finally { setBusy(false); }
  };
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(null);
    try { await login(identifier.trim(), password); destination(); }
    catch (err: any) { setErrorMsg(err.message || 'Login failed. Please verify credentials.'); }
  };
  const handleQuickDemoClick = async (type: 'worker' | 'employer' | 'admin') => {
    setErrorMsg(null);
    try { await quickLogin(type); destination(type); }
    catch (err: any) { setErrorMsg(err.message || 'Quick login failed.'); }
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

          <div className="p-4 rounded-2xl bg-brand-accent-light/50 border border-brand-accent/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark"><Sparkles className="w-4 h-4 text-brand-accent" />One-Click Evaluation Logins</div>
            <div className="grid grid-cols-3 gap-2">
              {(['worker','employer','admin'] as const).map(type => (
                <button key={type} type="button" onClick={() => handleQuickDemoClick(type)} className="py-2 px-1 rounded-xl bg-white border border-brand-border text-brand-dark text-[11px] font-bold flex flex-col items-center">
                  {type === 'worker' ? <User className="w-4 h-4" /> : type === 'employer' ? <Briefcase className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {type === 'worker' ? 'Worker Demo' : type === 'employer' ? 'Employer Demo' : 'Admin Demo'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {(['worker','employer','admin'] as const).map(role => <button key={role} type="button" onClick={() => setActiveTab(role)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${activeTab === role ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted'}`}>{role}</button>)}
          </div>

          {errorMsg && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}</div>}
          {notice && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{notice}</div>}

          <section className="space-y-3">
            <div className="text-xs font-bold text-brand-dark">Continue with Google</div>
            <button type="button" onClick={handleGoogle} disabled={busy || isLoading} className="w-full py-3 rounded-xl border border-brand-border bg-white hover:bg-slate-50 text-sm font-bold text-brand-dark flex items-center justify-center gap-2 disabled:opacity-60">
              <Chrome className="w-4 h-4" /> Continue with Google
            </button>
            {googleUser && !confirmation && (
              <div className="space-y-2">
                <p className="text-xs text-brand-muted">Signed in as {googleUser.email}. Verify your mobile number to link it to this account.</p>
                <div className="relative"><Phone className="w-4 h-4 text-brand-muted absolute left-3 top-3" /><input aria-label="Mobile number" inputMode="numeric" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full text-sm pl-10 pr-3 py-3 rounded-xl border border-brand-border" /></div>
                <button type="button" onClick={sendPhoneOtp} disabled={busy} className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-60">{busy ? 'Sending OTP…' : 'Send phone OTP'}</button>
              </div>
            )}
            {!googleUser && !confirmation && (
              <div className="space-y-2">
                <div className="relative"><Phone className="w-4 h-4 text-brand-muted absolute left-3 top-3" /><input aria-label="Mobile number" inputMode="numeric" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full text-sm pl-10 pr-3 py-3 rounded-xl border border-brand-border" /></div>
                <button type="button" onClick={sendPhoneOtp} disabled={busy || !phone.trim()} className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-60">{busy ? 'Sending OTP…' : 'Sign in with phone OTP'}</button>
              </div>
            )}
            {confirmation && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-dark">Enter 6-digit OTP</label>
                <input aria-label="One-time password" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full text-center tracking-[0.5em] text-lg py-3 rounded-xl border border-brand-border" />
                <button type="button" onClick={verifyOtp} disabled={busy || otp.length !== 6} className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-60">{busy ? 'Verifying…' : 'Verify OTP & Sign In'}</button>
                <button type="button" onClick={() => { setConfirmation(null); setOtp(''); setNotice(null); }} className="w-full text-xs text-brand-primary font-semibold">Use a different number</button>
              </div>
            )}
            <div id="firebase-recaptcha" />
          </section>

          <div className="relative flex items-center"><div className="flex-1 border-t border-brand-border" /><span className="px-3 text-[10px] text-brand-muted">OR USE PASSWORD</span><div className="flex-1 border-t border-brand-border" /></div>
          <form onSubmit={handleManualLogin} className="space-y-3">
            <div className="relative"><Mail className="w-4 h-4 text-brand-muted absolute left-3 top-3" /><input type="text" autoComplete="username" required placeholder="Registered mobile number or email" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark" /></div>
            <div className="relative"><Lock className="w-4 h-4 text-brand-muted absolute left-3 top-3" /><input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark" /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"><LogIn className="w-4 h-4" />Sign In with Password</button>
          </form>
          <div className="text-center text-xs text-brand-muted pt-2 border-t border-brand-border">Don't have an account? <Link to="/register" className="font-bold text-brand-primary hover:underline">Create Profile Free</Link></div>
          <p className="text-[10px] leading-relaxed text-center text-brand-muted">Sign in with your registered phone and password, email and password, Google account linked to your registered email, or phone OTP.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};
