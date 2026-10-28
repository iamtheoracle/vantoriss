import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Gift, Wifi, Phone, Heart, Check, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

const PACKAGE_TYPES = [
  { id: 'essential', name: 'Essential Hero Package', description: 'Core care supplies for deployed service members', amount: 50, icon: Package, requestType: 'care_package' },
  { id: 'premium', name: 'Premium Care Package', description: 'Premium comfort items and personal care', amount: 100, icon: Gift, requestType: 'care_package' },
  { id: 'internet', name: 'Internet Sponsorship', description: 'Monthly internet access for a hero', amount: 30, icon: Wifi, requestType: 'internet_support' },
  { id: 'communication', name: 'Communication Services', description: 'Phone cards and data for staying connected', amount: 25, icon: Phone, requestType: 'communication_services' },
  { id: 'assistance', name: 'Financial Assistance', description: 'Direct support for a military family in need', amount: 75, icon: Heart, requestType: 'financial_assistance' },
];

export default function SponsorFlow({ open, onClose, accounts, profile, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  function handleClose() {
    setStep(1);
    setSelectedPackage(null);
    setSelectedAccountId('');
    setRecipientName('');
    setSuccess(false);
    onClose();
  }

  async function handleSponsor() {
    if (!selectedPackage || !selectedAccountId) return;
    const account = accounts.find(item => item.id === selectedAccountId);
    if (!account?.updated_date) {
      toast({ title: 'Sponsorship unavailable', description: 'The account revision is missing. Refresh your accounts before retrying.', variant: 'destructive' });
      return;
    }
    if (profile && !profile.updated_date) {
      toast({ title: 'Sponsorship unavailable', description: 'The sponsorship profile revision is missing. Refresh your profile before retrying.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    const operationScope = `herobox-sponsor:${await fingerprintMutationScope(JSON.stringify({
      packageId: selectedPackage.id,
      accountId: selectedAccountId,
      recipientName: recipientName.trim() || 'General Fund',
    }))}`;
    try {
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('createHeroBoxSponsorship', {
        package_id: selectedPackage.id,
        account_id: selectedAccountId,
        recipient_name: recipientName.trim() || 'General Fund',
        expected_updated_date: account.updated_date,
        expected_profile_updated_date: profile?.updated_date || null,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        typeof result?.sponsorship_id !== 'string' ||
        result?.account?.id !== selectedAccountId ||
        typeof result?.account?.updated_date !== 'string' ||
        result?.amount !== selectedPackage.amount
      ) {
        throw new Error(result?.error || 'The server did not confirm the sponsorship and ledger update. No success is assumed.');
      }

      await clearMutationIdempotencyKey(operationScope);
      setSuccess(true);
      toast({ title: 'Mission Sponsored', description: `Your ${selectedPackage.name} has been sponsored.` });
      setTimeout(() => { onSuccess?.(); handleClose(); }, 2000);
    } catch (e) {
      toast({
        title: 'Sponsorship unavailable',
        description: e?.response?.data?.error || e.message || 'The server did not confirm the sponsorship. Retry only with the same operation.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-mint/12 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-mint" />
            </div>
            <h3 className="text-foreground font-bold text-lg">Mission Sponsored</h3>
            <p className="text-gray text-sm mt-1">Your support is making a difference.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {step === 1 ? 'Select a Package' : step === 2 ? 'Payment Details' : 'Confirm Sponsorship'}
              </DialogTitle>
            </DialogHeader>

            {step === 1 && (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {PACKAGE_TYPES.map(pkg => {
                  const Icon = pkg.icon;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => { setSelectedPackage(pkg); setStep(2); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brass/12 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-brass" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold text-sm">{pkg.name}</p>
                        <p className="text-gray text-[11px] truncate">{pkg.description}</p>
                      </div>
                      <p className="text-foreground font-bold text-sm flex-shrink-0">{formatCurrency(pkg.amount)}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-foreground font-semibold text-sm">{selectedPackage.name}</p>
                  <p className="text-gray text-[11px]">{formatCurrency(selectedPackage.amount)}</p>
                </div>
                <div>
                  <label className="text-gray text-[11px] font-medium block mb-1">Recipient (optional)</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="General Fund"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy/30"
                  />
                </div>
                <div>
                  <label className="text-gray text-[11px] font-medium block mb-1.5">Payment Account</label>
                  {accounts.length === 0 ? (
                    <p className="text-crimson text-xs">No active accounts available</p>
                  ) : (
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                      {accounts.map(acct => (
                        <button
                          key={acct.id}
                          onClick={() => setSelectedAccountId(acct.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                            selectedAccountId === acct.id ? 'border-navy bg-navy/5' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="text-foreground text-sm font-medium">{acct.account_name || acct.account_type}</p>
                            <p className="text-gray text-[11px]">{acct.account_type}</p>
                          </div>
                          <p className="text-foreground text-sm font-semibold">{formatCurrency(acct.balance || 0)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-gray text-sm font-semibold">Back</button>
                  <button onClick={() => setStep(3)} disabled={!selectedAccountId} className="flex-1 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-40">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between"><span className="text-gray text-xs">Package</span><span className="text-foreground text-sm font-medium">{selectedPackage.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray text-xs">Recipient</span><span className="text-foreground text-sm font-medium">{recipientName || 'General Fund'}</span></div>
                  <div className="flex justify-between"><span className="text-gray text-xs">Account</span><span className="text-foreground text-sm font-medium">{accounts.find(a => a.id === selectedAccountId)?.account_name || '...'}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200"><span className="text-foreground text-sm font-semibold">Total</span><span className="text-foreground text-sm font-bold">{formatCurrency(selectedPackage.amount)}</span></div>
                </div>
                <p className="text-gray text-[11px] text-center">This support will be processed through your Vantoris account and tracked in your mission timeline.</p>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-gray text-sm font-semibold">Back</button>
                  <button onClick={handleSponsor} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-brass text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {processing ? 'Processing...' : 'Confirm'}
                    {!processing && <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}