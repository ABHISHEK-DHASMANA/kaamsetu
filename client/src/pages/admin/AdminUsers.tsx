import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetAdminUsers, apiToggleUserStatus, apiVerifyUserIdentity } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { User } from '../../types';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Filter,
  Search
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { showToast } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetAdminUsers(roleFilter !== 'All' ? roleFilter : undefined);
      if (res.success) {
        setUsers(res.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggle = async (id: string) => {
    try {
      const res = await apiToggleUserStatus(id);
      if (res.success) {
        showToast(res.message, 'info');
        setUsers(prev => prev.map(u => (u._id === id || (u as any).id === id ? { ...u, isActive: res.user.isActive } : u)));
      }
    } catch (err: any) {
      showToast(err.message || 'Error toggling user status', 'error');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const res = await apiVerifyUserIdentity(id, 'Identity Verified');
      if (res.success) {
        showToast('User elevated to Identity Verified!', 'success');
        setUsers(prev => prev.map(u => (u._id === id || (u as any).id === id ? { ...u, verificationStatus: 'Identity Verified' } : u)));
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <DashboardLayout
      title="User Accounts & Identity Verification"
      subtitle="Audit, elevate verification tiers, and suspend non-compliant accounts"
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white p-4 rounded-3xl border border-brand-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-muted" />
            <span className="text-xs font-bold uppercase text-brand-muted">Role:</span>
            {['All', 'worker', 'employer', 'admin'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  roleFilter === r ? 'bg-brand-primary text-white shadow-sm' : 'bg-slate-100 text-brand-muted hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-brand-border text-brand-muted uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Phone / Contact</th>
                  <th className="p-4">Verification Tier</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-brand-muted">Loading user accounts...</td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-brand-dark flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-4 uppercase font-bold text-[10px] text-brand-muted">
                        <span className={`px-2 py-0.5 rounded font-mono ${
                          u.role === 'worker' ? 'bg-brand-primary-light text-brand-primary' : u.role === 'employer' ? 'bg-brand-secondary-light text-brand-secondary' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono">{u.phone}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.verificationStatus === 'Identity Verified'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : u.verificationStatus === 'Contact Verified'
                            ? 'bg-blue-50 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{u.verificationStatus || 'Registered'}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {u.isActive !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {u.verificationStatus !== 'Identity Verified' && (
                          <button
                            onClick={() => handleVerify(u._id)}
                            className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100"
                          >
                            Verify ID
                          </button>
                        )}
                        <button
                          onClick={() => handleToggle(u._id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                            u.isActive !== false
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
