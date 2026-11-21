import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  FileCheck2,
  Award,
  User,
  PlusCircle,
  Briefcase,
  Users,
  ShieldAlert,
  BarChart3,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actionButton
}) => {
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define sidebar navigation items based on current role
  const workerNav = [
    { name: 'Dashboard', path: '/worker/dashboard', icon: LayoutDashboard },
    { name: 'Find Jobs (Voice AI)', path: '/worker/find-jobs', icon: Search },
    { name: 'My Applications', path: '/worker/applications', icon: FileCheck2 },
    { name: 'Digital Skill Passport', path: '/worker/skill-passport', icon: Award },
    { name: 'Profile & Trade', path: '/worker/profile', icon: User }
  ];

  const employerNav = [
    { name: 'Overview', path: '/employer/dashboard', icon: LayoutDashboard },
    { name: 'Post a New Job', path: '/employer/post-job', icon: PlusCircle },
    { name: 'Manage Jobs', path: '/employer/manage-jobs', icon: Briefcase },
    { name: 'Review Candidates', path: '/employer/candidates', icon: Users },
    { name: 'Company Profile', path: '/employer/profile', icon: Building2 }
  ];

  const adminNav = [
    { name: 'Analytics', path: '/admin/dashboard', icon: BarChart3 },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Review Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'Incident Reports', path: '/admin/reports', icon: ShieldAlert }
  ];

  const navItems = user?.role === 'worker' ? workerNav : user?.role === 'employer' ? employerNav : adminNav;

  const getVerificationBadge = () => {
    const status = user?.verificationStatus || 'Registered';
    if (status === 'Identity Verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Identity Verified</span>
        </span>
      );
    }
    if (status === 'Contact Verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          <span>Contact Verified</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
        Registered
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-brand-border flex-shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-brand-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <span className="text-brand-accent text-xl font-black">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-brand-dark leading-none">
                KAAM<span className="text-brand-secondary">SETU</span>
              </span>
              <span className="text-[9px] text-brand-muted font-medium uppercase tracking-wider mt-0.5">
                {user?.role} Portal
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 m-3 rounded-2xl bg-brand-primary-light/50 border border-brand-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-brand-dark truncate">{user?.name}</div>
              <div className="text-[11px] text-brand-muted truncate">{user?.phone}</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            {getVerificationBadge()}
            {user?.role === 'worker' && profile?.skillPassport?.trustScore && (
              <span className="text-[11px] font-bold text-brand-secondary">
                {profile.skillPassport.trustScore}% Trust
              </span>
            )}
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-accent' : 'text-brand-muted'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <div className="p-4 border-t border-brand-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-brand-dark hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-brand-dark leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-brand-muted">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actionButton}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dark hover:bg-slate-50 transition-colors"
            >
              <span>Public Site</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-brand-border">
              <span className="font-extrabold text-brand-dark">KAAMSETU</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-brand-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-brand-primary text-white' : 'text-brand-muted hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-brand-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
