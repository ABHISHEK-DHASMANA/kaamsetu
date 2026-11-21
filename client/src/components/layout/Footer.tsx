import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, MapPin, Phone, Mail, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark text-white pt-16 pb-12 border-t border-brand-primary-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Vision */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
                <span className="text-brand-accent text-2xl font-black">K</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                KAAM<span className="text-brand-accent">SETU</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              India's Hyperlocal Employment & Verified Skill Network. Connecting skilled tradespersons with nearby opportunities through Voice AI, Digital Skill Passports, and transparent wages.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-brand-accent">
                <Award className="w-3.5 h-3.5" />
                <span>"Kaam Paas Mein. Mauke Sabke Liye."</span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Popular Trades</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li><Link to="/jobs?category=Electrician" className="hover:text-brand-accent transition-colors">Electricians & Wiremen</Link></li>
              <li><Link to="/jobs?category=Plumber" className="hover:text-brand-accent transition-colors">Plumbers & Pipe Fitters</Link></li>
              <li><Link to="/jobs?category=Carpenter" className="hover:text-brand-accent transition-colors">Carpenters & Woodcrafters</Link></li>
              <li><Link to="/jobs?category=Painter" className="hover:text-brand-accent transition-colors">Painters & Polishers</Link></li>
              <li><Link to="/jobs?category=Mason" className="hover:text-brand-accent transition-colors">Masons & Construction Workers</Link></li>
              <li><Link to="/jobs?category=Mechanic" className="hover:text-brand-accent transition-colors">Mechanics & Technicians</Link></li>
              <li><Link to="/jobs?category=Cleaner" className="hover:text-brand-accent transition-colors">Deep Cleaners & Sanitation</Link></li>
            </ul>
          </div>

          {/* Hyperlocal NCR Coverage */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Active NCR Hubs</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-accent" /> Noida Sector 62 & 63 Hub</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-accent" /> Indirapuram & Vaibhav Khand</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-accent" /> Vaishali & Kaushambi</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-accent" /> Noida Sector 18 Commercial Hub</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-accent" /> Ghaziabad Industrial Area</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-brand-accent" /> Greater Noida Knowledge Park</li>
            </ul>
          </div>

          {/* Trust, Safety & Ethics */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Trust & Ethics</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li><Link to="/about#fair-wage" className="hover:text-brand-accent transition-colors">Fair Wage Transparency Charter</Link></li>
              <li><Link to="/about#skill-passport" className="hover:text-brand-accent transition-colors">Digital Skill Passport Standards</Link></li>
              <li><Link to="/about#verification" className="hover:text-brand-accent transition-colors">3-Tier Verification Process</Link></li>
              <li><Link to="/about#reporting" className="hover:text-brand-accent transition-colors">Report Exploitation / Wage Fraud</Link></li>
              <li className="pt-2">
                <span className="text-[11px] text-slate-400 block">Demonstration MVP Build for National Hackathon</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} KAAMSETU Technologies Inc. Built with</span>
            <Heart className="w-3.5 h-3.5 text-brand-accent fill-brand-accent" />
            <span>for Bharat's workforce.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-white">Privacy Policy</Link>
            <Link to="/about" className="hover:text-white">Terms of Employment</Link>
            <Link to="/about" className="hover:text-white">Grievance Redressal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
