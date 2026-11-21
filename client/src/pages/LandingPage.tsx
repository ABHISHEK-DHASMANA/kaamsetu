import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { VoiceSearchModal } from '../components/voice/VoiceSearchModal';
import { ExtractedJobPreferences } from '../types';
import {
  Mic,
  Search,
  MapPin,
  ShieldCheck,
  Award,
  IndianRupee,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  Star,
  ChevronRight,
  TrendingUp,
  Clock,
  Smartphone
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleVoiceConfirmed = (prefs: ExtractedJobPreferences) => {
    navigate(`/jobs?search=${encodeURIComponent(prefs.skill)}&area=${encodeURIComponent(prefs.location)}&wage=${prefs.expected_wage}`);
  };

  const categories = [
    { name: 'Electrician', icon: '⚡', count: 'Browse jobs', query: 'Electrician' },
    { name: 'Plumber', icon: '🔧', count: 'Browse jobs', query: 'Plumber' },
    { name: 'Carpenter', icon: '🪚', count: 'Browse jobs', query: 'Carpenter' },
    { name: 'Painter', icon: '🎨', count: 'Browse jobs', query: 'Painter' },
    { name: 'Construction', icon: '🧱', count: 'Browse jobs', query: 'Mason' },
    { name: 'Mechanic', icon: '⚙️', count: 'Browse jobs', query: 'Mechanic' },
    { name: 'Delivery', icon: '🛵', count: 'Browse jobs', query: 'Delivery' },
    { name: 'Cleaning', icon: '✨', count: 'Browse jobs', query: 'Cleaner' }
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-primary-light/60 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Top Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary-light border border-brand-primary/20 text-xs font-semibold text-brand-primary">
                <span className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                <span>Local work. Real people. Better connections.</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-dark tracking-tight leading-[1.15]">
                Good work should be <br />
                <span className="text-brand-secondary relative">
                  closer to home.
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-brand-accent/40" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,8 Q50,0 100,8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-brand-muted leading-relaxed max-w-2xl font-normal">
                Find nearby jobs that fit your trade and schedule. Compare the pay and distance, then connect directly with the person hiring.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/jobs"
                  className="px-6 py-3.5 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/25 flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-brand-accent" />
                  <span>Find Work</span>
                </Link>
                <Link
                  to="/register?role=employer"
                  className="px-6 py-3.5 rounded-2xl bg-white border border-brand-border text-brand-dark text-sm font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4 text-brand-secondary" />
                  <span>Hire Workers</span>
                </Link>
              </div>

              {/* Voice-to-Work Banner Hero Bar */}
              <div className="mt-8 p-4 sm:p-5 rounded-3xl bg-white border border-brand-border shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand-accent animate-ping" />
                    <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">Find work by speaking</span>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-secondary bg-brand-secondary-light px-2.5 py-0.5 rounded-full">
                    Hindi & English
                  </span>
                </div>

                <div
                  onClick={() => setVoiceModalOpen(true)}
                  className="mt-2 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-brand-primary/20">
                      <Mic className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-bold text-brand-dark truncate">
                        "Mujhe kal electrician ka kaam chahiye, mere aas paas."
                      </div>
                      <div className="text-[11px] text-brand-muted truncate">
                        Tap the microphone and tell us what kind of work you need
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-primary bg-white px-3 py-1.5 rounded-xl border border-brand-border shadow-sm flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    Speak your search
                  </span>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl bg-white border-2 border-brand-primary/10 shadow-card-hover p-6 overflow-hidden">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 border-b border-brand-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold">
                      K
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-dark">A nearby work example</div>
                      <div className="text-[10px] text-brand-secondary font-medium">Example location • distance varies</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Example listing
                  </span>
                </div>

                {/* Worker Preview Card */}
                <div className="mt-4 p-3.5 rounded-2xl bg-brand-primary-light/50 border border-brand-primary/10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 border border-white shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                      alt="Ramesh Kumar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-brand-dark">Ramesh Kumar</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-secondary" />
                    </div>
                    <div className="text-[11px] text-brand-muted">Electrician • 3 Yrs Exp</div>
                    <div className="text-[10px] font-bold text-brand-secondary mt-0.5">
                      Work history & skills
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-brand-primary">94%</span>
                    <div className="text-[9px] text-brand-muted uppercase font-bold">Trust</div>
                  </div>
                </div>

                {/* Simulated Job Match Card */}
                <div className="mt-4 p-4 rounded-2xl border border-brand-border shadow-sm bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      Illustrative match
                    </span>
                    <span className="text-xs font-extrabold text-brand-primary">₹900 / Day</span>
                  </div>
                  <div className="text-xs font-bold text-brand-dark">Commercial Electrician Required</div>
                  <div className="text-[11px] text-brand-muted">Sharma Electrical Services • Sector 63</div>
                  
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-sky-700 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 2.1 km away
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Pay agreed directly
                    </span>
                  </div>
                </div>

                {/* Mobile App Experience simulation pill */}
                <div className="mt-4 text-center">
                  <span className="text-[11px] text-brand-muted flex items-center justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-brand-primary" />
                    Accessible across mobile and desktop
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A. How It Works Section */}
      <section className="py-16 bg-white border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">Simple 4-Step Process</span>
            <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight mt-1">
              How KAAMSETU Connects You
            </h2>
            <p className="text-sm text-brand-muted mt-2">
              A straightforward way for workers and local employers to find each other.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                desc: 'Add your skills, trade experience, expected wage, and preferred travel radius.'
              },
              {
                step: '02',
                title: 'Discover Nearby Jobs',
                desc: 'Search in Hindi or English and narrow results by location, pay and availability.'
              },
              {
                step: '03',
                title: 'Connect With Employers',
                desc: 'Apply to a listing and share your skills and work history with the employer.'
              },
              {
                step: '04',
                title: 'Get Hired & Paid Fairly',
                desc: 'Agree on the work and payment directly with the employer. Build a record of completed work.'
              }
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-brand-bg border border-brand-border hover:shadow-soft transition-all relative group"
              >
                <div className="text-3xl font-black text-brand-primary/20 group-hover:text-brand-accent transition-colors">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-brand-dark mt-2 mb-1.5">{step.title}</h3>
                <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B. Popular Categories Section */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">Skilled Trades</span>
              <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight mt-1">
                Explore Popular Categories
              </h2>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-primary-dark"
            >
              <span>View All 20+ Job Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/jobs?category=${cat.query}`}
                className="p-5 rounded-2xl bg-white border border-brand-border hover:border-brand-primary hover:shadow-card transition-all text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div className="text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors">
                  {cat.name}
                </div>
                <div className="text-[11px] text-brand-muted mt-0.5">{cat.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* C. Why KAAMSETU Section */}
      <section className="py-16 bg-white border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">What makes KaamSetu useful</span>
            <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight mt-1">
              Why KAAMSETU is Different
            </h2>
            <p className="text-sm text-brand-muted mt-2">
              Practical tools for finding nearby work, checking job details and building a record of your skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <MapPin className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">Jobs closer to home</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Matches you with contractors and households within 2–10 km to reduce travel time, commute fatigue, and transportation expenses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <Mic className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">Search in your language</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Break literacy barriers. Speak naturally in Hindi or English, and our AI extracts your trade, preferred sector, and desired daily rate.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <Award className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">Digital Skill Passport</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Your verifiable work identity. Builds proof of work, employer endorsements, and transparent trust score with shareable QR codes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">Fair Wage Transparency</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Every job specifies exact offered salary, payment terms, and overtime guidelines. Clear warnings flag unfair or missing wage terms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">Trust-Based Verified Hiring</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                3-tier identity and contact verification for workers and employers prevents fraudulent listings and ensures dignified treatment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-base font-bold text-brand-dark">Relevant matches, clearly explained</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Weighted algorithmic scoring across skill fit (40%), location (25%), wage (20%), and availability (15%) with transparent explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* D. Statistics Section (Clearly labelled demonstration figures) */}
      <section className="py-14 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
              Platform Demonstration Metrics (Delhi-NCR Pilot Hubs)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-brand-accent">1,240+</div>
              <div className="text-xs text-slate-300 mt-1">Verified Artisans Onboarded</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-brand-accent">₹870</div>
              <div className="text-xs text-slate-300 mt-1">Average Daily Wage Earned</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-brand-accent">94%</div>
              <div className="text-xs text-slate-300 mt-1">On-Time Payment Fulfillment</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-brand-accent">2.4 km</div>
              <div className="text-xs text-slate-300 mt-1">Average Proximity Distance</div>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-slate-400">
            * Demonstration figures representing targeted pilot impact metrics across Noida, Ghaziabad, and East Delhi clusters.
          </div>
        </div>
      </section>

      {/* E. Testimonials Section (Clearly labelled sample testimonials) */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">Voices of Bharat</span>
            <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight mt-1">
              Sample Worker & Employer Stories
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Representing real user journeys in our hyperlocal demonstration testbed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-brand-dark leading-relaxed italic font-normal">
                  "Pehle thekedaar 30% cut rakh leta tha aur paise do hafte late deta tha. KAAMSETU par seedha Sharma ji se mila, Sector 63 mein kaam kiya aur roz shaam ko ₹900 UPI se mila. Meri skill passport bhi ban gayi!"
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                    alt="Ramesh Kumar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-dark">Ramesh Kumar</div>
                  <div className="text-[11px] text-brand-muted">Electrician • Noida Sector 62</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-brand-dark leading-relaxed italic font-normal">
                  "For electrical maintenance at our corporate site, finding reliable wiremen used to take days of phone calls. On KAAMSETU, Ramesh's verified passport and 94% trust score showed he was genuine. He arrived in 25 minutes."
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
                    alt="Sunil Sharma"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-dark">Sunil Sharma</div>
                  <div className="text-[11px] text-brand-muted">Proprietor, Sharma Electrical Services</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-brand-dark leading-relaxed italic font-normal">
                  "Main padh nahi sakti, lekin mic daba kar Hindi mein bola ki mujhe Indirapuram mein deep cleaning ka kaam chahiye. Turant do society ke kaam mil gaye. Voice feature ne meri zindagi aasan kar di."
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
                    alt="Sunita Devi"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-dark">Sunita Devi</div>
                  <div className="text-[11px] text-brand-muted">Sanitation Worker • Indirapuram</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Your next job could be nearby.
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Create a profile to find local work, or post a job if you need skilled help.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-2xl bg-brand-accent text-brand-dark text-xs font-extrabold hover:bg-amber-400 transition-all shadow-lg shadow-brand-accent/30"
            >
              Create Free Worker Profile
            </Link>
            <Link
              to="/register?role=employer"
              className="px-6 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all"
            >
              Post a Job as Employer
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onConfirmPreferences={handleVoiceConfirmed}
      />
    </div>
  );
};
