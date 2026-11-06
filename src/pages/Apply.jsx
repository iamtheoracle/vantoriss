import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import { ArrowLeft, Briefcase, Building2, Check, Landmark, ShieldCheck, User, Users } from 'lucide-react';

const accountTypes = [
  { type: 'Checking', icon: User, desc: 'Everyday transactions, debit card, and bill pay', standard: true },
  { type: 'Savings', icon: Users, desc: 'Earn interest on your deposits', standard: true },
  { type: 'Money Market', icon: Building2, desc: 'Higher interest with flexible access', standard: true },
  { type: 'CD', icon: Landmark, desc: 'Fixed-term certificate of deposit', standard: true },
  { type: 'Joint', icon: Users, desc: 'Shared account with a co-applicant', standard: false },
  { type: 'Business', icon: Briefcase, desc: 'Business checking or savings for your company', standard: false },
];

const BUSINESS_TYPES = ['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship', 'Non-Profit'];

function fieldClass() {
  return 'w-full rounded-lg border border-[#E5DDCA] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9AA39D] focus:border-[#C5A66A] focus:ring-2 focus:ring-[#F0EBDD]';
}

export default function Apply() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', business_name: '', joint_account_holder_name: '', joint_account_holder_ssn: '', ein: '', business_type: '' });
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
        message: `Your ${selectedType} account application has been submitted.${!accountTypes.find(a => a.type === selectedType)?.standard ? ' This account type requires additional review and approval.' : ''} Complete identity verification to proceed.`,
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
      <main className="flex min-h-screen items-center justify-center bg-[#F7F4EC] px-5">
        <section className="w-full max-w-sm rounded-lg border border-[#E5DDCA] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F0E9] text-[#204F40]">
            <Check size={28} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#173D32]">Application Received</h2>
          <p className="mb-6 text-sm leading-relaxed text-[#68766F]">Your application is under review. You will be notified once your account is approved.</p>
          <button type="button" onClick={() => navigate('/')} className="w-full rounded-lg bg-[#C5A66A] py-3 font-bold text-[#173D32]">
            Go to Dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F4EC] px-5 pt-6 text-[#111827]">
      <button type="button" onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#68766F]">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C5A66A]">Atchison Village Application</p>
        <h1 className="mt-2 text-2xl font-bold text-[#173D32]">Let us get started</h1>
        <p className="mt-1 text-sm text-[#68766F]">{step === 1 ? 'Choose the account type you want to apply for.' : 'Complete your information.'}</p>
      </header>

      <div className="mb-8 flex items-center gap-2">
        {[1, 2].map(item => (
          <div key={item} className={`h-1 flex-1 rounded-full transition ${item <= step ? 'bg-[#C5A66A]' : 'bg-[#E5DDCA]'}`} />
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
                    ? 'border-[#C5A66A] bg-[#F0EBDD]'
                    : 'border-[#E5DDCA] bg-white hover:border-[#C5A66A]/40 hover:bg-[#F7F4EC]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-[#C5A66A] text-white' : 'bg-[#E5EBDD] text-[#173D32]'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#173D32]">{accountType.type} Account</p>
                      {!accountType.standard && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C5A66A] bg-[#C5A66A]/10 px-1.5 py-0.5 rounded-full">Requires Approval</span>
                      )}
                    </div>
                    <p className="text-xs text-[#68766F]">{accountType.desc}</p>
                  </div>
                  {selected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C5A66A]">
                      <Check size={12} className="text-[#173D32]" />
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
            className="mt-4 w-full rounded-lg bg-[#C5A66A] py-3.5 font-bold text-[#173D32] transition disabled:opacity-40"
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Full Name</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Email</label>
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={fieldClass()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className={fieldClass()}
              placeholder="+1 (000) 000-0000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Address</label>
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className={fieldClass()}
            />
          </div>
          {selectedType === 'CD' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Beneficiary / Account Holder Name</label>
              <input
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                className={fieldClass()}
              />
            </div>
          )}
          {selectedType === 'Joint' && (
            <>
              <div className="rounded-lg border border-[#C5A66A]/30 bg-[#FDFBF5] p-3 flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#C5A66A] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#68766F] leading-relaxed">Joint accounts require co-applicant verification. Both account holders must complete identity verification.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Co-Applicant Full Name</label>
                <input
                  value={form.joint_account_holder_name}
                  onChange={e => setForm({ ...form, joint_account_holder_name: e.target.value })}
                  className={fieldClass()}
                  placeholder="Legal full name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Co-Applicant SSN (Last 4 Digits)</label>
                <input
                  value={form.joint_account_holder_ssn}
                  onChange={e => setForm({ ...form, joint_account_holder_ssn: e.target.value.slice(0, 4) })}
                  className={fieldClass()}
                  placeholder="e.g. 1234"
                  inputMode="numeric"
                />
              </div>
            </>
          )}
          {selectedType === 'Business' && (
            <>
              <div className="rounded-lg border border-[#C5A66A]/30 bg-[#FDFBF5] p-3 flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#C5A66A] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#68766F] leading-relaxed">Business accounts require EIN verification and additional documentation. Subject to enhanced review.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Business Legal Name</label>
                <input
                  value={form.business_name}
                  onChange={e => setForm({ ...form, business_name: e.target.value })}
                  className={fieldClass()}
                  placeholder="Registered business name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">Business Type</label>
                <select
                  value={form.business_type}
                  onChange={e => setForm({ ...form, business_type: e.target.value })}
                  className={fieldClass()}
                >
                  <option value="">Select business type</option>
                  {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#68766F]">EIN (Employer Identification Number)</label>
                <input
                  value={form.ein}
                  onChange={e => setForm({ ...form, ein: e.target.value })}
                  className={fieldClass()}
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </>
          )}
          <button
            type="button"
            disabled={!form.full_name || !form.email || submitting}
            onClick={handleSubmit}
            className="mt-2 w-full rounded-lg bg-[#C5A66A] py-3.5 font-bold text-[#173D32] transition disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      )}
    </main>
  );
}