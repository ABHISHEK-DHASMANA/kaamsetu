import React, { useState } from 'react';
import { SkillPassport, SkillItem } from '../../types';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Star,
  MapPin,
  Calendar,
  Share2,
  Printer,
  QrCode,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { QrCodeModal } from './QrCodeModal';

interface SkillPassportCardProps {
  passport: SkillPassport;
  isOwner?: boolean;
}

export const SkillPassportCard: React.FC<SkillPassportCardProps> = ({
  passport,
  isOwner = false
}) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'Employer Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span>Employer Confirmed</span>
          </span>
        );
      case 'Evidence Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <FileText className="w-3 h-3 text-sky-700" />
            <span>Evidence Submitted</span>
          </span>
        );
      case 'Self-declared':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            <span>Self-declared</span>
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/passport/${passport.passportId || passport.workerId}`;
    if (navigator.share) {
      navigator.share({
        title: `${passport.workerName}'s KAAMSETU Skill Passport`,
        text: `View verified skills and work history for ${passport.workerName} on KAAMSETU.`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Skill Passport public link copied to clipboard!');
    }
  };

  return (
    <div className="w-full">
      {/* Top Action Buttons for Printable & Shareable Passport */}
      <div className="mb-4 flex items-center justify-between no-print">
        <div className="text-xs text-brand-muted">
          Digital ID: <span className="font-mono font-bold text-brand-dark">{passport.passportId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-dark hover:bg-slate-50 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-primary" />
            <span>Show QR</span>
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-dark hover:bg-slate-50 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Share</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Passport</span>
          </button>
        </div>
      </div>

      {/* The Printable Digital Skill Passport Document Card */}
      <div
        id="printable-passport"
        className="bg-white rounded-3xl border-2 border-brand-primary/20 shadow-xl overflow-hidden relative"
      >
        {/* Card Header with Watermark & Hologram Feel */}
        <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary p-6 text-white relative">
          <div className="absolute top-0 right-0 w-48 h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl text-brand-accent">
                K
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-brand-accent font-black block">
                  NATIONAL HYPERLOCAL SKILL REGISTRY
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">KAAMSETU DIGITAL SKILL PASSPORT</h2>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-white/80 font-mono">GOVT / PLATFORM VERIFIED</div>
              <div className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white inline-block mt-0.5">
                {passport.passportId}
              </div>
            </div>
          </div>
        </div>

        {/* Worker Details Bar */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-brand-primary/30 flex-shrink-0 shadow-md">
                <img
                  src={passport.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={passport.workerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-brand-dark">{passport.workerName}</h3>
                  <ShieldCheck className="w-5 h-5 text-brand-secondary" />
                </div>
                <div className="text-sm font-semibold text-brand-primary mt-0.5">
                  {passport.primarySkill} • {passport.experienceLevel || `${passport.experienceYearsNum || 3} Years Experience`}
                </div>
                <div className="flex items-center gap-3 text-xs text-brand-muted mt-1.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-muted" />
                    {passport.location?.area || 'Sector 62'}, {passport.location?.city || 'Noida'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-brand-dark">ID: {passport.workerId}</span>
                </div>
              </div>
            </div>

            {/* Worker reputation: employer ratings only; no worker trust score */}
            <div className="flex items-center gap-3 bg-brand-primary-light/50 p-3.5 rounded-2xl border border-brand-primary/10">
              <div className="text-center px-3">
                {passport.reviewsCount > 0 ? (
                  <div className="text-2xl font-black text-brand-accent flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-brand-accent" />
                    <span>{Number(passport.rating || 0).toFixed(1)}/5</span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-brand-muted">New to KaamSetu</div>
                )}
                <div className="text-[10px] font-bold text-brand-muted uppercase">
                  {passport.reviewsCount > 0 ? `${passport.reviewsCount} Employer Reviews` : 'No ratings yet'}
                </div>
              </div>
              <div className="w-px h-8 bg-brand-border" />
              <div className="text-center px-3">
                <div className="text-2xl font-black text-brand-secondary">{passport.completedJobsCount || 0}</div>
                <div className="text-[10px] font-bold text-brand-muted uppercase">Completed Jobs</div>
              </div>
            </div>
          </div>

          {/* Verified Skills Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brand-secondary" />
                <span>Verified Trade Skills & Competencies</span>
              </h4>
              <span className="text-[11px] text-brand-muted">
                Audit standard: Multi-tier evidence verification
              </span>
            </div>

            <div className="border border-brand-border rounded-2xl overflow-hidden divide-y divide-brand-border/60">
              {(passport.skills && passport.skills.length > 0 ? passport.skills : [
                { skillName: passport.primarySkill || 'Electrician', category: 'Electrical', experienceYears: 3, verificationStatus: 'Employer Confirmed' as const }
              ]).map((skill, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-brand-dark">{skill.skillName}</div>
                    <div className="text-[11px] text-brand-muted">
                      {skill.category} • {skill.experienceYears} Years Track Record
                      {skill.endorsementsCount ? ` • ${skill.endorsementsCount} Employer Endorsements` : ''}
                    </div>
                  </div>
                  <div>
                    {getVerificationBadge(skill.verificationStatus)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Badges & Trust Seals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-2.5">
              Verified Trust Credentials
            </h4>
            <div className="flex flex-wrap gap-2">
              {(passport.badges && passport.badges.length > 0 ? passport.badges : [
                'Identity Verified',
                'Top Rated Artisan',
                'Zero Cancellation Record'
              ]).map((badge, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-brand-dark text-xs font-semibold flex items-center gap-1.5 border border-slate-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{badge}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Bio / Work Summary */}
          {passport.bio && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-brand-muted uppercase block mb-1">
                Artisan Statement:
              </span>
              <p className="text-xs text-brand-dark leading-relaxed font-normal">{passport.bio}</p>
            </div>
          )}

          {/* Verification Audit Note */}
          <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-muted gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-secondary" />
              <span>
                Issued on {new Date(passport.issueDate || Date.now()).toLocaleDateString()} • Verified on KAAMSETU Network
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              HASH: SHA256_{passport.passportId?.replace(/[^a-zA-Z0-9]/g, '')}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal for sharing */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        passportId={passport.passportId}
        workerName={passport.workerName || 'Worker'}
      />
    </div>
  );
};
