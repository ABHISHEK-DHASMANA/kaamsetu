import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { VoiceSearchModal } from '../../components/voice/VoiceSearchModal';
import { MatchScoreBadge } from '../../components/matching/MatchScoreBadge';
import { MatchExplanationModal } from '../../components/matching/MatchExplanationModal';
import { apiGetMatchingJobs, apiApplyJob } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Job, ExtractedJobPreferences } from '../../types';
import {
  Mic,
  Search,
  MapPin,
  IndianRupee,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export const WorkerFindJobs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useNotifications();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [voiceQuery, setVoiceQuery] = useState(searchParams.get('search') || '');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');

  // Modals
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (voiceQuery) params.search = voiceQuery;
      if (selectedTrade !== 'All') params.skill = selectedTrade;
      if (selectedArea) params.location = selectedArea;

      const res = await apiGetMatchingJobs(params);
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
  }, [selectedTrade, selectedArea]);

  const handleVoiceConfirmed = (prefs: ExtractedJobPreferences) => {
    setVoiceQuery(prefs.skill);
    setSelectedTrade(prefs.skill);
    setSelectedArea(prefs.location);
    fetchJobs();
    showToast(`Preferences updated: ${prefs.skill} in ${prefs.location} at ₹${prefs.expected_wage}`, 'info');
  };

  const handleApply = async (job: Job) => {
    try {
      const res = await apiApplyJob(job._id || (job.id as string));
      if (res.success) {
        showToast('Application sent! Status updated in real time.', 'success');
        setJobs(prev =>
          prev.map(j =>
            j._id === job._id || j.id === job._id
              ? { ...j, hasApplied: true, applicationStatus: 'Applied' }
              : j
          )
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Error applying for job.', 'error');
    }
  };

  return (
    <DashboardLayout
      title="Voice-to-Work Job Discovery"
      subtitle="Find hyper-relevant jobs sorted strictly by mathematical compatibility"
      actionButton={
        <button
          onClick={() => setVoiceModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-accent text-brand-dark text-xs font-bold hover:bg-amber-400 transition-all shadow-sm"
        >
          <Mic className="w-4 h-4" />
          <span>Speak to Search</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Voice Search Hero Bar */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-primary-light via-brand-secondary-light to-brand-accent-light/50 border border-brand-primary/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-md shadow-brand-primary/20 hover:scale-105 transition-transform flex-shrink-0"
            >
              <Mic className="w-6 h-6 text-brand-accent animate-pulse" />
            </button>
            <div>
              <div className="text-sm font-extrabold text-brand-dark">Click Mic to Speak in Hindi or English</div>
              <div className="text-xs text-brand-muted">
                Say: "Mujhe kal electrician ka kaam chahiye, mere aas paas, 800 rupaye daily"
              </div>
            </div>
          </div>
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-colors shadow-sm"
          >
            Launch Voice Input
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-brand-border shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Trade Filter:</span>
            {['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mason', 'Mechanic', 'Cleaner'].map((trade) => (
              <button
                key={trade}
                onClick={() => setSelectedTrade(trade)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTrade === trade
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-brand-muted hover:bg-slate-200'
                }`}
              >
                {trade}
              </button>
            ))}
          </div>

          <div className="text-xs text-brand-muted font-medium">
            Found <span className="font-bold text-brand-dark">{jobs.length}</span> verified matches
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 p-12 text-center text-xs text-brand-muted">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Calculating real compatibility scores...
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job._id || job.id}
                className="p-5 rounded-3xl bg-white border border-brand-border shadow-sm hover:border-brand-primary/40 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary-light text-brand-primary">
                      {job.category || 'Trade'}
                    </span>
                    {job.matchScore !== undefined && (
                      <MatchScoreBadge
                        score={job.matchScore}
                        onClick={() => {
                          setSelectedJob(job);
                          setExplanationModalOpen(true);
                        }}
                      />
                    )}
                  </div>

                  <h3 className="text-base font-bold text-brand-dark leading-snug">
                    {job.title}
                  </h3>
                  <div className="text-xs font-semibold text-brand-muted mt-1 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-brand-secondary" />
                    <span>{job.companyName}</span>
                  </div>

                  <p className="text-xs text-brand-muted mt-2 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Wage Box */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-brand-muted">Compensation:</div>
                      <div className="text-base font-black text-brand-primary">
                        ₹{job.offeredWage}
                        <span className="text-xs font-normal text-brand-muted">/{job.wageType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-brand-muted">Payment Terms:</div>
                      <div className="text-xs font-semibold text-brand-dark">
                        {job.paymentFrequency || 'Daily shift end'}
                      </div>
                    </div>
                  </div>

                  {/* Location & Proximity */}
                  <div className="mt-3 flex items-center justify-between text-xs text-brand-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{job.location?.area || 'Sector 63'}, {job.location?.city || 'Noida'}</span>
                      {job.location?.coordinates && <a target="_blank" rel="noreferrer" className="ml-1 text-brand-primary underline" href={"https://www.openstreetmap.org/?mlat=" + job.location.coordinates.lat + "&mlon=" + job.location.coordinates.lng + "#map=16/" + job.location.coordinates.lat + "/" + job.location.coordinates.lng}>Map</a>}
                    </span>
                    {job.distanceKm && (
                      <span className="font-semibold text-sky-700">
                        {job.distanceKm} km away · straight-line estimate
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                  {job.hasApplied ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Status: {job.applicationStatus || 'Applied'}</span>
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
                      setSelectedJob(job);
                      setExplanationModalOpen(true);
                    }}
                    className="text-xs font-semibold text-brand-secondary hover:underline"
                  >
                    Why {job.matchScore || 85}% Match?
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onConfirmPreferences={handleVoiceConfirmed}
      />

      {/* Match Explanation Modal */}
      <MatchExplanationModal
        job={selectedJob}
        isOpen={explanationModalOpen}
        onClose={() => setExplanationModalOpen(false)}
        onApply={handleApply}
      />
    </DashboardLayout>
  );
};
