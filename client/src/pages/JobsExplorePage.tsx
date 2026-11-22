import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiGetJobs, apiGetMatchingJobs, apiApplyJob } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Job, ExtractedJobPreferences } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { JobMap } from '../components/map/JobMap';
import { VoiceSearchModal } from '../components/voice/VoiceSearchModal';
import { MatchScoreBadge } from '../components/matching/MatchScoreBadge';
import { MatchExplanationModal } from '../components/matching/MatchExplanationModal';
import {
  Search,
  MapPin,
  IndianRupee,
  Briefcase,
  SlidersHorizontal,
  Map,
  List,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Mic
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Mason',
  'Mechanic',
  'Delivery',
  'Cleaner',
  'Welder'
];

export const JobsExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');
  const [selectedWageType, setSelectedWageType] = useState('daily');

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedJobForExplanation, setSelectedJobForExplanation] = useState<Job | null>(null);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);

  const fetchJobsList = async (overrides: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { ...overrides };
      if (searchQuery && !params.search) params.search = searchQuery;
      if (selectedCategory && selectedCategory !== 'All' && !params.category) params.category = selectedCategory;
      if (selectedArea && !params.area) params.area = selectedArea;
      if (selectedWageType && !params.wageType) params.wageType = selectedWageType;
      const voiceWage = searchParams.get('wage');
      if (voiceWage && !params.minWage) params.minWage = voiceWage;

      // If logged in as worker, fetch with intelligent matching scores
      if (isAuthenticated && user?.role === 'worker') {
        const res = await apiGetMatchingJobs(params);
        if (res.success) {
          setJobs(res.jobs);
        }
      } else {
        const res = await apiGetJobs(params);
        if (res.success) {
          setJobs(res.jobs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsList();
  }, [selectedCategory, selectedArea, selectedWageType, isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobsList();
  };

  const handleVoiceConfirmed = (prefs: ExtractedJobPreferences) => {
    const wageType = prefs.wage_type || 'daily';
    const params: Record<string, string> = {
      search: prefs.skill,
      area: prefs.location,
      wageType
    };
    if (Number(prefs.expected_wage) > 0) params.minWage = String(prefs.expected_wage);

    setSelectedCategory('All');
    setSelectedArea(prefs.location);
    setSearchQuery(prefs.skill);
    setSelectedWageType(wageType);
    setSearchParams({
      search: prefs.skill,
      area: prefs.location,
      wage: String(prefs.expected_wage || ''),
      distance: String(prefs.preferred_distance || 5)
    });
    void fetchJobsList(params);
  };

  const handleApply = async (job: Job) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'worker') {
      showToast('Please log in with a worker account to apply.', 'error');
      return;
    }

    try {
      const res = await apiApplyJob(job._id || (job.id as string));
      if (res.success) {
        showToast('Application submitted successfully! Employer notified.', 'success');
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
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-brand-border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-brand-dark tracking-tight">
                Hyperlocal Work Opportunities
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                {jobs.length} Active Verified Job Listings across Delhi-NCR
              </p>
            </div>

            {/* View Mode Toggle & Voice button */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => setVoiceModalOpen(true)}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-brand-accent-light border border-brand-accent/40 text-brand-dark text-xs font-bold hover:bg-brand-accent/20 transition-colors shadow-sm"
              >
                <Mic className="w-4 h-4 text-brand-accent" />
                <span>Voice Search</span>
              </button>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'list' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'map' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                  title="Hyperlocal Map View"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Inputs */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search trade, wiring, plumbing, contractor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-medium"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <MapPin className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Location (Sector 62, 63, Indirapuram...)"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-medium"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all shadow-sm"
              >
                Search Listings
              </button>
            </div>
          </form>

          {/* Trade Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-brand-muted hover:bg-slate-200 hover:text-brand-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area: Map View or List View */}
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <JobMap
              jobs={jobs}
              onSelectJob={(job) => {
                setSelectedJobForExplanation(job);
                setExplanationModalOpen(true);
              }}
              height="550px"
            />
            <p className="text-xs text-brand-muted text-center">
              Click on any map pin to view match details and job summary.
            </p>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-brand-muted">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading verified opportunities...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-brand-border text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-brand-muted">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-brand-dark">No Matching Jobs Found</h3>
                <p className="text-xs text-brand-muted max-w-sm mx-auto">
                  Try clearing your search query or expanding the trade categories and location filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedArea('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job._id || job.id}
                    className="p-5 rounded-3xl bg-white border border-brand-border hover:border-brand-primary/50 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Bar: Category & Match Score */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary-light text-brand-primary">
                          {job.category || 'Trade'}
                        </span>

                        {job.matchScore !== undefined ? (
                          <MatchScoreBadge
                            score={job.matchScore}
                            onClick={() => {
                              setSelectedJobForExplanation(job);
                              setExplanationModalOpen(true);
                            }}
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-brand-secondary flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </div>

                      {/* Job Title & Company */}
                      <h3 className="text-base font-bold text-brand-dark leading-snug">
                        {job.title}
                      </h3>
                      <div className="text-xs font-semibold text-brand-muted mt-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-brand-secondary" />
                        <span>{job.companyName}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-brand-muted mt-2 line-clamp-2 leading-relaxed font-normal">
                        {job.description}
                      </p>

                      {/* Fair Wage Transparency Box */}
                      <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-brand-muted">Offered Compensation:</span>
                          <span className="text-base font-black text-brand-primary">
                            ₹{job.offeredWage}
                            <span className="text-xs font-normal text-brand-muted">/{job.wageType}</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-brand-dark font-medium flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-brand-secondary" />
                          <span>Terms: {job.paymentFrequency || 'Daily shift end'}</span>
                        </div>

                        {/* Deductions & Overtime */}
                        <div className="text-[10px] text-slate-500">
                          {job.deductions || 'Zero deductions.'} • {job.overtimeTerms || 'Overtime available'}
                        </div>

                        {/* Warnings if wage info incomplete */}
                        {job.wageTransparencyWarnings && job.wageTransparencyWarnings.length > 0 && (
                          <div className="mt-1 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Transparency Alert:</span>{' '}
                              {job.wageTransparencyWarnings[0]}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Location & Meta info */}
                      <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-brand-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{job.location?.area || 'Sector 63'}, {job.location?.city || 'Noida'}</span>
                        </span>
                        {job.distanceKm && (
                          <span className="font-semibold text-sky-700">
                            ~{job.distanceKm} km away
                          </span>
                        )}
                        <span>•</span>
                        <span>{job.workDuration || 'Flexible'}</span>
                      </div>
                    </div>

                    {/* Bottom Apply Action */}
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
                          Apply For This Work
                        </button>
                      )}

                      {job.matchScore !== undefined && (
                        <button
                          onClick={() => {
                            setSelectedJobForExplanation(job);
                            setExplanationModalOpen(true);
                          }}
                          className="text-xs font-semibold text-brand-secondary hover:underline"
                        >
                          Why {job.matchScore}% Match?
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onConfirmPreferences={handleVoiceConfirmed}
      />

      {/* Match Explanation Modal */}
      <MatchExplanationModal
        job={selectedJobForExplanation}
        isOpen={explanationModalOpen}
        onClose={() => setExplanationModalOpen(false)}
        onApply={handleApply}
      />
    </div>
  );
};
