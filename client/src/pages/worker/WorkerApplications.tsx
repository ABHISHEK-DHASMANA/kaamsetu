import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetWorkerApplications, apiCreateReview, apiSubmitReport, apiUpdateWorkLifecycle } from '../../services/api';
import { Application } from '../../types';
import {
  FileCheck2,
  Building2,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Star,
  Flag
} from 'lucide-react';

export const WorkerApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetWorkerApplications();
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const lifecycleAction = async (app: Application, action: 'start_work' | 'request_completion' | 'cancel') => {
    const reason = action === 'cancel' ? window.prompt('Please explain why you need to cancel (at least 5 characters):') : undefined;
    if (action === 'cancel' && (!reason || reason.trim().length < 5)) return;
    try { await apiUpdateWorkLifecycle(app._id || (app as any).id || '', action, reason); window.alert('Your update was sent to the other party.'); await fetchApps(); }
    catch (error: any) { window.alert(error.message || 'Could not update this job.'); }
  };

  const submitRating = async (app: Application) => {
    const ratingInput = window.prompt('Rate this employer from 1 to 5 stars:');
    if (ratingInput === null) return;
    const rating = Number(ratingInput);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      window.alert('Please enter a whole number from 1 to 5.');
      return;
    }
    const reviewText = window.prompt('Write a short review (at least 3 characters):');
    if (!reviewText) return;
    try {
      const result = await apiCreateReview({ toUserId: app.employerId, jobId: app.jobId, rating, reviewText });
      window.alert(result.message);
    } catch (error: any) {
      window.alert(error.message || 'Could not submit your rating.');
    }
  };

  const reportJob = async (app: Application) => {
    const reasons = ['Fake listing', 'Unsafe behaviour', 'Harassment', 'Payment issue', 'Non-payment', 'Unsafe conduct', 'Misleading information', 'Other'];
    const reason = window.prompt('Report reason: ' + reasons.join(', '));
    if (!reason) return;
    if (!reasons.includes(reason)) {
      window.alert('Choose one of the listed report reasons.');
      return;
    }
    const details = window.prompt('Describe the issue (at least 5 characters):');
    if (!details || details.trim().length < 5) return;
    try {
      const result = await apiSubmitReport({ targetType: 'job', targetId: app.jobId, targetName: app.job?.title || 'Job', reason, details });
      window.alert(result.message);
    } catch (error: any) {
      window.alert(error.message || 'Could not submit your report.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>ACCEPTED 🎉</span>
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-700" />
            <span>Shortlisted</span>
          </span>
        );
      case 'Viewed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5 text-purple-700" />
            <span>Profile Viewed</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Job Completed</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Not Selected</span>
          </span>
        );
      case 'Applied':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Application Sent</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout
      title="My Job Applications"
      subtitle="Track your applications and contact employers in real time"
    >
      <div className="space-y-6">
        {/* Metric summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-brand-border text-center">
            <div className="text-2xl font-black text-brand-dark">{applications.length}</div>
            <div className="text-[11px] text-brand-muted uppercase font-bold mt-0.5">Total Submitted</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-brand-border text-center">
            <div className="text-2xl font-black text-emerald-600">
              {applications.filter(a => a.status === 'Accepted').length}
            </div>
            <div className="text-[11px] text-emerald-700 uppercase font-bold mt-0.5">Accepted & Hired</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-brand-border text-center">
            <div className="text-2xl font-black text-sky-600">
              {applications.filter(a => a.status === 'Shortlisted').length}
            </div>
            <div className="text-[11px] text-sky-700 uppercase font-bold mt-0.5">Shortlisted</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-brand-border text-center">
            <div className="text-2xl font-black text-purple-600">
              {applications.filter(a => a.status === 'Viewed' || a.status === 'Applied').length}
            </div>
            <div className="text-[11px] text-purple-700 uppercase font-bold mt-0.5">Under Review</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-brand-muted">
              Loading your application records...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-brand-border text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-brand-muted">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">No Applications Sent Yet</h3>
              <p className="text-xs text-brand-muted">
                Use Voice Search to discover nearby electrical, plumbing, or masonry work and apply with 1-click.
              </p>
            </div>
          ) : (
            applications.map((app) => {
              const employerDigits = (app.employer?.phone || '').replace(/\D/g, '');
              const employerPhone = employerDigits.length >= 10 ? `+91${employerDigits.slice(-10)}` : '';
              return (
              <div
                key={app._id}
                className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-4 hover:shadow-card transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-brand-dark">
                        {app.job?.title || 'Job Listing'}
                      </h3>
                      {app.matchScore?.total && (
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          {app.matchScore.total}% Match
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-brand-muted mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand-secondary" />
                      <span>{app.employer?.companyName || 'Employer'}</span>
                      <span>•</span>
                      <span>Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>{getStatusBadge(app.status)}</div>
                </div>

                {/* Job specifics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-brand-muted uppercase font-bold block mb-0.5">Offered Wage:</span>
                    <span className="font-extrabold text-brand-primary text-sm">
                      ₹{app.job?.offeredWage} <span className="text-xs font-normal text-brand-muted">/{app.job?.wageType}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-brand-muted uppercase font-bold block mb-0.5">Work Site Location:</span>
                    <span className="font-semibold text-brand-dark">
                      {app.job?.location?.area || 'Sector 63'}, {app.job?.location?.city || 'Noida'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-brand-muted uppercase font-bold block mb-0.5">Payment Terms:</span>
                    <span className="font-semibold text-brand-secondary">
                      {app.job?.paymentFrequency || 'Shift end direct payment'}
                    </span>
                  </div>
                </div>

                {['Applied', 'Viewed', 'Shortlisted'].includes(app.status) && (
                  <div className="flex flex-wrap gap-2 border-t border-brand-border pt-3">
                    <button onClick={() => lifecycleAction(app, 'cancel')} className="rounded-xl border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Withdraw application</button>
                  </div>
                )}
                {app.status === 'Accepted' && (
                  <div className="flex flex-wrap gap-2 border-t border-brand-border pt-3">
                    <button onClick={() => lifecycleAction(app, 'start_work')} className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-bold">Start work</button>
                    <button onClick={() => lifecycleAction(app, 'cancel')} className="rounded-xl border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Cancel with reason</button>
                  </div>
                )}
                {app.status === 'InProgress' && (
                  <div className="flex flex-wrap gap-2 border-t border-brand-border pt-3">
                    <button onClick={() => lifecycleAction(app, 'request_completion')} className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-bold">Request completion</button>
                    <button onClick={() => lifecycleAction(app, 'cancel')} className="rounded-xl border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Cancel / raise issue</button>
                  </div>
                )}
                {app.status === 'CompletionRequested' && <p className="text-xs text-amber-700">Completion requested. Waiting for the employer to confirm the work.</p>}
                {app.status === 'Cancelled' && <p className="text-xs text-red-700">Cancelled: {(app as any).cancellationReason || 'Reason recorded'} {(app as any).cancellationReviewRequired ? '• Flagged for review' : ''}</p>}
                {app.status === 'Completed' && (
                  <div className="flex flex-wrap gap-2 border-t border-brand-border pt-3">
                    <button onClick={() => submitRating(app)} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs font-bold">
                      <Star className="w-3.5 h-3.5" /> Rate employer
                    </button>
                    <button onClick={() => reportJob(app)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">
                      <Flag className="w-3.5 h-3.5" /> Report issue
                    </button>
                  </div>
                )}

                {/* Unlocked Employer Contact Box when ACCEPTED */}
                {app.status === 'Accepted' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Direct Contact Unlocked! You have been accepted for this position.</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
                      {employerPhone ? (
                        <>
                          <a
                            href={`https://wa.me/${employerPhone.replace(/\\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 underline font-bold"
                            aria-label={`Message employer on WhatsApp at ${employerPhone}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                            WhatsApp Employer
                          </a>
                          <a
                            href={`tel:${employerPhone}`}
                            className="inline-flex items-center gap-1.5 underline font-bold"
                            aria-label={`Call employer at ${employerPhone}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            Mobile Call
                          </a>
                        </>
                      ) : (
                        <span className="text-emerald-800">Employer has not shared a phone number yet.</span>
                      )}
                      <span>Contact is available because this application was accepted.</span>
                    </div>
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
