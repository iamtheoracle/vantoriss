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
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function prefill() {
      const me = await base44.auth.me();
      if (hasOperationsAccess(me.role)) {
        navigate('/operations', { replace: true });
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