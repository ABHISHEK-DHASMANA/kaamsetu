import React, { useState } from 'react';
import { RibbonStage } from '../components/visual/RibbonStage';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { VoiceSearchModal } from '../components/voice/VoiceSearchModal';
import { ExtractedJobPreferences } from '../types';
import {
  ArrowUpRight, AudioLines, BadgeCheck, BriefcaseBusiness, Check, ChevronRight,
  Clock3, Hammer, HardHat, HeartHandshake, MapPin, Mic, Search, ShieldCheck,
  Sparkles, Users, Wallet, Wrench, Zap
} from 'lucide-react';

const categories = [
  { name: 'Electrician', detail: 'Wiring, repairs & fitting', icon: Zap, tone: 'amber', query: 'Electrician' },
  { name: 'Plumber', detail: 'Pipes, taps & maintenance', icon: Wrench, tone: 'blue', query: 'Plumber' },
  { name: 'Carpenter', detail: 'Furniture & woodwork', icon: Hammer, tone: 'orange', query: 'Carpenter' },
  { name: 'Construction', detail: 'Masonry & site work', icon: HardHat, tone: 'green', query: 'Mason' },
];

export const LandingPage: React.FC = () => {
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [quickSkill, setQuickSkill] = useState('');
  const [quickArea, setQuickArea] = useState('');
  const navigate = useNavigate();

  const handleQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (quickSkill.trim()) params.set('search', quickSkill.trim());
    if (quickArea.trim()) params.set('area', quickArea.trim());
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleVoiceConfirmed = (prefs: ExtractedJobPreferences) => {
    const spokenArea = (prefs.location || '').trim();
    const genericNearby = /^(nearby|near me|around me|aas paas|mere aas paas|पास में|आस पास|noida sector 62)$/i.test(spokenArea);
    const params = new URLSearchParams({ search: prefs.skill });
    if (spokenArea && !genericNearby) params.set('area', spokenArea);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="ks-site min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="ks-hero relative overflow-hidden">
          <div className="ks-hero-orb ks-hero-orb-one" />
          <div className="ks-hero-orb ks-hero-orb-two" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-24 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-center">
              <div className="lg:col-span-7 space-y-7">
                <div className="ks-eyebrow"><span className="ks-live-dot" /> A better way to find local work</div>
                <div className="space-y-5">
                  <h1 className="ks-display">Good work.<br /><span>Closer to home.</span></h1>
                  <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
                    Find nearby opportunities or connect with skilled people in your area. Clear work details, transparent pay and a more direct way to get started.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/jobs" className="ks-button ks-button-primary">
                    <Search size={17} /> Find work <ArrowUpRight size={16} />
                  </Link>
                  <Link to="/workers" className="ks-button ks-button-light">
                    <Users size={17} /> Hire local talent <ArrowUpRight size={16} />
                  </Link>
                </div>

                <div className="ks-voice-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="ks-voice-icon"><AudioLines size={21} /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">Rather speak than type?</p>
                      <p className="text-xs text-slate-500 mt-0.5">Search in Hindi or English. No account needed.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setVoiceModalOpen(true)} className="ks-voice-action">
                    <Mic size={15} /> Speak
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Browse freely. Sign in only when you want to apply, hire or contact someone.</p>
              </div>

              <div className="lg:col-span-5">
                <RibbonStage />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div>
                <p className="ks-section-kicker">Explore opportunities</p>
                <h2 className="ks-section-title">Start with your skill.</h2>
                <p className="text-sm text-slate-500 mt-2">Choose a trade to see relevant work around you.</p>
              </div>
              <Link to="/jobs" className="ks-text-link">Browse all jobs <ChevronRight size={16} /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link key={category.name} to={`/jobs?category=${encodeURIComponent(category.query)}`} className="ks-category-card">
                    <span className={`ks-category-icon tone-${category.tone}`}><Icon size={21} /></span>
                    <span className="block text-base font-bold text-slate-900 mt-5">{category.name}</span>
                    <span className="block text-xs text-slate-500 mt-1">{category.detail}</span>
                    <span className="ks-category-arrow"><ArrowUpRight size={16} /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ks-how-section py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <p className="ks-section-kicker">Simple from the start</p>
              <h2 className="ks-section-title">Less searching around.<br />More getting things done.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { n: '01', icon: Search, title: 'Explore', desc: 'Search local jobs by trade, location and work details. Employers can browse public skill profiles.' },
                { n: '02', icon: BriefcaseBusiness, title: 'Connect', desc: 'Create an account when you are ready to apply, post a job or contact the other person.' },
                { n: '03', icon: Clock3, title: 'Get to work', desc: 'Agree on the work and payment terms directly. Keep a record of progress and feedback.' },
              ].map((step) => {
                const Icon = step.icon;
                return <article key={step.n} className="ks-step-card"><div className="flex items-center justify-between"><span className="ks-step-number">{step.n}</span><Icon size={21} className="text-emerald-700" /></div><h3>{step.title}</h3><p>{step.desc}</p></article>;
              })}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="ks-cta-panel">
              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-200">Your next step starts here</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 leading-tight">Good people. Honest work.<br />A connection that works.</h2>
                <p className="text-sm text-emerald-50/80 mt-4 max-w-lg">Whether you are looking for your next opportunity or someone reliable for a job, start with KaamSetu.</p>
                <div className="flex flex-wrap gap-3 mt-7">
                  <Link to="/jobs" className="ks-button ks-button-cta">Explore jobs <ArrowUpRight size={16} /></Link>
                  <Link to="/workers" className="ks-button ks-button-cta-outline">Find workers <ArrowUpRight size={16} /></Link>
                </div>
              </div>
              <div className="ks-cta-decoration"><HeartHandshake size={140} strokeWidth={0.8} /></div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <VoiceSearchModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} onConfirmPreferences={handleVoiceConfirmed} />
    </div>
  );
};
