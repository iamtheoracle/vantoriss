import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Lock, Unlock, DollarSign, Check, X } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';

const QUICK_ACTIONS = [
  { id: 'freeze', label: 'Freeze Account', icon: Lock, color: 'text-red-400', bg: 'bg-crimson/15' },
  { id: 'unfreeze', label: 'Unfreeze Account', icon: Unlock, color: 'text-emerald-400', bg: 'bg-olive/15' },
  { id: 'adjustment', label: 'Balance Adjustment', icon: DollarSign, color: 'text-brass', bg: 'bg-brass/15' },
];

export default function QuickActionsMenu({ onActionComplete }) {
  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleActionSelect(actionId) {
    setSelectedAction(actionId);
    if (!accounts.length) {
      setLoading(true);
      try {
        const accts = await base44.entities.Account.list('-created_date', 100);
        setAccounts(accts);
        } catch (e) {
        console.error(e);
        toast({ title: 'Load failed', description: e.message || 'Unable to load accounts.', variant: 'destructive' });
        }
        setLoading(false);
    }
  }

  async function handleFreeze() {
    if (!selectedAccount) return;
    setSubmitting(true);
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      await base44.entities.Account.update(selectedAccount, { status: 'frozen' });
      await base44.entities.Notification.create({
        user_id: account.user_id,
        title: 'Account Frozen',
        message: 'Your account has been temporarily frozen.',
        type: 'warning',
      });
      await logAuditEntry({
        action_type: 'account_status_changed',
        description: `Account frozen: ${account.account_name}`,
        account_id: selectedAccount,
        target_user_id: account.user_id,
      });
      setSelectedAction(null);
      setSelectedAccount(null);
      onActionComplete?.();
      toast({ title: 'Account frozen', description: `${account.account_name} has been frozen.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Freeze failed', description: e.message || 'Unable to freeze account.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  async function handleUnfreeze() {
    if (!selectedAccount) return;
    setSubmitting(true);
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      await base44.entities.Account.update(selectedAccount, { status: 'active' });
      await base44.entities.Notification.create({
        user_id: account.user_id,
        title: 'Account Unfrozen',
        message: 'Your account has been restored to active status.',
        type: 'success',
      });
      await logAuditEntry({
        action_type: 'account_status_changed',
        description: `Account unfrozen: ${account.account_name}`,
        account_id: selectedAccount,
        target_user_id: account.user_id,
      });
      setSelectedAction(null);
      setSelectedAccount(null);
      onActionComplete?.();
      toast({ title: 'Account unfrozen', description: `${account.account_name} is now active.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Unfreeze failed', description: e.message || 'Unable to unfreeze account.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  async function handleAdjustment() {
    if (!selectedAccount || !adjustmentAmount) return;
    setSubmitting(true);
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      const amount = parseFloat(adjustmentAmount);
      const newBalance = account.balance + amount;

      await base44.entities.Transaction.create({
        account_id: selectedAccount,
        type: 'adjustment',
        amount: amount,
        description: `Balance adjustment: ${adjustmentReason || 'No reason provided'}`,
        balance_after: newBalance,
        created_by_admin: true,
      });

      await base44.entities.Account.update(selectedAccount, { balance: newBalance });

      await base44.entities.Notification.create({
        user_id: account.user_id,
        title: 'Account Adjusted',
        message: `Your account balance was adjusted by ${amount > 0 ? '+' : ''}${amount.toFixed(2)}.`,
        type: 'info',
      });

      await logAuditEntry({
        action_type: 'balance_adjusted',
        description: `Balance adjusted: ${account.account_name}`,
        details: `Amount: ${amount}, Reason: ${adjustmentReason || 'None'}`,
        account_id: selectedAccount,
        amount: amount,
        balance_before: account.balance,
        balance_after: newBalance,
        target_user_id: account.user_id,
      });

      setSelectedAction(null);
      setSelectedAccount(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      onActionComplete?.();
      toast({ title: 'Balance adjusted', description: `${account.account_name} adjusted by ${amount > 0 ? '+' : ''}${amount.toFixed(2)}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Adjustment failed', description: e.message || 'Unable to adjust balance.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-brass text-[#0E1A2B] rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all"
      >
        <Zap size={16} /> Quick Actions
      </button>

      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {QUICK_ACTIONS.find(a => a.id === selectedAction)?.label}
            </DialogTitle>
          </DialogHeader>

          {selectedAction && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">
                  Select Account
                </label>
                <select
                  value={selectedAccount || ''}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                >
                  <option value="">Choose an account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} ({a.account_number})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAction === 'adjustment' && (
                <>
                  <div>
                    <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">
                      Adjustment Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={e => setAdjustmentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                    />
                    <p className="text-[#AAB4C3]/50 text-xs mt-1">Use negative number for deductions</p>
                  </div>
                  <div>
                    <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={e => setAdjustmentReason(e.target.value)}
                      placeholder="Reason for adjustment"
                      className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={
                    selectedAction === 'freeze' ? handleFreeze :
                    selectedAction === 'unfreeze' ? handleUnfreeze :
                    handleAdjustment
                  }
                  disabled={!selectedAccount || (selectedAction === 'adjustment' && !adjustmentAmount) || submitting}
                  className="flex-1 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Check size={14} /> {submitting ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="px-6 py-3 bg-[#242D38] text-[#AAB4C3] rounded-xl font-medium hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}