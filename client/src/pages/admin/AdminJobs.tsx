import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetJobs, apiDeleteJob, apiUpdateJob } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Job } from '../../types';
import {
  Briefcase,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  MapPin,
  IndianRupee,
  ShieldCheck,
  PauseCircle
} from 'lucide-react';

export const AdminJobs: React.FC = () => {
  const { showToast } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetJobs();
      if (res.success) {
        setJobs(res.jobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this job opening from public listing?')) return;
    try {
      await apiDeleteJob(id);
      showToast('Listing removed by administrator.', 'success');
      setJobs(prev => prev.filter(j => j._id !== id && j.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error deleting job.', 'error');
    }
  };

  return (
    <DashboardLayout
      title="Job Moderation & Compliance"
      subtitle="Audit wage fairness, remove non-compliant listings, and protect workers"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-brand-muted">Loading listings...</div>
        ) : (
          jobs.map((job) => (
            <div
              key={job._id || job.id}
              className={`p-5 rounded-3xl bg-white border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                job.wageTransparencyWarnings && job.wageTransparencyWarnings.length > 0
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-brand-border'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary-light text-brand-primary">
                    {job.category}
                  </span>
                  <span className="text-xs font-bold text-brand-dark">{job.companyName}</span>
                  {job.wageTransparencyWarnings && job.wageTransparencyWarnings.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Flagged for Review</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-brand-dark">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted">
                  <span className="font-extrabold text-brand-primary">
                    ₹{job.offeredWage}/{job.wageType}
                  </span>
                  <span>•</span>
                  <span>{job.paymentFrequency || 'Shift end'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                    {job.location?.area || 'Sector 63'}, {job.location?.city || 'Noida'}
                  </span>
                </div>

                {job.wageTransparencyWarnings && job.wageTransparencyWarnings.length > 0 && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    <strong>Audit Flag:</strong> {job.wageTransparencyWarnings[0]}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(job._id || (job.id as string))}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Listing</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};
