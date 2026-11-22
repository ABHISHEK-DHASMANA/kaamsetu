import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiCreateJob } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  IndianRupee,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';

export const EmployerPostJob: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { profile } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electrician');
  const [description, setDescription] = useState('');
  const [requiredExperience, setRequiredExperience] = useState('1–3 years');
  const [vacancies, setVacancies] = useState(1);
  const [offeredWage, setOfferedWage] = useState(850);
  const [wageType, setWageType] = useState<'daily' | 'monthly' | 'task'>('daily');
  const [workDuration, setWorkDuration] = useState('5 Days');
  const [paymentFrequency, setPaymentFrequency] = useState('Daily at shift end');
  const [paymentTerms, setPaymentTerms] = useState('Direct UPI / Cash payment upon shift completion without delay');
  const [deductions, setDeductions] = useState('None. 100% agreed wage.');
  const [overtimeTerms, setOvertimeTerms] = useState('₹140/hour overtime compensation for work beyond 8 hours');
  const [area, setArea] = useState('Sector 63');
  const [city, setCity] = useState('Noida');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [locationPinConfirmed, setLocationPinConfirmed] = useState(false);
  const [hiringRadiusKm, setHiringRadiusKm] = useState(profile?.maxHiringDistanceKm || 10);
  const [workTimings, setWorkTimings] = useState('9:00 AM - 6:00 PM (1 hr lunch)');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Fair Wage Warnings Check
  const getWageWarnings = () => {
    const warnings: string[] = [];
    if (offeredWage < 600 && wageType === 'daily') {
      warnings.push("Wage is below KaamSetu's illustrative daily-wage reference (₹600). This is not a statutory minimum.");
    }
    if (!paymentTerms || paymentTerms.length < 10) {
      warnings.push('Payment terms are vague. Specify exactly when and how the worker will receive payment.');
    }
    if (!deductions || deductions.toLowerCase().includes('cut') || deductions.toLowerCase().includes('commission')) {
      warnings.push('Arbitrary deductions violate the KAAMSETU Fair Wage Charter.');
    }
    return warnings;
  };

  const wageWarnings = getWageWarnings();

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !offeredWage || !description) {
      showToast('Please fill all mandatory job fields.', 'error');
      return;
    }

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);
    if (!locationPinConfirmed || !coordinates.lat || !coordinates.lng || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      showToast('Confirm the actual worksite pin using GPS or enter valid map coordinates before publishing.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiCreateJob({
        title,
        category,
        requiredSkills: [category],
        description,
        requiredExperience,
        vacancies: Number(vacancies),
        offeredWage: Number(offeredWage),
        wageType,
        workDuration,
        paymentFrequency,
        paymentTerms,
        deductions,
        overtimeTerms,
        hiringRadiusKm: Number(hiringRadiusKm),
        location: {
          address: `${area}, ${city}`,
          area,
          city,
          state: 'Uttar Pradesh',
          pincode: '201301',
          coordinates: { lat, lng },
          pinConfirmed: true
        },
        workTimings
      });

      if (res.success) {
        showToast('Job opening published successfully with Fair Wage transparency!', 'success');
        navigate('/employer/manage-jobs');
      }
    } catch (err: any) {
      showToast(err.message || 'Error posting job.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title={profile?.businessType === "Home Owner" ? "Post a Home Job" : "Post a Job Opening"}
      subtitle="Tell local workers what help you need and what you will pay"
    >
      <div className="max-w-3xl bg-white rounded-3xl border border-brand-border shadow-sm p-6 sm:p-8 space-y-6">
        <form onSubmit={handlePostJob} className="space-y-6">
          {/* Section 1: Trade & Requirements */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-primary" />
              <span>1. Trade & Scope of Work</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Need a plumber to fix a kitchen tap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Trade Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark font-semibold"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Painter">Painter</option>
                  <option value="Mason">Mason / Bricklayer</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Cleaner">Deep Cleaner</option>
                  <option value="Welder">Welder</option>
                  <option value="Delivery">Delivery Runner</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Experience Required</label>
                <select
                  value={requiredExperience}
                  onChange={(e) => setRequiredExperience(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark"
                >
                  <option value="Fresher">Fresher / Any</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1–3 years">1–3 years</option>
                  <option value="3–5 years">3–5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Workers Needed</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={vacancies}
                  onChange={(e) => setVacancies(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2"><label className="text-xs font-bold">Confirm the actual worksite pin <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => { if (!navigator.geolocation) { showToast("Location is not supported.", "error"); return; } navigator.geolocation.getCurrentPosition(pos => { setCoordinates({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }); setLocationPinConfirmed(true); }, () => showToast("Location permission was not granted. Enter coordinates manually.", "error"), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); }} className="text-xs font-bold text-brand-primary">Use current location</button>
              </div>
              <p className="text-[11px] text-brand-muted">Use GPS while at the worksite, or enter its coordinates from a map. Do not use your home location if the job is elsewhere.</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-semibold text-brand-muted">Latitude<input type="number" step="any" min="-90" max="90" value={coordinates.lat} onChange={e => { setCoordinates(v => ({ ...v, lat: e.target.value })); setLocationPinConfirmed(false); }} placeholder="28.6..." className="mt-1 w-full rounded-lg border border-brand-border bg-white p-2 text-xs text-brand-dark"/></label>
                <label className="text-[11px] font-semibold text-brand-muted">Longitude<input type="number" step="any" min="-180" max="180" value={coordinates.lng} onChange={e => { setCoordinates(v => ({ ...v, lng: e.target.value })); setLocationPinConfirmed(false); }} placeholder="77.3..." className="mt-1 w-full rounded-lg border border-brand-border bg-white p-2 text-xs text-brand-dark"/></label>
              </div>
              {coordinates.lat && coordinates.lng && <a target="_blank" rel="noreferrer" href={"https://www.openstreetmap.org/?mlat=" + coordinates.lat + "&mlon=" + coordinates.lng + "#map=16/" + coordinates.lat + "/" + coordinates.lng} className="text-xs text-brand-primary underline">Preview this pin on OpenStreetMap</a>}
              <label className="flex items-center gap-2 text-[11px] font-semibold text-brand-dark"><input type="checkbox" checked={locationPinConfirmed} disabled={!coordinates.lat || !coordinates.lng} onChange={e => setLocationPinConfirmed(e.target.checked)} /> I confirm these coordinates are the actual worksite</label>
              <div className="text-[11px] font-semibold">{locationPinConfirmed ? "✓ Worksite pin confirmed" : "Pin not confirmed — use GPS or confirm the entered coordinates before publishing."}</div>
              <div><div className="flex justify-between text-xs font-bold"><span>Maximum worker distance for this job</span><span>{hiringRadiusKm} km</span></div>
                <input type="range" min="1" max="50" value={hiringRadiusKm} onChange={e => setHiringRadiusKm(Number(e.target.value))} className="w-full accent-brand-primary" /></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">
                Detailed Work Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe the work clearly, where it is needed, and anything the worker should bring. Avoid sharing private details publicly."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Fair Wage Transparency */}
          <div className="space-y-4 pt-4 border-t border-brand-border">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-brand-secondary" />
                <span>2. Fair Wage & Transparent Compensation</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                Transparency checklist
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">
                  Offered Wage (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={offeredWage}
                  onChange={(e) => setOfferedWage(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-primary font-black text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Wage Basis</label>
                <select
                  value={wageType}
                  onChange={(e) => setWageType(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 font-semibold"
                >
                  <option value="daily">Per Day (Daily Shift)</option>
                  <option value="monthly">Monthly Salary</option>
                  <option value="task">Fixed Contract / Task</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Work Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 5 Days / 2 Weeks"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Disbursement Timing</label>
                <select
                  value={paymentFrequency}
                  onChange={(e) => setPaymentFrequency(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 font-semibold text-brand-secondary"
                >
                  <option value="Daily at shift end">Daily at shift end (Recommended for trust)</option>
                  <option value="Weekly every Saturday">Weekly every Saturday</option>
                  <option value="Upon Job Completion">Upon Milestone / Job Completion</option>
                  <option value="Monthly on 1st">Monthly on 1st</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Shift Timings</label>
                <input
                  type="text"
                  value={workTimings}
                  onChange={(e) => setWorkTimings(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Payment Method & Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Deductions Policy</label>
                <input
                  type="text"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Overtime Terms</label>
                <input
                  type="text"
                  value={overtimeTerms}
                  onChange={(e) => setOvertimeTerms(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 text-brand-dark"
                />
              </div>
            </div>

            {/* Dynamic Fair Wage Warnings Box */}
            {wageWarnings.length > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Fair Wage Transparency Notice:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5">
                  {wageWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transparency checklist complete. Pay timing, method and deductions are listed; this is not a legal compliance certification.</span>
              </div>
            )}
          </div>

          {/* Section 3: Work Site Location */}
          <div className="space-y-4 pt-4 border-t border-brand-border">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-primary" />
              <span>3. Work Location & Proximity</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="text-xs font-semibold text-brand-dark block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-brand-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-brand-accent" />
                  <span>Publish Job Listing & Begin Matching Workers</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
