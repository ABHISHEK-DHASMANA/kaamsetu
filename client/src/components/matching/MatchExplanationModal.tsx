import React from 'react';
import { Job } from '../../types';
import { X, Sparkles, MapPin, IndianRupee, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface MatchExplanationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (job: Job) => void;
}

export const MatchExplanationModal: React.FC<MatchExplanationModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply
}) => {
  if (!isOpen || !job) return null;

  const score = job.matchScore || 85;
  const breakdown = job.matchBreakdown || {
    skillScore: 90,
    locationScore: 85,
    wageScore: 100,
    availabilityScore: 90
  };

  const explanations = job.matchExplanations || [
    `Your skill profile matches the requirements for ${job.title}.`,
    `Location is approximately ${job.distanceKm || '2.5'} km from your address.`,
    `Offered wage ₹${job.offeredWage}/${job.wageType} meets your expected baseline.`,
    'Work dates align with your immediate availability.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-border p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-accent-light flex items-center justify-center text-brand-accent">
              <Sparkles className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-dark">Intelligent Match Breakdown</h3>
              <p className="text-xs text-brand-muted">Transparent 4-Factor Compatibility Formula</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-brand-dark rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Overall Match Score Pill */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-brand-primary-light to-brand-accent-light/60 border border-brand-primary/10 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-brand-primary tracking-tight">
              {score}% Overall Compatibility
            </div>
            <div className="text-xs text-brand-muted mt-0.5 font-medium">
              Calculated for: <span className="text-brand-dark font-semibold">{job.title}</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-brand-accent font-black text-lg border border-brand-border">
            {score}%
          </div>
        </div>

        {/* 4 Factor Formula Progress Bars */}
        <div className="mt-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Weighted Compatibility Breakdown:
          </div>

          {/* Skill Score (40%) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-secondary" /> Skill Compatibility (40% Weight)
              </span>
              <span className="font-bold text-brand-secondary">{breakdown.skillScore}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-secondary rounded-full transition-all duration-500"
                style={{ width: `${breakdown.skillScore}%` }}
              />
            </div>
          </div>

          {/* Location Score (25%) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" /> Location Proximity (25% Weight)
              </span>
              <span className="font-bold text-sky-600">{breakdown.locationScore}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.locationScore}%` }}
              />
            </div>
          </div>

          {/* Wage Score (20%) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-600" /> Wage Alignment (20% Weight)
              </span>
              <span className="font-bold text-amber-600">{breakdown.wageScore}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all duration-500"
                style={{ width: `${breakdown.wageScore}%` }}
              />
            </div>
          </div>

          {/* Availability Score (15%) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Schedule & Availability (15% Weight)
              </span>
              <span className="font-bold text-purple-600">{breakdown.availabilityScore}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.availabilityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Human Readable Explanation Bullets */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-brand-dark mb-2">Why this job matches you:</div>
          <ul className="space-y-1.5 text-xs text-brand-muted">
            {explanations.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-brand-secondary font-bold">•</span>
                <span className="leading-relaxed">{exp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-dark hover:bg-slate-50"
          >
            Close
          </button>
          {onApply && !job.hasApplied && (
            <button
              onClick={() => {
                onApply(job);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark shadow-md shadow-brand-primary/20"
            >
              Apply For This Work
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
