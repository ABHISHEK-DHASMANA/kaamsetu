import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetWorkerProfile, apiUpdateWorkerProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { WorkerProfile } from '../../types';
import { User, Phone, MapPin, IndianRupee, Save, CheckCircle2 } from 'lucide-react';

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
        primarySkill,
        bio,
        location: {
          state: profile?.location?.state || 'Uttar Pradesh',
          city,
          area,
          pincode: profile?.location?.pincode || '201309',
          coordinates: profile?.location?.coordinates || { lat: 28.6280, lng: 77.3649 }
        },
        preferences: {
          expectedDailyWage: Number(dailyWage),
          expectedMonthlyWage: Number(dailyWage) * 26,
          jobType: profile?.preferences?.jobType || 'Daily Wage',
          availableDates: profile?.preferences?.availableDates || 'Immediate',
          maxDistanceKm: profile?.preferences?.maxDistanceKm || 10
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
              onChange={(e) => setPhone(e.target.value)}
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
    </DashboardLayout>
  );
};
