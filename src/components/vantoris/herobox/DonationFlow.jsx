import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, AlertCircle, Globe } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

const DONATION_CATEGORIES = [
  { id: 'food', label: 'Food & Essential Supplies', desc: 'Provide food, groceries, and essential household supplies' },
  { id: 'children', label: "Children's Home / Orphanage", desc: "Support children's homes and orphanages with supplies" },
  { id: 'medical', label: 'Medical / Surgery Support', desc: 'Help with documented medical fundraising' },
  { id: 'military', label: 'Military Personnel / Family', desc: 'Support deployed service members and their families' },
  { id: 'shelter', label: 'Shelter / Housing', desc: 'Support shelters and housing assistance' },
  { id: 'general', label: 'General Assistance', desc: 'Flexible donation for verified needs' },
];

/**
 * DonationFlow — Guides a donor through the donation process.
 * The donor remains in control at all times.
 * Discovery does NOT equal approval — the donor must explicitly choose.
 */
export default function DonationFlow({ onClose, onOrderComplete }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      // Only show donor-visible cases (approved/active) — never discovered/unverified
      const allCases = await base44.entities.HumanitarianCase.filter({
        review_status: 'approved',
      }, '-date_discovered', 30).catch(() => []);

      // Filter to donor-visible pipeline states only
      const donorVisible = allCases.filter((c) =>
        ['approved', 'active', 'matched'].includes(c.case_status)
      );

      // Further filter by selected donation category if applicable
      let filtered = donorVisible;
      if (category) {
        const categoryMap = {
          food: ['food', 'essential_supplies'],
          children: ['children_support'],
          medical: ['surgery_medical'],
          military: ['military_support'],
          shelter: ['shelter'],
          general: [],
        };
        const matchingCategories = categoryMap[category.id] || [];
        if (matchingCategories.length > 0) {
          filtered = donorVisible.filter((c) => matchingCategories.includes(c.category));
        }
      }

      setCases(filtered);
    } catch (err) {
      // Truthful empty state — do NOT fabricate cases
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (step === 2) loadCases();
  }, [step, loadCases]);

  async function handleDonate() {
    const donationAmount = Number(amount);
    if (
      !amount.trim() ||
      !Number.isFinite(donationAmount) ||
      donationAmount <= 0 ||
      donationAmount > 100_000_000 ||
      !Number.isSafeInteger(Math.round(donationAmount * 100)) ||
      Math.abs(donationAmount * 100 - Math.round(donationAmount * 100)) > Number.EPSILON * Math.max(1, Math.abs(donationAmount * 100)) * 4
    ) {
      toast({ title: 'Invalid amount', description: 'Enter a positive donation amount with no more than two decimal places.', variant: 'destructive' });
      return;
    }
    if (!category?.id) {
      toast({ title: 'Choose a donation category', description: 'Select a category before continuing.', variant: 'destructive' });
      return;
    }
    if (selectedCase && !selectedCase.updated_date) {
      toast({ title: 'Case needs refreshing', description: 'The selected case revision is missing. Return to the case list and select it again.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    let operationScope = '';
    try {
      operationScope = `herobox-donation:${await fingerprintMutationScope(JSON.stringify({
        category: category.id,
        amount: donationAmount,
        caseId: selectedCase?.id || null,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const me = await base44.auth.me();
      const response = await base44.functions.invoke('createHeroBoxDonation', {
        category: category.id,
        amount: donationAmount,
        humanitarian_case_id: selectedCase?.id || null,
        expected_case_updated_date: selectedCase?.updated_date || null,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const order = result?.order;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        result?.funds_moved !== false ||
        !order ||
        typeof order.id !== 'string' ||
        order.user_id !== me.id ||
        order.total !== donationAmount ||
        order.status !== 'payment_pending' ||
        order.payment_status !== 'pending' ||
        typeof order.updated_date !== 'string'
      ) {
        throw new Error(result?.error || 'The server did not confirm an audited, unpaid donation order. Retry only with the same operation.');
      }

      await clearMutationIdempotencyKey(operationScope);
      toast({
        title: 'Donation order created',
        description: `Your ${formatCurrency(donationAmount)} donation order is awaiting payment. No funds have been charged.`,
      });
      onOrderComplete?.();
      onClose();
    } catch (err) {
      toast({
        title: 'Donation unavailable',
        description: err?.response?.data?.error || err.message || 'The server did not confirm the donation order.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Make a Donation</h3>
          <button onClick={onClose} className="text-gray text-sm">Cancel</button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-brass' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray mb-3">What would you like to donate toward?</p>
            {DONATION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat); setStep(2); }}
                className="w-full vantoris-glass p-3 text-left hover:ring-2 hover:ring-brass/30 transition"
              >
                <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                <p className="text-xs text-gray mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-brass" />
              <p className="text-sm font-semibold text-foreground">Verified Cases</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brass" /></div>
            ) : cases.length === 0 ? (
              <div className="vantoris-glass p-6 text-center">
                <AlertCircle size={28} className="text-gray mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No verified cases available right now</p>
                <p className="text-xs text-gray mt-1">
                  When Vantoris verifies a humanitarian case, it will appear here. You can still make a general donation.
                </p>
                <button
                  onClick={() => { setSelectedCase(null); setStep(3); }}
                  className="mt-4 w-full py-2.5 rounded-xl bg-navy text-white text-sm font-semibold"
                >
                  Make a General Donation
                </button>
              </div>
            ) : (
              <>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCase(c); setStep(3); }}
                    className="w-full vantoris-glass p-3 text-left hover:ring-2 hover:ring-brass/30 transition"
                  >
                    <p className="text-sm font-semibold text-foreground">{c.case_title}</p>
                    <p className="text-xs text-gray mt-0.5">{c.recipient_name || c.recipient_type}</p>
                    {c.location && <p className="text-[10px] text-gray flex items-center gap-1 mt-1"><Globe size={10} /> {c.location}</p>}
                    <p className="text-xs text-gray mt-1 line-clamp-2">{c.stated_need}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint/10 text-mint font-medium">
                        {c.verification_status === 'verified' ? 'Verified' : 'Partially Verified'}
                      </span>
                      <span className="text-[10px] text-gray">Confidence: {c.confidence_level}</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { setSelectedCase(null); setStep(3); }}
                  className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-gray"
                >
                  Make a General Donation Instead
                </button>
              </>
            )}
            <button onClick={() => setStep(1)} className="text-xs text-gray">← Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {selectedCase && (
              <div className="vantoris-glass-flat p-3">
                <p className="text-xs text-gray">Selected Case:</p>
                <p className="text-sm font-semibold text-foreground">{selectedCase.case_title}</p>
                <p className="text-xs text-gray mt-0.5">{selectedCase.recipient_name || selectedCase.recipient_type}</p>
                {selectedCase.estimated_amount > 0 && (
                  <p className="text-xs text-gray mt-1">Estimated need: {formatCurrency(selectedCase.estimated_amount)}</p>
                )}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Donation Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  className="w-full rounded-lg border border-border bg-white pl-8 pr-4 py-3 text-sm focus:border-brass/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className="flex-1 py-2 rounded-lg bg-slate-100 text-xs font-medium text-gray hover:bg-slate-200"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="vantoris-glass-flat p-3 text-xs text-gray">
              <p className="font-medium text-foreground mb-1">Donor Control</p>
              <p>You choose exactly where your donation goes. Vantoris never automatically selects a recipient or spends funds without your explicit authorization.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Back</button>
              <button
                onClick={handleDonate}
                disabled={submitting || !amount}
                className="flex-1 py-3 rounded-xl bg-brass text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Donate {amount ? formatCurrency(parseFloat(amount)) : ''}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}