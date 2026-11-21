import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  ShieldCheck,
  Award,
  IndianRupee,
  MapPin,
  Heart,
  Users,
  CheckCircle2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary-light border border-brand-primary/20 text-xs font-semibold text-brand-primary">
            <Award className="w-3.5 h-3.5" />
            <span>Mission & Ethics Charter</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
            Building Bharat's Most Trusted Hyperlocal Employment Network
          </h1>
          <p className="text-base text-brand-muted max-w-2xl mx-auto">
            KAAMSETU is on a mission to connect informal and semi-skilled workers directly with nearby employers through dignity, digital transparency, and verifiable skills.
          </p>
        </div>

        {/* The Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-3">
            <div className="text-red-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>The Ground Reality</span>
            </div>
            <h3 className="text-xl font-bold text-brand-dark">Exploitative Middlemen & Wage Delay</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Informal workers—electricians, plumbers, masons, cleaners—often stand at physical labour chowks or rely on intermediaries who siphon off 25–40% commissions and delay payments for weeks without recourse.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-brand-primary-light/50 border border-brand-primary/20 shadow-sm space-y-3">
            <div className="text-brand-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span>The KAAMSETU Solution</span>
            </div>
            <h3 className="text-xl font-bold text-brand-dark">Voice-First Hyperlocal Connectivity</h3>
            <p className="text-xs text-brand-dark leading-relaxed">
              We empower every worker with an AI-accessible voice interface, direct connections to verified contractors within 2–10 km, guaranteed payment transparency, and an immutable Digital Skill Passport.
            </p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-brand-dark tracking-tight">
            Our 3 Core Ethical Commitments
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold">
                <IndianRupee className="w-5 h-5 text-brand-accent" />
              </div>
              <h4 className="text-base font-bold text-brand-dark">Fair Wage Transparency</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Zero arbitrary hidden cuts. Employers must declare daily wages, disbursement timing (e.g. shift-end UPI), and overtime compensation upfront.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-brand-accent" />
              </div>
              <h4 className="text-base font-bold text-brand-dark">Digital Skill Passport</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Instead of requiring traditional paper resumes, every worker builds a verified portable track record endorsed by employers with transparent audit ratings.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
              </div>
              <h4 className="text-base font-bold text-brand-dark">3-Tier Verified Trust</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Clear distinction between 'Registered', 'Contact Verified', and 'Identity Verified'. No fake badges or unearned claims.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Standards Note */}
        <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-brand-dark">Our Standards on Verification & Safety:</div>
          <p className="text-brand-muted leading-relaxed">
            KAAMSETU actively combats exploitation by enforcing clear skill level labelling: "Self-declared" vs "Evidence Submitted" vs "Employer Confirmed". Any employer or contractor with recurring wage delay complaints is flagged by our automated audit engine and reviewed by admin moderators.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};
