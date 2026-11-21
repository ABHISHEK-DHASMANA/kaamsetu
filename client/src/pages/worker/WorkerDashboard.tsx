import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { apiGetMatchingJobs, apiGetWorkerApplications, apiApplyJob } from '../../services/api';
import { Job, Application } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { JobMap } from '../../components/map/JobMap';
import { MatchScoreBadge } from '../../components/matching/MatchScoreBadge';
import { MatchExplanationModal } from '../../components/matching/MatchExplanationModal';
import { VoiceSearchModal } from '../../components/voice/VoiceSearchModal';
import {
  Briefcase,
  Search,
  FileCheck2,
  Award,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Mic,
  Star
} from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedJobForExplanation, setSelectedJobForExplanation] = useState<Job | null>(null);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        apiGetMatchingJobs(),
        apiGetWorkerApplications()
      ]);

      if (jobsRes.success) {
        setRecommendedJobs(jobsRes.jobs);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApply = async (job: Job) => {
    try {
      const res = await apiApplyJob(job._id || (job.id as string));
      if (res.success) {
        showToast('Application sent successfully! Employer notified.', 'success');
        setRecommendedJobs(prev =>
          prev.map(j =>
            j._id === job._id || j.id === job._id
              ? { ...j, hasApplied: true, applicationStatus: 'Applied' }
              : j
          )
        );
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting application.', 'error');
    }
  };

  return (
    <DashboardLayout
      title={`Namaste, ${user?.name || 'Worker'}!`}
      subtitle={`${profile?.primarySkill || 'Electrician'} • ${profile?.location?.area || 'Sector 62'}, ${profile?.location?.city || 'Noida'}`}
      actionButton={
        <button
          onClick={() => setVoiceModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-accent-light border border-brand-accent/40 text-brand-dark text-xs font-bold hover:bg-brand-accent/20 transition-all shadow-sm"
        >
          <Mic className="w-4 h-4 text-brand-accent" />
          <span>Voice Search</span>
        </button>
      }
    >
      <div className="space-y-8">
        {/* Top 4 Dashboard Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Matching Jobs
              </div>
              <div className="text-2xl font-black text-brand-primary mt-1">
                {recommendedJobs.length}
              </div>
              <div className="text-[10px] text-brand-secondary font-semibold mt-0.5">
                Within {profile?.preferences?.maxDistanceKm || 10} km radius
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-brand-primary-light flex items-center justify-center text-brand-primary">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Applications Sent
              </div>
              <div className="text-2xl font-black text-brand-dark mt-1">
                {applications.length}
              </div>
              <div className="text-[10px] text-brand-muted mt-0.5">
                {applications.filter(a => a.status === 'Accepted').length} Accepted
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Profile Completion
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                100%
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                Identity & Contact Active
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                Skill Passport
              </div>
              <div className="text-2xl font-black text-brand-accent mt-1 flex items-center gap-1">
                <span>{profile?.skillPassport?.trustScore || 94}%</span>
              </div>
              <div className="text-[10px] text-brand-muted mt-0.5">
                {profile?.skillPassport?.completedJobsCount || 14} Verified Jobs
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-brand-accent">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="p-4 rounded-3xl bg-white border border-brand-border shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">Quick Actions:</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/worker/find-jobs')}
              className="px-3.5 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-brand-accent" />
              <span>Find Nearby Jobs</span>
            </button>
            <button
              onClick={() => navigate('/worker/applications')}
              className="px-3.5 py-1.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-brand-secondary" />
              <span>View Applications ({applications.length})</span>
            </button>
            <button
              onClick={() => navigate('/worker/skill-passport')}
              className="px-3.5 py-1.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-brand-accent" />
              <span>Open Skill Passport</span>
            </button>
            <button
              onClick={() => navigate('/worker/profile')}
              className="px-3.5 py-1.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Update Preferences
            </button>
          </div>
        </div>

        {/* Section A: Recommended Jobs (Calculated via Formula) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-brand-dark tracking-tight">
                Recommended For You
              </h2>
              <p className="text-xs text-brand-muted">
                Intelligently matched using 4-factor compatibility (Skill, Location, Wage, Availability)
              </p>
            </div>
            <Link
              to="/worker/find-jobs"
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>View All ({recommendedJobs.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.slice(0, 4).map((job) => (
              <div
                key={job._id || job.id}
                className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm hover:border-brand-primary/40 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary-light text-brand-primary">
                      {job.category || 'Trade'}
                    </span>
                    {job.matchScore !== undefined && (
                      <MatchScoreBadge
                        score={job.matchScore}
                        onClick={() => {
                          setSelectedJobForExplanation(job);
                          setExplanationModalOpen(true);
                        }}
                      />
                    )}
                  </div>

                  <h3 className="text-base font-bold text-brand-dark leading-snug">
                    {job.title}
                  </h3>
                  <div className="text-xs font-semibold text-brand-muted mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-secondary" />
                    <span>{job.companyName}</span>
                  </div>

                  {/* Wage Box */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-brand-muted">Offered Wage:</div>
                      <div className="text-base font-black text-brand-primary">
                        ₹{job.offeredWage}
                        <span className="text-xs font-normal text-brand-muted">/{job.wageType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-brand-muted">Payment:</div>
                      <div className="text-xs font-semibold text-brand-dark">
                        {job.paymentFrequency || 'Shift end'}
                      </div>
                    </div>
                  </div>

                  {/* Location & Meta */}
                  <div className="mt-3 flex items-center justify-between text-xs text-brand-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{job.location?.area || 'Sector 63'}, {job.location?.city || 'Noida'}</span>
                    </span>
                    {job.distanceKm && (
                      <span className="font-semibold text-sky-700">
                        {job.distanceKm} km away
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                  {job.hasApplied ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(job)}
                      className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all shadow-sm"
                    >
                      Apply Now
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedJobForExplanation(job);
                      setExplanationModalOpen(true);
                    }}
                    className="text-xs font-semibold text-brand-secondary hover:underline"
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: Nearby Opportunities Map (Leaflet) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-brand-dark tracking-tight">
                Nearby Opportunities Map
              </h2>
              <p className="text-xs text-brand-muted">
                Visualizing available work within walking and cycling distance in Noida & NCR
              </p>
            </div>
          </div>
          <JobMap
            jobs={recommendedJobs}
            userLocation={profile?.location?.coordinates || { lat: 28.6280, lng: 77.3649 }}
            onSelectJob={(job) => {
              setSelectedJobForExplanation(job);
              setExplanationModalOpen(true);
            }}
            height="380px"
          />
        </div>

        {/* Section D: Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-brand-dark tracking-tight">
            Recent Activity & Employer Responses
          </h2>

          <div className="bg-white rounded-3xl border border-brand-border shadow-sm divide-y divide-brand-border/60 overflow-hidden">
            {applications.length === 0 ? (
              <div className="p-6 text-center text-xs text-brand-muted">
                No recent activity. Apply for recommended jobs above to begin!
              </div>
            ) : (
              applications.slice(0, 4).map((app) => (
                <div key={app._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary-light flex items-center justify-center text-brand-primary font-bold">
                      {app.job?.title?.charAt(0) || 'J'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-dark">
                        {app.job?.title || 'Job Listing'}
                      </div>
                      <div className="text-[11px] text-brand-muted">
                        {app.employer?.companyName || 'Employer'} • Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      app.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : app.status === 'Shortlisted'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onConfirmPreferences={(prefs) => {
          navigate(`/worker/find-jobs?search=${encodeURIComponent(prefs.skill)}&area=${encodeURIComponent(prefs.location)}`);
        }}
      />

      {/* Match Explanation Modal */}
      <MatchExplanationModal
        job={selectedJobForExplanation}
        isOpen={explanationModalOpen}
        onClose={() => setExplanationModalOpen(false)}
        onApply={handleApply}
      />
    </DashboardLayout>
  );
};
