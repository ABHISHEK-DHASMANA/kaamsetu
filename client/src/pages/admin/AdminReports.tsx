import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetAdminReports, apiUpdateReportStatus } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const { showToast } = useNotifications();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetAdminReports();
      if (res.success) {
        setReports(res.reports);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdate = async (id: string, status: string, action: string) => {
    try {
      const res = await apiUpdateReportStatus(id, {
        status,
        actionTaken: action,
        adminNotes: `Resolved by administrator on ${new Date().toLocaleDateString()}`
      });
      if (res.success) {
        showToast(`Report updated: ${status}`, 'success');
        setReports(prev =>
          prev.map(r => (r._id === id || r.id === id ? { ...r, status, actionTaken: action } : r))
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating report', 'error');
    }
  };

  return (
    <DashboardLayout
      title="Safety & Exploitation Incident Reports"
      subtitle="Review grievance filings, wage fraud complaints, and investigate platform violations"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-brand-muted">Loading incident reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-brand-border text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-brand-dark">Zero Outstanding Reports</h3>
            <p className="text-xs text-brand-muted">All reported listings and grievances have been resolved.</p>
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep._id}
              className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {rep.reason}
                    </span>
                    <h3 className="text-base font-bold text-brand-dark">{rep.targetName}</h3>
                  </div>
                  <div className="text-xs text-brand-muted">
                    Target Type: <strong className="text-brand-dark capitalize">{rep.targetType}</strong> • Filed on {new Date(rep.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  rep.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : rep.status === 'Under Investigation'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}>
                  {rep.status}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-brand-dark">
                <span className="font-bold text-brand-muted block mb-0.5">Complainant Statement:</span>
                "{rep.details}"
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-brand-muted">
                  Action Taken: <strong className="text-brand-dark">{rep.actionTaken || 'None'}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdate(rep._id, 'Resolved', 'Employer issued wage clarification & warning')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdate(rep._id, 'Under Investigation', 'Contacting employer for proof of wage payment')}
                    className="px-3 py-1.5 rounded-xl border border-brand-border bg-white text-brand-dark text-xs font-semibold hover:bg-slate-50"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleUpdate(rep._id, 'Dismissed', 'Dismissed as unfounded')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};
