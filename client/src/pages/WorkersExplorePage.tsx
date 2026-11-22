import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { apiGetWorkers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Users, Briefcase, ShieldCheck } from 'lucide-react';

type PublicWorker = {
  _id: string; fullName: string; avatar?: string; primarySkill: string; experienceYearsNum: number;
  skills?: Array<{ skillName: string }>; location?: { city?: string; area?: string };
  skillPassport?: { passportId?: string; rating?: number | null; reviewsCount?: number; completedJobsCount?: number }; bio?: string;
};

export const WorkersExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [workers, setWorkers] = useState<PublicWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState('');
  const [area, setArea] = useState('');
  const loadWorkers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (skill.trim()) params.skill = skill.trim();
      if (area.trim()) params.area = area.trim();
      const result = await apiGetWorkers(params);
      if (result.success) setWorkers(result.workers || []);
    } catch (error) {
      console.error('Unable to load public worker directory', error);
      setWorkers([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { void loadWorkers(); }, []);
  const hire = () => {
    if (!isAuthenticated) navigate('/login?role=employer');
    else if (user?.role === 'employer' || user?.role === 'admin') navigate('/employer/post-job');
    else navigate('/register?role=employer');
  };
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!isAuthenticated && <div className="rounded-2xl border border-brand-secondary/20 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-brand-dark">Explore local workers without signing in.</p><p className="text-xs text-brand-muted mt-1">Login or create an employer account when you're ready to hire.</p></div>
          <div className="flex gap-2"><button onClick={() => navigate('/login?role=employer')} className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold">Login</button><button onClick={() => navigate('/register?role=employer')} className="px-4 py-2 rounded-xl border border-brand-border text-brand-dark text-xs font-bold">Create account</button></div>
        </div>}
        <section className="bg-white border border-brand-border rounded-3xl p-5 sm:p-7 space-y-4">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary">KaamSetu worker directory</p><h1 className="text-2xl font-black text-brand-dark mt-1">Find skilled workers near your worksite</h1><p className="text-xs text-brand-muted mt-2">Browse public skill profiles. Personal contact details remain private.</p></div>
          <form onSubmit={e => { e.preventDefault(); void loadWorkers(); }} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative"><Search className="w-4 h-4 absolute left-3 top-3 text-brand-muted" /><input value={skill} onChange={e => setSkill(e.target.value)} placeholder="Skill (electrician, plumber...)" className="w-full rounded-xl border border-brand-border bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-brand-dark" /></div>
            <div className="sm:col-span-5 relative"><MapPin className="w-4 h-4 absolute left-3 top-3 text-brand-muted" /><input value={area} onChange={e => setArea(e.target.value)} placeholder="Area or city" className="w-full rounded-xl border border-brand-border bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-brand-dark" /></div>
            <button className="sm:col-span-2 rounded-xl bg-brand-primary text-white text-xs font-bold py-2.5">Search workers</button>
          </form>
        </section>
        {loading ? <div className="p-12 text-center text-sm text-brand-muted">Loading worker profiles…</div> : workers.length === 0 ? (
          <div className="rounded-3xl border border-brand-border bg-white p-12 text-center space-y-2"><Users className="w-8 h-8 mx-auto text-brand-muted" /><h2 className="font-bold text-brand-dark">No workers found</h2><p className="text-xs text-brand-muted">Try another skill or a wider location.</p><button onClick={() => { setSkill(''); setArea(''); void apiGetWorkers().then(r => setWorkers(r.workers || [])); }} className="text-xs font-bold text-brand-primary">Show all workers</button></div>
        ) : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{workers.map(worker => (
          <article key={worker._id} className="rounded-3xl border border-brand-border bg-white p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-brand-primary-light overflow-hidden flex items-center justify-center text-brand-primary font-black">{worker.avatar ? <img src={worker.avatar} alt="" className="w-full h-full object-cover" /> : worker.fullName?.charAt(0) || 'W'}</div><div className="min-w-0"><h2 className="font-bold text-brand-dark truncate">{worker.fullName}</h2><p className="text-xs text-brand-secondary font-semibold">{worker.primarySkill || 'Skilled worker'}</p></div></div>
            <div className="flex flex-wrap gap-2 text-[11px] text-brand-muted"><span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {worker.experienceYearsNum || 0} years experience</span><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {[worker.location?.area, worker.location?.city].filter(Boolean).join(', ') || 'Location not shared'}</span></div>
            <div className="text-xs font-semibold text-brand-dark">
              {worker.skillPassport?.reviewsCount ? `★ ${Number(worker.skillPassport.rating || 0).toFixed(1)}/5 · ${worker.skillPassport.reviewsCount} employer review(s)` : 'New to KaamSetu · No ratings yet'}
              {typeof worker.skillPassport?.completedJobsCount === 'number' ? ` · ${worker.skillPassport.completedJobsCount} completed job(s)` : ''}
            </div>
            {worker.bio && <p className="text-xs text-brand-muted line-clamp-3">{worker.bio}</p>}
            {worker.skills?.length ? <div className="flex flex-wrap gap-1.5">{worker.skills.slice(0,4).map((s,i) => <span key={i} className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] text-slate-600">{s.skillName}</span>)}</div> : null}
            <div className="mt-auto pt-3 border-t border-brand-border flex items-center justify-between gap-2">{worker.skillPassport?.passportId ? <Link to={'/passport/' + worker.skillPassport.passportId} className="text-xs font-semibold text-brand-secondary hover:underline inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> View profile</Link> : <span className="text-[11px] text-brand-muted">Public profile</span>}<button onClick={hire} className="px-3 py-2 rounded-xl bg-brand-primary text-white text-[11px] font-bold">Hire / Post work</button></div>
          </article>
        ))}</div>}
      </main>
      <Footer />
    </div>
  );
};
