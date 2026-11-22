import React, { useState } from 'react';
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
                <div className="ks-preview-wrap">
                  <div className="ks-preview-top">
                    <div>
                      <p className="text-[11px] uppercase tracking-[.16em] font-bold text-emerald-700">The KaamSetu difference</p>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-2">Work that makes sense.</h2>
                      <p className="text-xs text-slate-500 mt-1">A simpler path from search to connection.</p>
                    </div>
                    <div className="ks-preview-mark"><HeartHandshake size={23} /></div>
                  </div>

                  <form onSubmit={handleQuickSearch} className="ks-preview-search !p-2 !gap-2 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-50">
                    <Search size={16} className="text-slate-400 shrink-0 ml-1" />
                    <input
                      aria-label="Search for work"
                      value={quickSkill}
                      onChange={(event) => setQuickSkill(event.target.value)}
                      placeholder="What work are you looking for?"
                      className="min-w-0 flex-1 bg-transparent border-0 !rounded-none !p-1 text-xs text-slate-700 placeholder:text-slate-400 focus:!border-0 focus:!ring-0"
                    />
                    <button type="submit" className="shrink-0 text-[10px] font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg px-3 py-2 transition-colors">Search</button>
                  </form>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] text-slate-400 font-semibold">Popular:</span>
                    {['Electrician', 'Plumber', 'Painter'].map((skill) => (
                      <button key={skill} type="button" onClick={() => { setQuickSkill(skill); navigate('/jobs?search=' + encodeURIComponent(skill)); }} className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-full px-2.5 py-1 transition-colors">{skill}</button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="ks-preview-tile">
                      <span className="ks-tile-icon bg-amber-50 text-amber-700"><Zap size={18} /></span>
                      <span className="text-sm font-bold text-slate-800">Find a trade</span>
                      <span className="text-[11px] text-slate-500">Search by skill</span>
                    </div>
                    <div className="ks-preview-tile">
                      <span className="ks-tile-icon bg-sky-50 text-sky-700"><MapPin size={18} /></span>
                      <span className="text-sm font-bold text-slate-800">Stay nearby</span>
                      <span className="text-[11px] text-slate-500">Explore local work</span>
                    </div>
                  </div>

                  <div className="ks-preview-list">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800">Built around real needs</span>
                      <span className="text-[10px] text-slate-400">Platform features</span>
                    </div>
                    {[
                      { icon: BadgeCheck, label: 'Skill profiles & work history', desc: 'Show experience with a skill passport' },
                      { icon: Wallet, label: 'Clear pay information', desc: 'Understand terms before applying' },
                      { icon: ShieldCheck, label: 'Safer connections', desc: 'Tools to report and review concerns' },
                    ].map((item) => (
                      <div className="ks-feature-row" key={item.label}>
                        <span className="ks-feature-icon"><item.icon size={17} /></span>
                        <span className="min-w-0"><strong>{item.label}</strong><small>{item.desc}</small></span>
                        <Check size={15} className="text-emerald-600 ml-auto shrink-0" />
                      </div>
                    ))}
                  </div>
                  <div className="ks-preview-foot"><span><Sparkles size={13} /> Designed for everyday work</span><span>KaamSetu</span></div>
                </div>
                <div className="ks-floating-note"><span className="ks-floating-icon"><MapPin size={16} /></span><span><strong>Local by design</strong><small>Made for nearby connections</small></span></div>
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
