import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [wds, accts] = await Promise.all([
      base44.entities.WithdrawalRequest.list('-created_date', 50),
      base44.entities.Account.list('-created_date', 50),
    ]);
    setWithdrawals(wds);
    setAccounts(accts);
    setLoading(false);
  }

  function getAccount(id) {
    return accounts.find(a => a.id === id);
  }

  async function handlePay() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const account = getAccount(selected.account_id);
      const newBalance = (account?.balance || 0) - Math.abs(selected.amount);

      // Create withdrawal transaction
      await base44.entities.Transaction.create({
        account_id: selected.account_id,
        type: 'withdrawal',
        amount: -Math.abs(selected.amount),
        description: `Withdrawal - ${selected.method}`,
        reference: `WD-${selected.id.slice(-6)}`,
        balance_after: newBalance,
        created_by_admin: true,
      });

      // Update account balance
      await base44.entities.Account.update(selected.account_id, { balance: newBalance });

      // Update withdrawal status
      await base44.entities.WithdrawalRequest.update(selected.id, {
        status: 'paid',
        admin_notes: adminNotes,
      });

      // Notify member
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: 'Withdrawal Processed',
        message: `Your withdrawal of ${formatCurrency(Math.abs(selected.amount))} via ${selected.method} has been processed.`,
        type: 'success',
      });

      setSelected(null);
      setAdminNotes('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function handleReject() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await base44.entities.WithdrawalRequest.update(selected.id, {
        status: 'rejected',
        admin_notes: adminNotes,
      });
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request of ${formatCurrency(Math.abs(selected.amount))} was not approved. ${adminNotes || ''}`,
        type: 'warning',
      });
      setSelected(null);
      setAdminNotes('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Withdrawals</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">
        {withdrawals.filter(w => w.status === 'pending').length} pending requests
      </p>

      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Account</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Method</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(wd => {
              const acct = getAccount(wd.account_id);
              return (
                <tr key={wd.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{acct?.account_name || '—'}</p>
                    <p className="text-[#AAB4C3] text-xs font-mono">{acct?.account_number || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-red-400 font-semibold">{formatCurrency(Math.abs(wd.amount))}</td>
                  <td className="px-5 py-4 text-white">{wd.method}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                    {new Date(wd.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={wd.status} /></td>
                  <td className="px-5 py-4">
                    {wd.status === 'pending' && (
                      <button
                        onClick={() => setSelected(wd)}
                        className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {withdrawals.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-[#AAB4C3]">No withdrawal requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Review Withdrawal</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#AAB4C3] text-xs">Amount</span>
                  <span className="text-red-400 font-bold text-lg">{formatCurrency(Math.abs(selected.amount))}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#AAB4C3] text-xs">Method</span>
                  <span className="text-white text-sm">{selected.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#AAB4C3] text-xs">Account Balance</span>
                  <span className="text-white text-sm">{formatCurrency(getAccount(selected.account_id)?.balance || 0)}</span>
                </div>
                {selected.notes && (
                  <p className="text-[#AAB4C3] text-xs mt-2 pt-2 border-t border-[#242D38]">Notes: {selected.notes}</p>
                )}
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePay}
                  disabled={submitting}
                  className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40"
                >
                  <Check size={16} /> Mark Paid
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/80 transition-all disabled:opacity-40"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}