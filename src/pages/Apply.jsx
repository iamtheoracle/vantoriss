import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import { ArrowLeft, Building2, Check, Landmark, User, Users } from 'lucide-react';

const accountTypes = [
  { type: 'Personal', icon: User, desc: 'Individual account for personal banking and transactions' },
  { type: 'Joint', icon: Users, desc: 'Add a joint account with another member' },
  { type: 'Business', icon: Building2, desc: 'Open a business account for your company' },
  { type: 'Organization', icon: Landmark, desc: 'Request a fund or organization account' },
];

function fieldClass() {
  return 'w-full rounded-lg border border-[#D8DEE8] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#B08D57] focus:ring-2 focus:ring-[#F5EFE5]';
}

export default function Apply() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', business_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function prefill() {
      const me = await base44.auth.me();
      if (hasOperationsAccess(me.role)) {
        navigate('/operations', { replace: true });
        return;
      }
      const existing = await base44.entities.Application.filter({ user_id: me.id });
      if (existing.length > 0 && mounted) {
        navigate('/', { replace: true });
        return;
      }
      if (mounted) setForm(current => ({ ...current, full_name: me.full_name || '', email: me.email || '' }));
    }

    prefill();

    return () => {
      mounted = false;
    };
  }, [navigate]);

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
    } catch (error) {
      console.error(error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5">
        <section className="w-full max-w-sm rounded-lg border border-[#D8DEE8] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E7F8F1] text-[#12805C]">
            <Check size={28} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#071A33]">Application Received</h2>
          <p className="mb-6 text-sm leading-relaxed text-[#5B6472]">Your application is under review. You will be notified once your account is approved.</p>
          <button type="button" onClick={() => navigate('/')} className="w-full rounded-lg bg-[#B08D57] py-3 font-bold text-[#071A33]">
            Go to Dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-5 pt-6 text-[#111827]">
      <button type="button" onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#5B6472]">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08D57]">Vantoris Application</p>
        <h1 className="mt-2 text-2xl font-bold text-[#071A33]">Let us get started</h1>
        <p className="mt-1 text-sm text-[#5B6472]">{step === 1 ? 'Choose the account type you want to apply for.' : 'Complete your information.'}</p>
      </header>

      <div className="mb-8 flex items-center gap-2">
        {[1, 2].map(item => (
          <div key={item} className={`h-1 flex-1 rounded-full transition ${item <= step ? 'bg-[#B08D57]' : 'bg-[#D8DEE8]'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          {accountTypes.map(accountType => {
            const Icon = accountType.icon;
            const selected = selectedType === accountType.type;
            return (
              <button
                type="button"
                key={accountType.type}
                onClick={() => setSelectedType(accountType.type)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selected
                    ? 'border-[#B08D57] bg-[#F5EFE5]'
                    : 'border-[#D8DEE8] bg-white hover:border-[#B08D57]/40 hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-[#B08D57] text-white' : 'bg-[#E7EEF9] text-[#012169]'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#071A33]">{accountType.type} Account</p>
                    <p className="text-xs text-[#5B6472]">{accountType.desc}</p>
                  </div>
                  {selected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B08D57]">
                      <Check size={12} className="text-[#071A33]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          <button
            type="button"
            disabled={!selectedType}
            onClick={() => setStep(2)}
            className="mt-4 w-full rounded-lg bg-[#B08D57] py-3.5 font-bold text-[#071A33] transition disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {submitError && (
            <div className="rounded-lg border border-[#F4A7B2] bg-[#FCE7EA] p-3 text-sm font-medium text-[#7F1020]">
              {submitError}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5B6472]">Full Name</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5B6472]">Email</label>
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5B6472]">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className={fieldClass()}
              placeholder="+1 (000) 000-0000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5B6472]">Address</label>
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className={fieldClass()}
            />
          </div>
          {(selectedType === 'Business' || selectedType === 'Organization') && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5B6472]">Business / Organization Name</label>
              <input
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                className={fieldClass()}
              />
            </div>
          )}
          <button
            type="button"
            disabled={!form.full_name || !form.email || submitting}
            onClick={handleSubmit}
            className="mt-2 w-full rounded-lg bg-[#B08D57] py-3.5 font-bold text-[#071A33] transition disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      )}
    </main>
  );
}