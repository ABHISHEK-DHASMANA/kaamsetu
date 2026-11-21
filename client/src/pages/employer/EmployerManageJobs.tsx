import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { apiGetJobs, apiDeleteJob, apiUpdateJob } from '../../services/api';
import { Job } from '../../types';
import {
  Briefcase,
  Users,
  MapPin,
  IndianRupee,
  PlusCircle,
  Trash2,
  CheckCircle2,
  PauseCircle,
  ExternalLink
} from 'lucide-react';

export const EmployerManageJobs: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useNotifications();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetJobs();
      if (res.success) {
        const myJobs = res.jobs.filter(j => j.employerId === user?._id || j.companyName === profile?.companyName);
        setJobs(myJobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user, profile]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this job opening?')) return;
    try {
      await apiDeleteJob(id);
      showToast('Job listing removed successfully.', 'success');
      setJobs(prev => prev.filter(j => j._id !== id && j.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error deleting job.', 'error');
    }
  };

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === 'active' ? 'completed' : 'active';
    try {
      await apiUpdateJob(job._id || (job.id as string), { status: nextStatus });
      showToast(`Job listing is now ${nextStatus}.`, 'info');
      setJobs(prev => prev.map(j => (j._id === job._id || j.id === job.id ? { ...j, status: nextStatus } : j)));
    } catch (err: any) {
      showToast(err.message || 'Error updating status.', 'error');
    }
  };

  return (
    <DashboardLayout
      title="Manage Job Listings"
      subtitle="Track active openings, applicants, and update hiring statuses"
      actionButton={
        <Link
          to="/employer/post-job"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-brand-accent" />
          <span>Post New Job</span>
        </Link>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-brand-muted">
            Loading your job listings...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-brand-border text-center space-y-3">
            <Briefcase className="w-8 h-8 text-brand-muted mx-auto" />
            <h3 className="text-base font-bold text-brand-dark">No Job Listings Posted</h3>
            <p className="text-xs text-brand-muted">
              Click 'Post New Job' to publish a trade opening with fair wage transparency.
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job._id || job.id}
              className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-card transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary-light text-brand-primary">
                    {job.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    job.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-brand-dark">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted">
                  <span className="font-extrabold text-brand-primary">
                    ₹{job.offeredWage}/{job.wageType}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                    {job.location?.area || 'Sector 63'}, {job.location?.city || 'Noida'}
                  </span>
                  <span>•</span>
                  <span>
                    Vacancies: <strong className="text-brand-dark">{job.filledVacancies || 0}/{job.vacancies || 1}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/employer/candidates"
                  className="px-3.5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Users className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Review Applicants ({job.applicantsCount || 0})</span>
                </Link>

                <button
                  onClick={() => handleToggleStatus(job)}
                  className="p-2 rounded-xl border border-brand-border text-brand-muted hover:text-brand-dark hover:bg-slate-50 transition-colors"
                  title="Toggle Active / Closed"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(job._id || (job.id as string))}
                  className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};
