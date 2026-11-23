import React, { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRegister } from '../services/api';
import { uploadProfileImage } from '../services/imageUpload';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
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

const getPasswordStrength = (value: string) => {
  const checks = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  const score = checks.filter(Boolean).length + (value.length >= 8 ? 1 : 0);
  return { checks, score: Math.min(score, 5), strong: value.length >= 8 && checks.filter(Boolean).length >= 3 };
};

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'employer' ? 'employer' : 'worker';
  const [role, setRole] = useState<'worker' | 'employer'>(initialRole);
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verifiedPhoneIdToken, setVerifiedPhoneIdToken] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const registrationRecaptcha = useRef<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();

  // Form states
  // Step 1: Personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = getPasswordStrength(password);
  const [preferredLanguage, setPreferredLanguage] = useState('Hindi');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Home Owner');
  const [industry, setIndustry] = useState('General household help');
  const [aboutCompany, setAboutCompany] = useState('');
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

  const normalizeIndianPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
    return digits;
  };

  const sendRegistrationOtp = async () => {
    setErrorMsg(null);
    const digits = normalizeIndianPhone(phone);
    if (digits.length !== 10) {
      setErrorMsg('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    try {
      if (!registrationRecaptcha.current) {
        registrationRecaptcha.current = new RecaptchaVerifier(firebaseAuth, 'register-firebase-recaptcha', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(firebaseAuth, '+91' + digits, registrationRecaptcha.current);
      setPhoneConfirmation(result);
    } catch (error: any) {
      registrationRecaptcha.current?.clear();
      registrationRecaptcha.current = null;
      const code = error?.code || '';
      setErrorMsg(code === 'auth/unauthorized-domain'
        ? 'This website domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.'
        : code === 'auth/operation-not-allowed'
          ? 'Phone authentication is disabled. Enable the Phone provider in Firebase Console.'
          : code === 'auth/too-many-requests' || code === 'auth/quota-exceeded'
            ? 'Firebase is limiting SMS requests. Wait and try again.'
            : code === 'auth/captcha-check-failed'
              ? 'The reCAPTCHA check failed. Refresh the page and try again.'
              : error?.message || 'Could not send SMS OTP. Check Firebase settings and try again.');
    }
  };

  const verifyRegistrationOtp = async () => {
    if (!phoneConfirmation || phoneOtp.trim().length !== 6) {
      setErrorMsg('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    try {
      const credential = await phoneConfirmation.confirm(phoneOtp.trim());
      const token = await credential.user.getIdToken(true);
      setVerifiedPhoneIdToken(token);
      setVerifiedPhone(normalizeIndianPhone(phone));
      setPhoneConfirmation(null);
      setPhoneOtp('');
      setErrorMsg(null);
    } catch (error: any) {
      setErrorMsg(error?.code === 'auth/invalid-verification-code'
        ? 'The OTP is incorrect. Check the SMS and try again.'
        : error?.code === 'auth/code-expired'
          ? 'The OTP expired. Request a new code.'
          : error?.message || 'Phone verification failed.');
    }
  };

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
    if (!name.trim()) { setErrorMsg('Enter your full name.'); return; }
    if (!phone.trim() && !email.trim()) { setErrorMsg('Enter an email address or mobile number.'); return; }
    if (phone.trim() && (!verifiedPhoneIdToken || verifiedPhone !== normalizeIndianPhone(phone))) {
      setErrorMsg('Verify your mobile number using SMS OTP before creating the account.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErrorMsg('Enter a valid email address.');
      return;
    }
    if (password.length < 8 || !passwordStrength.strong) {
      setErrorMsg('Use at least 8 characters and include at least 3 of: lowercase, uppercase, number, and special character.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        name,
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
        avatar,
        preferredLanguage,
        firebaseIdToken: verifiedPhoneIdToken || undefined,
        location: { state, city, area, pincode, coordinates: coords }
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
        payload.companyName = businessType === 'Home Owner' ? name + ' - Home Hiring' : companyName.trim();
        payload.businessType = businessType;
        payload.industry = industry;
        payload.aboutCompany = aboutCompany;
      }
      const result = await apiRegister(payload);
      if (result.success) {
        await signOut(firebaseAuth).catch(() => undefined);
        navigate(phone.trim() ? '/login?registered=phone' : '/login?registered=email');
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
              Step {step} of {role === 'worker' ? 6 : 3} • {role === 'worker' ? 'Worker Skill Passport Onboarding' : 'Employer Setup'}
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
              style={{ width: `${(step / (role === 'worker' ? 6 : 3)) * 100}%` }}
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
                  Mobile Number (Optional — SMS OTP verification required if entered)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="e.g. 9811002233"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setVerifiedPhoneIdToken(''); setVerifiedPhone(''); setPhoneConfirmation(null); setPhoneOtp(''); }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                />
                {phone.trim() && (
                  <div className="mt-2 space-y-2">
                    {verifiedPhoneIdToken && verifiedPhone === normalizeIndianPhone(phone) ? (
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mobile number verified</p>
                    ) : phoneConfirmation ? (
                      <>
                        <input aria-label="Registration SMS OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit SMS OTP" className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-white tracking-widest" />
                        <button type="button" onClick={verifyRegistrationOtp} disabled={phoneOtp.length !== 6} className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50">Verify mobile OTP</button>
                        <button type="button" onClick={() => { setPhoneConfirmation(null); setPhoneOtp(''); }} className="text-xs font-semibold text-brand-primary">Request a new code</button>
                      </>
                    ) : (
                      <button type="button" onClick={sendRegistrationOtp} className="w-full py-2.5 rounded-xl border border-brand-primary text-brand-primary text-xs font-bold">Send SMS OTP</button>
                    )}
                  </div>
                )}
                <div id="register-firebase-recaptcha" />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Email Address (Required if no mobile number; verify before email sign-in)
                </label>
                <input
                  type="email"
                  required={!phone.trim()}
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 pr-20 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-brand-primary">{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                {password && <div className="space-y-2" aria-live="polite">
                  <div className="flex gap-1">{[1,2,3,4,5].map(level => <div key={level} className={"h-1.5 flex-1 rounded-full " + (passwordStrength.score >= level ? (passwordStrength.strong ? 'bg-emerald-500' : passwordStrength.score >= 3 ? 'bg-amber-500' : 'bg-red-400') : 'bg-slate-200')} />)}</div>
                  <p className={"text-[11px] font-semibold " + (passwordStrength.strong ? 'text-emerald-700' : 'text-amber-700')}>{passwordStrength.strong ? 'Strong password' : 'Make your password stronger'}</p>
                  <ul className="grid grid-cols-2 gap-1 text-[10px] text-brand-muted">
                    <li className={password.length >= 8 ? 'text-emerald-700' : ''}>{password.length >= 8 ? '✓' : '○'} At least 8 characters</li>
                    <li className={/[a-z]/.test(password) ? 'text-emerald-700' : ''}>{/[a-z]/.test(password) ? '✓' : '○'} Lowercase letter</li>
                    <li className={/[A-Z]/.test(password) ? 'text-emerald-700' : ''}>{/[A-Z]/.test(password) ? '✓' : '○'} Uppercase letter</li>
                    <li className={/\d/.test(password) ? 'text-emerald-700' : ''}>{/\d/.test(password) ? '✓' : '○'} Number</li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-700' : ''}>{/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Special character</li>
                  </ul>
                </div>}
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

          {/* STEP 2: Worker skills or employer business type */}
          {step === 2 && (role === 'worker' ? (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-brand-dark border-b pb-2">Step 2: Select Your Skills & Trades</h3>
              <p className="text-xs text-brand-muted">Choose the work you can do. These skills become part of your Digital Skill Passport.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SKILLS_LIST.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${isSelected ? 'border-brand-primary bg-brand-primary-light text-brand-primary shadow-sm' : 'border-brand-border bg-slate-50 text-brand-dark hover:bg-slate-100'}`}>
                      <span>{skill}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-bold text-brand-dark border-b pb-2">Step 2: Who is hiring?</h3>
                <p className="text-xs text-brand-muted mt-2">Choose the type that best describes you. You do not need to add any worker skills.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'Home Owner', title: 'Homeowner', detail: 'I need someone for work at my home' },
                  { value: 'Individual Contractor', title: 'Individual / Contractor', detail: 'I hire workers for individual projects' },
                  { value: 'Small Business / Shop', title: 'Small business / Shop', detail: 'I hire for my shop or local business' },
                  { value: 'Construction Company', title: 'Company / Firm', detail: 'I represent a company or firm' },
                  { value: 'Facility Management', title: 'Facility management', detail: 'I manage buildings or multiple sites' }
                ].map(option => (
                  <button key={option.value} type="button" onClick={() => setBusinessType(option.value)}
                    className={`rounded-xl border p-4 text-left transition-colors ${businessType === option.value ? 'border-brand-primary bg-brand-primary-light' : 'border-brand-border bg-white hover:bg-slate-50'}`}>
                    <span className="block text-sm font-bold text-brand-dark">{option.title}</span>
                    <span className="block text-xs text-brand-muted mt-1">{option.detail}</span>
                  </button>
                ))}
              </div>
              {businessType !== 'Home Owner' && (
                <div className="space-y-3 rounded-xl border border-brand-border p-4">
                  <div>
                    <label className="text-xs font-semibold text-brand-dark block mb-1">Business / Firm name *</label>
                    <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Sharma Electrical Services" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-brand-dark block mb-1">Business activity</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)}
                      placeholder="e.g. Construction, retail, facility services" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-brand-dark block mb-1">About your business (optional)</label>
                    <textarea rows={2} value={aboutCompany} onChange={e => setAboutCompany(e.target.value)}
                      placeholder="Briefly describe your business or the work you hire for" className="w-full text-sm p-3 rounded-xl border border-brand-border bg-slate-50" />
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* STEP 3: Worker experience or employer hiring location */}
          {step === 3 && (role === 'worker' ? (
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
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-bold text-brand-dark border-b pb-2">Step 3: Where do you need workers?</h3>
                <p className="text-xs text-brand-muted mt-2">Set your home, shop or worksite area. You can add an exact pin later when posting a job.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-brand-dark block mb-1">State</label><input value={state} onChange={e=>setState(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"/></div>
                <div><label className="text-xs font-semibold text-brand-dark block mb-1">City</label><input value={city} onChange={e=>setCity(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"/></div>
                <div><label className="text-xs font-semibold text-brand-dark block mb-1">Area / Sector</label><input value={area} onChange={e=>setArea(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"/></div>
                <div><label className="text-xs font-semibold text-brand-dark block mb-1">Pincode</label><input value={pincode} onChange={e=>setPincode(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"/></div>
              </div>
              <button type="button" onClick={requestGeolocation} className="w-full py-3 rounded-xl border border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary-light flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4"/> Use my current location
              </button>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-brand-muted">
                <p className="font-semibold text-brand-dark">{businessType === 'Home Owner' ? 'Home hiring profile' : companyName}</p>
                <p>{area}, {city}, {state} · {pincode}</p>
              </div>
            </div>
          ))}
          {/* STEP 4: Location */}
          {role === 'worker' && step === 4 && (
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
          {role === 'worker' && step === 5 && (
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
          {role === 'worker' && step === 6 && (
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

            {step < (role === 'worker' ? 6 : 3) ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!name.trim() || (!phone.trim() && !email.trim()) || !password)) {
                    setErrorMsg('Enter your name, password, and either an email address or mobile number.');
                    return;
                  }
                  if (step === 1 && phone.trim() && (!verifiedPhoneIdToken || verifiedPhone !== normalizeIndianPhone(phone))) {
                    setErrorMsg('Verify your mobile number using SMS OTP before continuing.');
                    return;
                  }
                  if (step === 1 && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
                    setErrorMsg('Enter a valid email address.');
                    return;
                  }
                  if (role === 'employer' && step === 2 && businessType !== 'Home Owner' && !companyName.trim()) { setErrorMsg('Please enter your business or firm name.'); return; }
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
                    <span>{role === 'worker' ? 'Generate Skill Passport' : 'Create Hiring Account'}</span>
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
