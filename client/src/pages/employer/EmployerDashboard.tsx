import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { apiGetEmployerProfile, apiGetEmployerApplications, apiGetJobs } from '../../services/api';
import { Application, Job } from '../../types';
import {
  Briefcase,
  Users,
  CheckCircle2,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  MapPin
} from 'lucide-react';

export const EmployerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [jobsRes, appsRes] = await Promise.all([
          apiGetJobs(),
          apiGetEmployerApplications()
        ]);

        if (jobsRes.success) {
          // Filter jobs belonging to this employer
          const myJobs = jobsRes.jobs.filter(j => j.employerId === user?._id || j.companyName === profile?.companyName);
          setActiveJobs(myJobs);
        }
        if (appsRes.success) {
          setApplications(appsRes.applications);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, profile]);

  const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
  const hiredCount = applications.filter(a => a.status === 'Accepted').length;

  return (
    <DashboardLayout
      title={`Dashboard: ${profile?.companyName || user?.name}`}
      subtitle={`${profile?.businessType || 'Hiring Enterprise'} • ${profile?.address?.area || 'Sector 63'}, Noida`}
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
      <div className="space-y-8">
        {/* Top 4 Dashboard Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Active Listings
              </div>
              <div className="text-2xl font-black text-brand-primary mt-1">
                {activeJobs.filter(j => j.status === 'active').length}
              </div>
              <div className="text-[10px] text-brand-secondary font-semibold mt-0.5">
                {activeJobs.length} Total Jobs Posted
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-brand-primary-light flex items-center justify-center text-brand-primary">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Total Applicants
              </div>
              <div className="text-2xl font-black text-brand-dark mt-1">
                {applications.length}
              </div>
              <div className="text-[10px] text-brand-muted mt-0.5">
                Direct Local Candidates
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Shortlisted
              </div>
              <div className="text-2xl font-black text-sky-600 mt-1">
                {shortlistedCount}
              </div>
              <div className="text-[10px] text-sky-700 font-semibold mt-0.5">
                Passports Evaluated
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Hired / Accepted
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {hiredCount}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                Direct Contacts Active
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Applicants Section (Core Candidate Review Flow) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-brand-dark tracking-tight">
                Candidate Pipeline & Skill Passports
              </h2>
              <p className="text-xs text-brand-muted">
                Review verified artisans who applied for your listings, sorted by compatibility
              </p>
            </div>
            <Link
              to="/employer/candidates"
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>View All Candidates ({applications.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-brand-border shadow-sm divide-y divide-brand-border/60 overflow-hidden">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted">
                No candidate applications yet. Post a new job listing to start receiving nearby applications.
              </div>
            ) : (
              applications.slice(0, 5).map((app) => (
                <div key={app._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-brand-border flex-shrink-0">
                      <img
                        src={app.workerProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt={app.workerProfile?.fullName || 'Worker'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand-dark">
                          {app.workerProfile?.fullName || app.workerUser?.name || 'Worker'}
                        </span>
                        <ShieldCheck className="w-4 h-4 text-brand-secondary" />
                        {app.matchScore?.total && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                            {app.matchScore.total}% Match
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        {app.workerProfile?.primarySkill || 'Electrician'} • {app.workerProfile?.experienceLevel || '3 yrs'} • ID: {app.workerProfile?.workerId || 'KS-W-6201'}
                      </div>
                      <div className="text-[11px] text-brand-primary font-semibold mt-0.5">
                        Applied for: {app.job?.title || 'Job'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      app.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : app.status === 'Shortlisted'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {app.status}
                    </span>

                    <Link
                      to="/employer/candidates"
                      className="px-3.5 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-dark hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Manage Candidate
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Active Jobs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-brand-dark tracking-tight">
              My Job Openings
            </h2>
            <Link
              to="/employer/manage-jobs"
              className="text-xs font-bold text-brand-primary hover:underline"
            >
              Manage Listings
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <div
                key={job._id || job.id}
                className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary-light text-brand-primary">
                    {job.category}
                  </span>
                  <span className="text-xs font-extrabold text-brand-primary">
                    ₹{job.offeredWage}/{job.wageType}
                  </span>
                </div>

                <h3 className="text-base font-bold text-brand-dark">{job.title}</h3>
                <div className="text-xs text-brand-muted flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{job.location?.area || 'Sector 63'}, {job.location?.city || 'Noida'}</span>
                </div>

                <div className="pt-2 border-t border-brand-border flex items-center justify-between text-xs">
                  <span className="text-brand-muted">
                    Vacancies: <span className="font-bold text-brand-dark">{job.filledVacancies || 0}/{job.vacancies || 1}</span>
                  </span>
                  <Link
                    to="/employer/candidates"
                    className="font-bold text-brand-secondary hover:underline"
                  >
                    View Applicants ({job.applicantsCount || 0}) →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
