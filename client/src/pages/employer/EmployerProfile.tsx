import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetEmployerProfile, apiUpdateEmployerProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { EmployerProfile } from '../../types';
import { Building2, Phone, Mail, MapPin, ShieldCheck, Save, Award, Camera, Star } from 'lucide-react';
import { uploadProfileImage } from '../../services/imageUpload';
import { LocationPicker } from '../../components/maps/LocationPicker';
import { AccountDeletionSection } from '../../components/profile/AccountDeletionSection';

export const EmployerProfilePage: React.FC = () => {
  const { user, profile, updateLocalProfile } = useAuth();
  const { showToast } = useNotifications();

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Small Business / Shop');
  const [verificationStatus, setVerificationStatus] = useState('Registered');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [gstOrGovtId, setGstOrGovtId] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [avatar, setAvatar] = useState('');
  const [maxHiringDistanceKm, setMaxHiringDistanceKm] = useState(10);
  const [isUploading, setIsUploading] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 28.6271, lng: 77.3820 });
  const [isSaving, setIsSaving] = useState(false);
  const [employerRating, setEmployerRating] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [completedHiresCount, setCompletedHiresCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiGetEmployerProfile();
        if (res.success && res.profile) {
          const ep = res.profile;
          setCompanyName(ep.companyName);
          setEmployerRating(typeof ep.rating === 'number' ? ep.rating : null);
          setReviewsCount(Number(ep.reviewsCount || 0));
          setCompletedHiresCount(Number(ep.completedHiresCount || 0));
          setBusinessType(ep.businessType || 'Small Business / Shop');
          setVerificationStatus(ep.verificationStatus || 'Registered');
          setContactPerson(ep.contactPerson);
          setPhone(ep.phone);
          setIndustry(ep.industry);
          setBusinessType(ep.businessType);
          setGstOrGovtId(ep.gstOrGovtId || '');
          setArea(ep.address?.area || 'Sector 63');
          setCity(ep.address?.city || 'Noida');
          setAboutCompany(ep.aboutCompany || '');
          setAvatar(ep.avatar || user?.avatar || '');
          setMaxHiringDistanceKm(ep.maxHiringDistanceKm || 10);
          if (ep.address?.coordinates) setCoordinates(ep.address.coordinates);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiUpdateEmployerProfile({
        companyName,
        contactPerson,
        avatar,
        maxHiringDistanceKm: Number(maxHiringDistanceKm),
        phone,
        industry,
        businessType,
        gstOrGovtId,
        aboutCompany,
        address: {
          state: 'Uttar Pradesh',
          city,
          area,
          pincode: '201301',
          coordinates
        }
      });

      if (res.success) {
        showToast('Company details updated successfully!', 'success');
        updateLocalProfile(res.profile);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title={businessType === "Home Owner" ? "My Hiring Profile" : "Business Profile & Verification"}
      subtitle={businessType === "Home Owner" ? "Manage the details used when hiring help for your home" : "Manage your business details and hiring location"}
    >
      <div className="max-w-2xl bg-white rounded-3xl border border-brand-border shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <img src={avatar || "https://ui-avatars.com/api/?name=Employer"} alt="Employer profile" className="w-20 h-20 rounded-full object-cover border" />
          <div className="space-y-2"><label className="text-xs font-bold">Employer / company photo</label>
            <input type="file" accept="image/*" disabled={isUploading} onChange={async e => { const file=e.target.files?.[0]; if(!file)return; setIsUploading(true); try { setAvatar(await uploadProfileImage(file)); showToast("Photo uploaded. Save your profile to keep it.", "success"); } catch(err:any) { showToast(err.message || "Upload failed.", "error"); } finally { setIsUploading(false); e.currentTarget.value=""; } }} className="text-xs max-w-full" />
            <p className="text-[11px] text-brand-muted">{isUploading ? "Uploading..." : "Image up to 5 MB"}</p></div>
        </div>
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary-light flex items-center justify-center text-brand-primary font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-dark">{companyName || 'Company Profile'}</h2>
              <span className="text-xs text-brand-muted">Registered Employer</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{verificationStatus === 'Identity Verified' ? 'Identity Verified' : verificationStatus === 'Contact Verified' ? 'Contact Verified' : 'Verification Pending'}</span>
          </span>
        </div>

        <div className="rounded-2xl border border-brand-border bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Worker feedback</p>
              {employerRating === null ? (
                <p className="mt-1 text-sm font-bold text-brand-dark">New to KaamSetu</p>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <p className="text-2xl font-black text-brand-dark">{employerRating.toFixed(1)}<span className="text-sm font-semibold text-brand-muted">/5</span></p>
                </div>
              )}
              <p className="mt-1 text-[11px] text-brand-muted">
                {reviewsCount ? `Based on ${reviewsCount} verified completed-job review(s)` : 'No worker reviews yet'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-brand-dark">{completedHiresCount}</p>
              <p className="text-[10px] font-bold uppercase text-brand-muted">Completed hires</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-brand-muted">Your rating comes from workers you have hired after a job is marked completed. New employers start without a rating.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2"><label className="text-xs font-bold">Maximum hiring distance</label><span className="text-sm font-black text-brand-primary">{maxHiringDistanceKm} km</span></div>
            <input type="range" min="1" max="50" value={maxHiringDistanceKm} onChange={e => setMaxHiringDistanceKm(Number(e.target.value))} className="w-full accent-brand-primary" />
            <p className="text-[11px] text-brand-muted">Nearby candidate recommendations will use this radius.</p>
          </div>
          {businessType !== 'Home Owner' && (
          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Company / Firm Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-bold"
            />
          </div>          )}

          <LocationPicker coordinates={coordinates} onChange={setCoordinates} title="Business location" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Official Mobile</label>
              <input
                type="text"
                value={phone}
                readOnly
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-mono"
              />
              <p className="mt-1 text-[11px] text-brand-muted">Changing this number requires SMS OTP verification.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Business Type</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">GST / Govt Reg. ID</label>
              <input
                type="text"
                value={gstOrGovtId}
                onChange={(e) => setGstOrGovtId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Area / Sector</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">About Company / Field Operations</label>
            <textarea
              rows={3}
              value={aboutCompany}
              onChange={(e) => setAboutCompany(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-primary/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Company Profile'}</span>
          </button>
        </form>
      </div>
      <AccountDeletionSection />
    </DashboardLayout>
  );
};
