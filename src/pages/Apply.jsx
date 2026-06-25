import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import { ArrowLeft, User, Users, Building2, Landmark, Check } from 'lucide-react';

const accountTypes = [
  { type: 'Personal', icon: User, desc: 'Individual account for personal banking and transactions' },
  { type: 'Joint', icon: Users, desc: 'Add a joint account with another member' },
  { type: 'Business', icon: Building2, desc: 'Open a business account for your company' },
  { type: 'Organization', icon: Landmark, desc: 'Request a fund or organization account' },
];

export default function Apply() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', business_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function prefill() {
      const me = await base44.auth.me();
      setForm(f => ({ ...f, full_name: me.full_name || '', email: me.email || '' }));
    }
    prefill();
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.Application.create({
        user_id: me.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        business_name: form.business_name,
        account_type: selectedType,
        kyc_status: 'not_started',
        application_status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: me.id,
        title: 'Application Received',
        message: `Your ${selectedType} account application has been submitted. Complete identity verification to proceed.`,
        type: 'info',
      });
      setDone(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="px-5 pt-6 min-h-screen flex flex-col items-center justify-center">
        <div className="vantoris-card p-8 text-center w-full max-w-sm">
          <div className="w-16 h-16 rounded-full bg-olive/20 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Application Received</h2>
          <p className="text-[#AAB4C3] text-sm mb-6">Your application is under review. You will be notified once your account is approved.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 min-h-screen">
      <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="flex items-center gap-2 text-[#AAB4C3] text-sm mb-6">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Let's get started</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">
        {step === 1 ? 'Choose the account type you want to apply for' : 'Complete your information'}
      </p>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-brass' : 'bg-[#242D38]'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          {accountTypes.map(at => {
            const Icon = at.icon;
            const selected = selectedType === at.type;
            return (
              <button
                key={at.type}
                onClick={() => setSelectedType(at.type)}
                className={`vantoris-card p-4 w-full text-left flex items-center gap-4 transition-all ${
                  selected ? 'border-brass/50 bg-brass/5' : 'hover:border-[#AAB4C3]/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-brass/20' : 'bg-[#242D38]'}`}>
                  <Icon size={20} className={selected ? 'text-brass' : 'text-[#AAB4C3]'} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{at.type} Account</p>
                  <p className="text-[#AAB4C3] text-xs">{at.desc}</p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-brass flex items-center justify-center">
                    <Check size={12} className="text-[#0E1A2B]" />
                  </div>
                )}
              </button>
            );
          })}
          <button
            disabled={!selectedType}
            onClick={() => setStep(2)}
            className="w-full py-3.5 mt-4 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Full Name</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none transition-all"
              placeholder="+1 (000) 000-0000"
            />
          </div>
          <div>
            <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Address</label>
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none transition-all"
            />
          </div>
          {(selectedType === 'Business' || selectedType === 'Organization') && (
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Business / Organization Name</label>
              <input
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none transition-all"
              />
            </div>
          )}
          <button
            disabled={!form.full_name || !form.email || submitting}
            onClick={handleSubmit}
            className="w-full py-3.5 mt-2 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      )}
    </div>
  );
}