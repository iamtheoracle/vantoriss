import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Lock, Unlock, Check, X } from 'lucide-react';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';
import { useToast } from '@/components/ui/use-toast';

const QUICK_ACTIONS = [
  { id: 'freeze', label: 'Freeze Account', icon: Lock, color: 'text-red-400', bg: 'bg-crimson/15' },
  { id: 'unfreeze', label: 'Unfreeze Account', icon: Unlock, color: 'text-emerald-400', bg: 'bg-olive/15' },
];

export default function QuickActionsMenu({ onActionComplete }) {
  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleActionSelect(actionId) {
    setLoading(true);
    try {
      if (!accounts.length) {
        const accts = await base44.entities.Account.list('-created_date', 100);
        setAccounts(accts);
      }
      setSelectedAction(actionId);
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load accounts.', variant: 'destructive' });
      setSelectedAction(null);
    } finally {
      setLoading(false);
    }
  }

  async function mutateAccountStatus(status) {
    if (!selectedAccount) return;
    const account = accounts.find(a => a.id === selectedAccount);
    if (!account || typeof account.updated_date !== 'string' || !account.updated_date) {
      toast({ title: 'Status change unavailable', description: 'The account revision is missing. Reload the account list and try again.', variant: 'destructive' });
      return;
    }

    const expectedStatus = status === 'frozen' ? 'active' : 'frozen';
    const operationScope = `account-status:${await fingerprintMutationScope(JSON.stringify({
      account_id: selectedAccount,
      status,
      expected_status: expectedStatus,
      expected_updated_date: account.updated_date,
    }))}`;
    setSubmitting(true);
    try {
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('setAccountStatus', {
        account_id: selectedAccount,
        status,
        expected_status: expectedStatus,
        expected_updated_date: account.updated_date,
        idempotency_key: idempotencyKey,
      });
      const payload = response?.data ?? response;
      if (
        payload?.success !== true ||
        payload?.operation_id !== idempotencyKey ||
        payload?.audit_recorded !== true ||
        payload?.account?.id !== selectedAccount ||
        payload?.account?.status !== status ||
        typeof payload?.account?.updated_date !== 'string' ||
        payload.account.updated_date === account.updated_date
      ) {
        throw new Error('The server did not confirm the account status and audit record. Retry the same operation after reloading.');
      }

      await clearMutationIdempotencyKey(operationScope);
      setSelectedAction(null);
      setSelectedAccount(null);
      onActionComplete?.();
      toast({
        title: status === 'frozen' ? 'Account frozen' : 'Account unfrozen',
        description: status === 'frozen'
          ? `${account.account_name} has been frozen.`
          : `${account.account_name} is now active.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: status === 'frozen' ? 'Freeze failed' : 'Unfreeze failed',
        description: e.message || 'Unable to change account status.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFreeze() {
    await mutateAccountStatus('frozen');
  }

  async function handleUnfreeze() {
    await mutateAccountStatus('active');
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-brass text-[#0E1A2B] rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all"
      >
        <Zap size={16} /> Quick Actions
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleActionSelect(action.id)}
                  disabled={loading}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-[#242D38] disabled:opacity-50 ${action.color}`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.bg}`}>
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
            {loading && <p className="text-[#AAB4C3] text-xs">Loading accounts…</p>}
          </div>
        </DialogContent>
      </Dialog>

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

              <div className="flex gap-3">
                <button
                  onClick={
                    selectedAction === 'freeze' ? handleFreeze :
                    selectedAction === 'unfreeze' ? handleUnfreeze :
                    handleFreeze
                  }
                  disabled={!selectedAccount || submitting}
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