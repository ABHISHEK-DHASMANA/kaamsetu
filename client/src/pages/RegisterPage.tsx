import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRegister } from '../services/api';
import { uploadProfileImage } from '../services/imageUpload';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  User,
  Phone,
  Mail,
  Lock,
  Wrench,
  Clock,
  MapPin,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const SKILLS_LIST = [
  'Electrician',
  'Wireman',
  'Plumber',
  'Pipe Fitter',
  'Carpenter',
  'Wood Polisher',
  'Painter',
  'Wall Putty Worker',
  'Mason',
  'Tile Layer',
  'Mechanic',
  'Two-Wheeler Technician',
  'Welder',
  'Cleaner',
  'Delivery'
];

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'employer' ? 'employer' : 'worker';
  const [role, setRole] = useState<'worker' | 'employer'>(initialRole);
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  // Step 1: Personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('Hindi');
  const [companyName, setCompanyName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Step 2: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Electrician']);

  // Step 3: Experience
  const [experienceLevel, setExperienceLevel] = useState('1–3 years');

  // Step 4: Location
  const [state, setState] = useState('Uttar Pradesh');
  const [city, setCity] = useState('Noida');
  const [area, setArea] = useState('Sector 62');
  const [pincode, setPincode] = useState('201309');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6280, lng: 77.3649 });

  // Step 5: Preferences
  const [dailyWage, setDailyWage] = useState(800);
  const [monthlyWage, setMonthlyWage] = useState(22000);
  const [jobType, setJobType] = useState<'Daily Wage' | 'Full-time' | 'Part-time' | 'Contract'>('Daily Wage');
  const [availableDates, setAvailableDates] = useState('Immediate');
  const [maxDistanceKm, setMaxDistanceKm] = useState(8);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter(s => s !== skill));
      }
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4))
          });
          alert(`Location synced: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          alert('GPS permission not granted. Using default Noida Sector 62 coordinates.');
        }
      );
    }
  };

  const handleSubmitRegistration = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name,
        phone,
        email,
        password,
        role,
        avatar,
        preferredLanguage,
        location: {
          state,
          city,
          area,
          pincode,
          coordinates: coords
        }
      };

      if (role === 'worker') {
        payload.skills = selectedSkills;
        payload.experienceLevel = experienceLevel;
        payload.preferences = {
          expectedDailyWage: Number(dailyWage),
          expectedMonthlyWage: Number(monthlyWage),
          jobType,
          availableDates,
          maxDistanceKm: Number(maxDistanceKm)
        };
      } else {
        payload.companyName = companyName || `${name} Services`;
      }

      const res = await apiRegister(payload);
      if (res.success) {
        // Auto login with credentials
        await login(phone, password);
        navigate(role === 'worker' ? '/worker/dashboard' : '/employer/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-3xl border border-brand-border shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Step {step} of 6 • {role === 'worker' ? 'Worker Skill Passport Onboarding' : 'Employer Profile Setup'}
            </span>
            <h1 className="text-2xl font-black text-brand-dark tracking-tight">
              {role === 'worker' ? 'Create Your Digital Identity' : 'Register Your Hiring Business'}
            </h1>
          </div>

          {/* Role toggle button */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setRole('worker'); setStep(1); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                role === 'worker' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              I am a Worker / Artisan
            </button>
            <button
              type="button"
              onClick={() => { setRole('employer'); setStep(1); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                role === 'employer' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              I am an Employer / Contractor
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">
                Step 1: Personal & Contact Information
              </h3>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                />
              </div>

              <div className="rounded-2xl border border-brand-border bg-slate-50 p-4 space-y-2">
                <label className="text-xs font-semibold text-brand-dark block">Profile photo (optional)</label>
                <div className="flex items-center gap-3">
                  <img src={avatar || "https://ui-avatars.com/api/?name=KaamSetu"} alt="Profile preview" className="w-14 h-14 rounded-full object-cover border" />
                  <div><input type="file" accept="image/*" disabled={isUploadingAvatar} onChange={async e => { const file=e.target.files?.[0]; if(!file)return; setIsUploadingAvatar(true); try { setAvatar(await uploadProfileImage(file)); } catch(err:any) { setErrorMsg(err.message || "Image upload failed."); } finally { setIsUploadingAvatar(false); e.currentTarget.value=""; } }} className="text-xs max-w-full" />
                    <p className="text-[11px] text-brand-muted">{isUploadingAvatar ? "Uploading..." : "Worker / employer profile image · up to 5 MB"}</p></div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Mobile Number (Used for SMS & OTP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9811002233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                />
              </div>

              {role === 'employer' && (
                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">
                    Company / Firm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Electrical Services"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. ramesh.kumar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Set Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Preferred Language for Voice & App
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                >
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="English">English</option>
                  <option value="Bhojpuri">भोजपुरी (Bhojpuri)</option>
                  <option value="Bengali">বাংলা (Bengali)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Skills Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">
                Step 2: Select Your Skills & Trades
              </h3>
              <p className="text-xs text-brand-muted">
                Choose all trades you are proficient in. These will be logged onto your Digital Skill Passport.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SKILLS_LIST.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary-light text-brand-primary shadow-sm'
                          : 'border-brand-border bg-slate-50 text-brand-dark hover:bg-slate-100'
                      }`}
                    >
                      <span>{skill}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Experience */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">
                Step 3: Trade Experience Level
              </h3>
              <p className="text-xs text-brand-muted">
                Select your practical working track record. This helps employers match suitable wage tiers.
              </p>

              <div className="space-y-2">
                {['Fresher', 'Less than 1 year', '1–3 years', '3–5 years', '5+ years'].map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setExperienceLevel(exp)}
                    className={`w-full p-3.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                      experienceLevel === exp
                        ? 'border-brand-primary bg-brand-primary-light text-brand-primary shadow-sm'
                        : 'border-brand-border bg-slate-50 text-brand-dark hover:bg-slate-100'
                    }`}
                  >
                    <span>{exp} Experience</span>
                    {experienceLevel === exp && <CheckCircle2 className="w-4 h-4 text-brand-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Location */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">
                Step 4: Location & Work Vicinity
              </h3>
              <p className="text-xs text-brand-muted">
                KAAMSETU uses hyperlocal matching so you can find jobs close to home.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">Area / Sector</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={requestGeolocation}
                  className="w-full py-2.5 rounded-xl border border-brand-primary text-brand-primary text-xs font-bold hover:bg-brand-primary-light transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-brand-primary" />
                  <span>Use Device GPS to Pin Exact Hyperlocal Coordinates</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Work Preferences */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">
                Step 5: Wage Expectations & Travel Preferences
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">
                    Expected Daily Wage (₹)
                  </label>
                  <input
                    type="number"
                    value={dailyWage}
                    onChange={(e) => setDailyWage(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-dark block mb-1">
                    Max Travel Distance (km)
                  </label>
                  <input
                    type="number"
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Availability Timeline
                </label>
                <select
                  value={availableDates}
                  onChange={(e) => setAvailableDates(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                >
                  <option value="Immediate">Immediate (Starting Tomorrow)</option>
                  <option value="In 2 Days">In 2–3 Days</option>
                  <option value="Next Week">From Next Week</option>
                  <option value="Weekends Only">Weekends Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Preferred Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                >
                  <option value="Daily Wage">Daily Wage (Shift End Payment)</option>
                  <option value="Contract">Fixed Task / Contract</option>
                  <option value="Full-time">Full-time Monthly</option>
                  <option value="Part-time">Part-time Hourly</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 6: Profile Confirmation */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">
                Step 6: Confirm & Generate Digital Skill Passport
              </h3>

              <div className="p-4 rounded-2xl bg-brand-primary-light/50 border border-brand-primary/20 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-brand-primary/10">
                  <span className="text-brand-muted">Name:</span>
                  <span className="font-bold text-brand-dark">{name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-primary/10">
                  <span className="text-brand-muted">Phone:</span>
                  <span className="font-bold text-brand-dark">{phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-primary/10">
                  <span className="text-brand-muted">Primary Skills:</span>
                  <span className="font-bold text-brand-dark">{selectedSkills.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-primary/10">
                  <span className="text-brand-muted">Experience:</span>
                  <span className="font-bold text-brand-dark">{experienceLevel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-primary/10">
                  <span className="text-brand-muted">Location:</span>
                  <span className="font-bold text-brand-dark">{area}, {city}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-brand-muted">Expected Rate:</span>
                  <span className="font-bold text-brand-primary">₹{dailyWage} / day</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-brand-muted">
                By completing registration, your Digital Skill Passport ID will be generated and made verifiable across the KAAMSETU network.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-dark hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!name || !phone || !password)) {
                    setErrorMsg('Please complete all required fields.');
                    return;
                  }
                  setErrorMsg(null);
                  setStep(step + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all flex items-center gap-1.5 shadow-md shadow-brand-primary/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all flex items-center gap-1.5 shadow-md shadow-brand-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Generate Skill Passport</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
