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
        <section className="ks-modern-hero">
          <div className="ks-hero-glow ks-hero-glow-a" />
          <div className="ks-hero-glow ks-hero-glow-b" />
          <div className="ks-modern-shell">
            <div className="ks-hero-copy">
              <div className="ks-modern-eyebrow"><span /> LOCAL WORK, MADE SIMPLE</div>
              <h1 className="ks-modern-title">Good work is<br /><em>closer than</em><br />you think.</h1>
              <p className="ks-modern-lead">Find trusted local opportunities or connect with skilled people around you. Clear details, fair expectations, and a simpler way to get to work.</p>
              <form onSubmit={handleQuickSearch} className="ks-search-panel">
                <label className="ks-search-field">
                  <Search size={18} />
                  <input aria-label="Skill or job" value={quickSkill} onChange={e => setQuickSkill(e.target.value)} placeholder="What work do you need?" />
                </label>
                <span className="ks-search-divider" />
                <label className="ks-search-field ks-location-field">
                  <MapPin size={18} />
                  <input aria-label="Location" value={quickArea} onChange={e => setQuickArea(e.target.value)} placeholder="Your area" />
                </label>
                <button type="submit" className="ks-search-submit">Find work <ArrowUpRight size={17} /></button>
              </form>
              <div className="ks-hero-actions">
                <button type="button" onClick={() => setVoiceModalOpen(true)} className="ks-voice-pill"><AudioLines size={17} /> Search by voice <span>Hindi or English</span><Mic size={15} /></button>
                <span className="ks-no-account">No account needed to explore.</span>
              </div>
              <div className="ks-popular-skills">
                <span>Popular:</span>
                {['Electrician', 'Plumber', 'Painter'].map(skill => <button key={skill} type="button" onClick={() => { setQuickSkill(skill); navigate('/jobs?search=' + encodeURIComponent(skill)); }}>{skill}</button>)}
              </div>
            </div>

            <div className="ks-hero-art" aria-label="Illustration of local work connections">
              <div className="ks-art-orbit ks-art-orbit-one" />
              <div className="ks-art-orbit ks-art-orbit-two" />
              <div className="ks-art-ribbon ks-art-ribbon-back" />
              <div className="ks-art-ribbon ks-art-ribbon-front" />
              <div className="ks-art-core"><HeartHandshake size={58} strokeWidth={1.35} /></div>
              <div className="ks-float-card ks-float-card-job">
                <div className="ks-float-card-head"><span className="ks-mini-icon"><Zap size={16} /></span><span className="ks-mini-status"><i /> Nearby opportunity</span></div>
                <strong>Electrician needed</strong>
                <small><MapPin size={12} /> Sector 62 · 2.4 km away</small>
                <div className="ks-mini-card-bottom"><b>₹800 <small>/ day</small></b><span>View job <ArrowUpRight size={13} /></span></div>
              </div>
              <div className="ks-float-card ks-float-card-profile">
                <div className="ks-profile-avatar">RK</div>
                <div><strong>Ramesh Kumar</strong><small>Verified skill profile</small><span className="ks-profile-rating"><Sparkles size={12} /> Skilled professional</span></div>
                <BadgeCheck className="ks-profile-check" size={19} />
              </div>
              <div className="ks-art-caption"><span><span className="ks-caption-dot" /> Built for nearby connections</span><b>KAAMSETU / 01</b></div>
            </div>
          </div>
          <div className="ks-trust-strip">
            <div><ShieldCheck size={18} /><span>Clear work details</span></div>
            <div><Wallet size={18} /><span>Transparent pay</span></div>
            <div><BadgeCheck size={18} /><span>Skill-based profiles</span></div>
            <div><HeartHandshake size={18} /><span>Direct connections</span></div>
          </div>
        </section>

        <section className="ks-modern-section">
          <div className="ks-modern-section-head">
            <div><p className="ks-modern-kicker">EXPLORE OPPORTUNITIES</p><h2>Start with what<br />you do best.</h2><p>Choose a trade and discover work that matches your skills.</p></div>
            <Link to="/jobs" className="ks-modern-link">Explore all jobs <ArrowUpRight size={17} /></Link>
          </div>
          <div className="ks-trade-grid">
            {categories.map(category => { const Icon = category.icon; return <Link key={category.name} to={`/jobs?category=${encodeURIComponent(category.query)}`} className="ks-trade-card"><span className={`ks-trade-icon tone-${category.tone}`}><Icon size={22} /></span><span className="ks-trade-name">{category.name}</span><span className="ks-trade-detail">{category.detail}</span><span className="ks-trade-arrow"><ArrowUpRight size={17} /></span></Link>; })}
          </div>
        </section>

        <section className="ks-modern-how">
          <div className="ks-how-inner">
            <div className="ks-how-intro"><p className="ks-modern-kicker">A BETTER WAY TO GET STARTED</p><h2>From looking<br />to working.</h2><p>Everything starts with a simple connection. Take the next step when you are ready.</p></div>
            <div className="ks-how-list">
              {[{n:'01',icon:Search,title:'Explore nearby',desc:'Find jobs by skill, location and work details. Employers can browse public skill profiles.'},{n:'02',icon:Users,title:'Connect directly',desc:'Create an account when you are ready to apply, hire or contact someone.'},{n:'03',icon:BriefcaseBusiness,title:'Get things done',desc:'Agree on work and payment terms directly, then keep a record of progress and feedback.'}].map(step => {const Icon=step.icon;return <article className="ks-how-row" key={step.n}><span className="ks-how-number">{step.n}</span><span className="ks-how-icon"><Icon size={20}/></span><div><h3>{step.title}</h3><p>{step.desc}</p></div><ChevronRight className="ks-how-chevron" size={19}/></article>;})}
            </div>
          </div>
        </section>

        <section className="ks-modern-cta-wrap">
          <div className="ks-modern-cta"><div><p className="ks-modern-kicker">YOUR NEXT STEP STARTS HERE</p><h2>Good people.<br /><em>Honest work.</em></h2><p>Whether you are looking for your next opportunity or someone reliable for a job, start with KaamSetu.</p><div className="ks-cta-actions"><Link to="/jobs" className="ks-cta-primary">Find local work <ArrowUpRight size={17}/></Link><Link to="/workers" className="ks-cta-secondary">Hire skilled people <ArrowUpRight size={17}/></Link></div></div><div className="ks-cta-art"><div className="ks-cta-ring" /><HeartHandshake size={100} strokeWidth={1}/><span>काम पास में<br/>मौके सबके लिए</span></div></div>
        </section>
      </main>
      <Footer />
      <VoiceSearchModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} onConfirmPreferences={handleVoiceConfirmed} />
    </div>
  );
};
