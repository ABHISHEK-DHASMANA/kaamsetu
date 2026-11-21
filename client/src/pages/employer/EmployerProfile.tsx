import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { apiGetEmployerProfile, apiUpdateEmployerProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { EmployerProfile } from '../../types';
import { Building2, Phone, Mail, MapPin, ShieldCheck, Save, Award } from 'lucide-react';

export const EmployerProfilePage: React.FC = () => {
  const { user, profile, updateLocalProfile } = useAuth();
  const { showToast } = useNotifications();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstOrGovtId, setGstOrGovtId] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiGetEmployerProfile();
        if (res.success && res.profile) {
          const ep = res.profile;
          setCompanyName(ep.companyName);
          setContactPerson(ep.contactPerson);
          setPhone(ep.phone);
          setIndustry(ep.industry);
          setBusinessType(ep.businessType);
          setGstOrGovtId(ep.gstOrGovtId || '');
          setArea(ep.address?.area || 'Sector 63');
          setCity(ep.address?.city || 'Noida');
          setAboutCompany(ep.aboutCompany || '');
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
          coordinates: { lat: 28.6271, lng: 77.3820 }
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
      title="Company Profile & Employer Verification"
      subtitle="Manage your business verification and contact details"
    >
      <div className="max-w-2xl bg-white rounded-3xl border border-brand-border shadow-sm p-6 sm:p-8 space-y-6">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Identity Verified</span>
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">Company / Firm Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-bold"
            />
          </div>

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
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-50 focus:bg-white text-brand-dark font-mono"
              />
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
    </DashboardLayout>
  );
};
