import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetWorkerProfile, apiUpdateWorkerProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { WorkerProfile } from '../../types';
import { User, Phone, MapPin, IndianRupee, Save, CheckCircle2, Camera } from 'lucide-react';
import { uploadProfileImage } from '../../services/imageUpload';
import { LocationPicker } from '../../components/maps/LocationPicker';
import { AccountDeletionSection } from '../../components/profile/AccountDeletionSection';

export const WorkerProfilePage: React.FC = () => {
  const { user, updateLocalProfile } = useAuth();
  const { showToast } = useNotifications();

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const [bio, setBio] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [dailyWage, setDailyWage] = useState(800);
  const [avatar, setAvatar] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState(8);
  const [coordinates, setCoordinates] = useState({ lat: 28.6280, lng: 77.3649 });
  const [locationPinConfirmed, setLocationPinConfirmed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiGetWorkerProfile();
        if (res.success && res.workerProfile) {
          const wp = res.workerProfile;
          setProfile(wp);
          setFullName(wp.fullName);
          setPhone(wp.phone);
          setPrimarySkill(wp.primarySkill);
          setBio(wp.bio || '');
          setArea(wp.location?.area || '');
          setCity(wp.location?.city || '');
          setDailyWage(wp.preferences?.expectedDailyWage || 800);
          setAvatar(wp.avatar || user?.avatar || '');
          setMaxDistanceKm(wp.preferences?.maxDistanceKm || 8);
          if (wp.location?.coordinates) setCoordinates(wp.location.coordinates);
          setLocationPinConfirmed(wp.location?.pinConfirmed === true);
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
      const res = await apiUpdateWorkerProfile({
        fullName,
        phone,
        avatar,
        primarySkill,
        bio,
        location: {
          state: profile?.location?.state || 'Uttar Pradesh',
          city,
          area,
          pincode: profile?.location?.pincode || '201309',
          coordinates,
          pinConfirmed: locationPinConfirmed
        },
        preferences: {
          expectedDailyWage: Number(dailyWage),
          expectedMonthlyWage: Number(dailyWage) * 26,
          jobType: profile?.preferences?.jobType || 'Daily Wage',
          availableDates: profile?.preferences?.availableDates || 'Immediate',
          maxDistanceKm: Number(maxDistanceKm)
        }
      });

      if (res.success) {
        showToast('Profile and preferences updated successfully!', 'success');
        updateLocalProfile(res.workerProfile);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Worker Profile & Trade Settings"
      subtitle="Manage your primary skills, daily wage baseline, and contact details"
    >
      <div className="max-w-2xl bg-white rounded-3xl border border-brand-border shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <img src={avatar || "https://ui-avatars.com/api/?name=Worker"} alt="Worker profile" className="w-20 h-20 rounded-full object-cover border" />
          <div className="space-y-2"><label className="text-xs font-bold">Profile photo</label>
            <input type="file" accept="image/*" disabled={isUploading} onChange={async e => { const file=e.target.files?.[0]; if(!file)return; setIsUploading(true); try { setAvatar(await uploadProfileImage(file)); showToast("Photo uploaded. Save your profile to keep it.", "success"); } catch(err:any) { showToast(err.message || "Upload failed.", "error"); } finally { setIsUploading(false); e.currentTarget.value=""; } }} className="text-xs max-w-full" />
            <p className="text-[11px] text-brand-muted">{isUploading ? "Uploading..." : "Image up to 5 MB"}</p></div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              readOnly
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Primary Trade</label>
            <input
              type="text"
              value={primarySkill}
              onChange={(e) => setPrimarySkill(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-bold"
            />
          </div>

          <LocationPicker coordinates={coordinates} onChange={value => { setCoordinates(value); setLocationPinConfirmed(true); }} title="Your work location" />
          <p className={`text-xs ${locationPinConfirmed ? "text-emerald-700" : "text-amber-700"}`}>{locationPinConfirmed ? "Your location pin is confirmed for distance matching." : "Your saved location is not confirmed yet. Use the location button above to set your current location before relying on job distances."}</p>
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
            <label className="text-xs font-semibold text-brand-dark block mb-1">Expected Daily Wage (₹)</label>
            <input
              type="number"
              value={dailyWage}
              onChange={(e) => setDailyWage(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-bold text-brand-primary"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2"><label className="text-xs font-bold">Maximum work distance</label><span className="text-sm font-black text-brand-primary">{maxDistanceKm} km</span></div>
            <input type="range" min="1" max="50" value={maxDistanceKm} onChange={e => setMaxDistanceKm(Number(e.target.value))} className="w-full accent-brand-primary" />
            <p className="text-[11px] text-brand-muted">Recommend jobs within this distance of your saved location.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Artisan Bio / Introduction</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-primary/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
      <AccountDeletionSection />
    </DashboardLayout>
  );
};
