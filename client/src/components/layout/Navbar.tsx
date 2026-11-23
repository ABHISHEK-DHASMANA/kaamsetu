import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Briefcase,
  Users,
  ShieldCheck,
  Bell,
  LogOut,
  LogIn,
  Menu,
  X,
  User,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<'worker' | 'employer' | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const runDemoLogin = async (role: 'worker' | 'employer') => {
    setDemoError(null);
    setDemoLoadingRole(role);
    setDemoDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await quickLogin(role);
      navigate(role === 'worker' ? '/worker/dashboard' : '/employer/dashboard');
    } catch (error: any) {
      setDemoError(error?.message || 'Demo login failed. Please try again.');
      setDemoDropdownOpen(true);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'worker') return '/worker/dashboard';
    if (user.role === 'employer') return '/employer/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-primary/20">
                <span className="text-brand-accent text-2xl font-black">K</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-brand-dark leading-none">
                  KAAM<span className="text-brand-secondary">SETU</span>
                </span>
                <span className="text-[10px] text-brand-muted font-medium tracking-wide">
                  काम पास में • मौके सबके लिए
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center ml-8 space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-brand-primary bg-brand-primary-light' : 'text-brand-muted hover:text-brand-dark hover:bg-slate-50'
                }`}
              >
                Home
              </Link>
              <Link
                to="/jobs"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/jobs' ? 'text-brand-primary bg-brand-primary-light' : 'text-brand-muted hover:text-brand-dark hover:bg-slate-50'
                }`}
              >
                Find Jobs
              </Link>
              <Link
                to="/workers"
                className="px-3 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-dark hover:bg-slate-50 transition-colors"
              >
                Hire Workers
              </Link>
              <Link
                to="/about"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/about' ? 'text-brand-primary bg-brand-primary-light' : 'text-brand-muted hover:text-brand-dark hover:bg-slate-50'
                }`}
              >
                About Us
              </Link>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-accent/40 bg-brand-accent-light text-brand-dark text-xs font-semibold hover:border-brand-accent transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-brand-muted" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-brand-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-muted border-b border-brand-border/60">
                    One-Click Hackathon Logins
                  </div>
                  {demoError && <div role="alert" className="mx-3 my-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-700">{demoError}</div>}
                  <button
                    type="button"
                    disabled={demoLoadingRole !== null}
                    onClick={() => runDemoLogin('worker')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-brand-primary-light flex items-center justify-between group disabled:opacity-50"
                  >
                    <div>
                      <div className="font-semibold text-brand-dark">{demoLoadingRole === 'worker' ? 'Opening demo…' : 'Ramesh Kumar (Worker)'}</div>
                      <div className="text-[11px] text-brand-muted">Electrician • Sector 62 • ₹800</div>
                    </div>
                    <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded font-mono font-medium">Worker</span>
                  </button>
                  <button
                    type="button"
                    disabled={demoLoadingRole !== null}
                    onClick={() => runDemoLogin('employer')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-brand-primary-light flex items-center justify-between group disabled:opacity-50"
                  >
                    <div>
                      <div className="font-semibold text-brand-dark">{demoLoadingRole === 'employer' ? 'Opening demo…' : 'Sharma Electrical Services'}</div>
                      <div className="text-[11px] text-brand-muted">Employer • Sector 63 • Hiring</div>
                    </div>
                    <span className="text-[10px] bg-brand-secondary/10 text-brand-secondary px-1.5 py-0.5 rounded font-mono font-medium">Employer</span>
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated && user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-slate-100 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-brand-border py-2 z-50">
                      <div className="px-4 py-2 border-b border-brand-border flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">Notifications</span>
                        <span className="text-[11px] text-brand-secondary font-medium">{unreadCount} new</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-brand-border/40">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-brand-muted">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 6).map(n => (
                            <div
                              key={n._id}
                              onClick={() => {
                                markRead(n._id);
                                if (n.actionUrl) navigate(n.actionUrl);
                                setNotifDropdownOpen(false);
                              }}
                              className={`p-3 text-xs hover:bg-slate-50 cursor-pointer ${!n.isRead ? 'bg-brand-primary-light/40' : ''}`}
                            >
                              <div className="font-semibold text-brand-dark">{n.title}</div>
                              <div className="text-brand-muted mt-0.5 line-clamp-2">{n.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Button */}
                <Link
                  to={getDashboardLink()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark transition-all shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user.role.toUpperCase()} PANEL</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-brand-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-dark hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary-dark transition-all shadow-sm shadow-brand-primary/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-brand-dark hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-dark hover:bg-brand-primary-light"
          >
            Home
          </Link>
          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-dark hover:bg-brand-primary-light"
          >
            Find Jobs
          </Link>
          <Link
            to="/register?role=employer"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-dark hover:bg-brand-primary-light"
          >
            Hire Workers
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-dark hover:bg-brand-primary-light"
          >
            About Us
          </Link>

          <div className="pt-3 border-t border-brand-border space-y-2">
            <div className="text-[11px] font-bold text-brand-muted uppercase">Quick Demo Access</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" disabled={demoLoadingRole !== null} onClick={() => runDemoLogin('worker')} className="px-2 py-2 bg-brand-primary-light text-brand-primary rounded text-xs font-semibold disabled:opacity-50">
                {demoLoadingRole === 'worker' ? 'Opening…' : 'Worker Demo'}
              </button>
              <button type="button" disabled={demoLoadingRole !== null} onClick={() => runDemoLogin('employer')} className="px-2 py-2 bg-brand-secondary-light text-brand-secondary rounded text-xs font-semibold disabled:opacity-50">
                {demoLoadingRole === 'employer' ? 'Opening…' : 'Employer Demo'}
              </button>
            </div>
            {demoError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">{demoError}</p>}

            {isAuthenticated ? (
              <div className="flex gap-2 pt-2">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-xl bg-brand-primary text-white text-xs font-semibold"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-xl border border-brand-border text-xs font-semibold text-brand-dark"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-xl bg-brand-primary text-white text-xs font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
