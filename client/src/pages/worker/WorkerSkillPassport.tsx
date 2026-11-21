import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { SkillPassportCard } from '../../components/passport/SkillPassportCard';
import { apiGetSkillPassport } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SkillPassport } from '../../types';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Upload,
  ExternalLink,
  Plus
} from 'lucide-react';

export const WorkerSkillPassport: React.FC = () => {
  const { user } = useAuth();
  const [passport, setPassport] = useState<SkillPassport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPassport = async () => {
      setIsLoading(true);
      try {
        const res = await apiGetSkillPassport();
        if (res.success) {
          setPassport(res.skillPassport);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPassport();
  }, []);

  return (
    <DashboardLayout
      title="Digital Skill Passport"
      subtitle="Your portable, verified trade identity with immutable employer endorsements"
    >
      <div className="space-y-6">
        {/* Verification Levels Explanatory Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Self-Declared</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Skills entered during onboarding without formal documentation.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs space-y-1">
            <div className="font-bold text-sky-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>2. Evidence Submitted</span>
            </div>
            <p className="text-[11px] text-sky-700">
              ITI certificate, government wireman license, or trade diploma uploaded.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Employer Confirmed</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Directly validated by contractors after verified job completions.
            </p>
          </div>
        </div>

        {/* The Card */}
        {isLoading ? (
          <div className="p-16 text-center text-xs text-brand-muted">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Generating your verifiable digital passport...
          </div>
        ) : passport ? (
          <SkillPassportCard passport={passport} isOwner={true} />
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-brand-border text-center text-xs text-brand-muted">
            Passport details unavailable.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
