import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetEmployerApplications, apiUpdateApplicationStatus } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Application } from '../../types';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  Phone,
  MessageCircle,
  ShieldCheck,
  Building2,
  MapPin,
  ExternalLink,
  Filter
} from 'lucide-react';

export const EmployerCandidates: React.FC = () => {
  const { showToast } = useNotifications();
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetEmployerApplications(undefined, filterStatus !== 'All' ? filterStatus : undefined);
      if (res.success) {
        setCandidates(res.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [filterStatus]);

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      const res = await apiUpdateApplicationStatus(appId, status);
      if (res.success) {
        showToast(`Candidate status updated to ${status}! Notification delivered to worker.`, 'success');
        setCandidates(prev =>
          prev.map(c => (c._id === appId || (c as any).id === appId ? { ...c, status: status as any } : c))
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating candidate status.', 'error');
    }
  };

  return (
    <DashboardLayout
      title="Candidate Review & Skill Passports"
      subtitle="Compare applicants by match score, verified skills, and trust ratings"
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="bg-white p-4 rounded-3xl border border-brand-border shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-muted" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Status:</span>
            {['All', 'Applied', 'Shortlisted', 'Accepted', 'Rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === st
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-brand-muted hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="text-xs text-brand-muted">
            Evaluating <strong className="text-brand-dark">{candidates.length}</strong> applicants
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-brand-muted">
              Loading candidates...
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-brand-border text-center space-y-2">
              <Users className="w-8 h-8 text-brand-muted mx-auto" />
              <h3 className="text-base font-bold text-brand-dark">No Candidates Matching This Filter</h3>
              <p className="text-xs text-brand-muted">Try selecting "All" to review every application.</p>
            </div>
          ) : (
            candidates.map((cand) => {
              const wp = cand.workerProfile;
              const userRec = cand.workerUser;
              const isAccepted = cand.status === 'Accepted';
              const isShortlisted = cand.status === 'Shortlisted';
              const workerDigits = (wp?.phone || userRec?.phone || '').replace(/\D/g, '');
              const workerPhone = workerDigits.length >= 10 ? `+91${workerDigits.slice(-10)}` : '';

              return (
                <div
                  key={cand._id}
                  className={`p-6 rounded-3xl bg-white border transition-all ${
                    isAccepted
                      ? 'border-emerald-300 shadow-md bg-emerald-50/20'
                      : 'border-brand-border shadow-sm hover:shadow-card'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Worker Info & Skill Passport Identity */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-brand-primary/20 flex-shrink-0 shadow-sm">
                        <img
                          src={wp?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                          alt={wp?.fullName || 'Worker'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-brand-dark">
                            {wp?.fullName || userRec?.name || 'Worker'}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-brand-secondary" />
                          <span className="text-[10px] font-bold bg-brand-primary-light text-brand-primary px-2 py-0.5 rounded-full">
                            {wp?.primarySkill || 'Electrician'}
                          </span>
                        </div>

                        <div className="text-xs text-brand-muted flex flex-wrap items-center gap-3">
                          <span>Experience: <strong className="text-brand-dark">{wp?.experienceLevel || '3 years'}</strong></span>
                          <span>•</span>
                          <span>ID: <span className="font-mono text-brand-dark font-semibold">{wp?.workerId || 'KS-W-6201'}</span></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                            {wp?.location?.area || 'Sector 62'}, {wp?.location?.city || 'Noida'}
                          </span>
                        </div>

                        {/* Verified skills badges */}
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {wp?.skills?.map((sk, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-brand-dark font-medium"
                            >
                              {sk.skillName} ({sk.verificationStatus})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Compatibility & Trust Score Box */}
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-center px-2">
                        <div className="text-2xl font-black text-brand-primary">
                          {cand.matchScore?.total || 92}%
                        </div>
                        <div className="text-[10px] font-bold uppercase text-brand-muted">Compatibility</div>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div className="text-center px-2">
                        <div className="text-2xl font-black text-brand-accent">
                          {wp?.skillPassport?.trustScore || 94}%
                        </div>
                        <div className="text-[10px] font-bold uppercase text-brand-muted">Trust Rating</div>
                      </div>
                    </div>
                  </div>

                  {/* Application Cover Note & Job Link */}
                  {cand.coverNote && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-brand-primary-light/40 border border-brand-primary/10 text-xs text-brand-dark">
                      <span className="font-bold text-brand-primary block mb-0.5">Worker's Message:</span>
                      "{cand.coverNote}"
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="mt-5 pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-muted">Applied for:</span>
                      <span className="text-xs font-bold text-brand-dark">{cand.job?.title || 'Job Listing'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAccepted ? (
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Accepted Candidate</span>
                          </span>
                          {workerPhone && (
                            <>
                              <a
                                href={`https://wa.me/${workerPhone.replace(/\\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                                aria-label={`WhatsApp ${wp?.fullName || userRec?.name || 'worker'}`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={`tel:${workerPhone}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-colors shadow-sm"
                                aria-label={`Call ${wp?.fullName || userRec?.name || 'worker'}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Mobile Call</span>
                              </a>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(cand._id, 'Accepted')}
                            className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                            <span>Accept & Hire</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(cand._id, 'Shortlisted')}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                              isShortlisted
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : 'border-brand-border bg-white text-brand-dark hover:bg-slate-50'
                            }`}
                          >
                            <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(cand._id, 'Rejected')}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Decline"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
