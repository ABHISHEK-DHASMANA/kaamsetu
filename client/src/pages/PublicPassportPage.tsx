import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetSkillPassport } from '../services/api';
import { SkillPassport } from '../types';
import { SkillPassportCard } from '../components/passport/SkillPassportCard';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ShieldCheck, Award, ArrowLeft } from 'lucide-react';

export const PublicPassportPage: React.FC = () => {
  const { passportId } = useParams<{ passportId: string }>();
  const [passport, setPassport] = useState<SkillPassport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicPassport = async () => {
      setIsLoading(true);
      try {
        const res = await apiGetSkillPassport(passportId);
        if (res.success) {
          setPassport(res.skillPassport);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (passportId) {
      fetchPublicPassport();
    }
  }, [passportId]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Opportunities</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Public Authenticated Skill Registry</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-xs text-brand-muted">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Verifying digital passport signature...
          </div>
        ) : passport ? (
          <SkillPassportCard passport={passport} isOwner={false} />
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-brand-border text-center space-y-3">
            <Award className="w-8 h-8 text-brand-muted mx-auto" />
            <h3 className="text-base font-bold text-brand-dark">Skill Passport Not Found</h3>
            <p className="text-xs text-brand-muted">
              The requested digital passport ID does not exist or has been made private.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
