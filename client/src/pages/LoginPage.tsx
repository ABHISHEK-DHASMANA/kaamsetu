import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  LogIn,
  User,
  Briefcase,
  ShieldCheck,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'worker' | 'employer' | 'admin'>('worker');

  const navigate = useNavigate();
  const location = useLocation();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg('Please enter your phone number and password.');
      return;
    }
    setErrorMsg(null);
    try {
      await login(phone, password);
      navigate(activeTab === 'worker' ? '/worker/dashboard' : activeTab === 'employer' ? '/employer/dashboard' : '/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickDemoClick = async (type: 'worker' | 'employer' | 'admin') => {
    setErrorMsg(null);
    try {
      await quickLogin(type);
      if (type === 'worker') navigate('/worker/dashboard');
      else if (type === 'employer') navigate('/employer/dashboard');
      else navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-brand-border shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black text-2xl mx-auto shadow-md shadow-brand-primary/20">
              <span className="text-brand-accent">K</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark tracking-tight">Welcome Back</h1>
            <p className="text-xs text-brand-muted">Login to your KAAMSETU Account</p>
          </div>

          {/* Quick 1-Click Demo Buttons (Highlight for Judges) */}
          <div className="p-4 rounded-2xl bg-brand-accent-light/50 border border-brand-accent/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span>One-Click Hackathon Evaluation Logins</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoClick('worker')}
                className="py-2 px-1.5 rounded-xl bg-white border border-brand-primary/20 hover:border-brand-primary hover:bg-brand-primary-light text-brand-dark text-[11px] font-bold shadow-sm transition-all text-center flex flex-col items-center"
              >
                <User className="w-4 h-4 text-brand-primary mb-0.5" />
                <span>Ramesh (Worker)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoClick('employer')}
                className="py-2 px-1.5 rounded-xl bg-white border border-brand-secondary/20 hover:border-brand-secondary hover:bg-brand-secondary-light text-brand-dark text-[11px] font-bold shadow-sm transition-all text-center flex flex-col items-center"
              >
                <Briefcase className="w-4 h-4 text-brand-secondary mb-0.5" />
                <span>Sharma Services</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoClick('admin')}
                className="py-2 px-1.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-brand-dark text-[11px] font-bold shadow-sm transition-all text-center flex flex-col items-center"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 mb-0.5" />
                <span>Admin Ops</span>
              </button>
            </div>
          </div>

          {/* Role selector tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('worker')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'worker' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              Worker Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('employer')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'employer' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              Employer Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'admin' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">
                Registered Mobile Number / Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 9811002233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="text-center text-xs text-brand-muted pt-2 border-t border-brand-border">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-primary hover:underline">
              Create Profile Free
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
