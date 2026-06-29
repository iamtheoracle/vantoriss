import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import StatusBadge from '@/components/vantoris/StatusBadge';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckSquare, Square, Check, X, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';
import { sendTransactionEmail } from '@/lib/transactionEmails';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [wds, accts] = await Promise.all([
      base44.entities.WithdrawalRequest.list('-created_date', 100),
      base44.entities.Account.list('-created_date', 100),
    ]);
    setWithdrawals(wds);
    setAccounts(accts);
    setLoading(false);
  }

  function getAccount(id) { return accounts.find(a => a.id === id); }

  const pendingWds = withdrawals.filter(w => w.status === 'pending');

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }
  function toggleSelectAll() {
    if (selectedIds.length === pendingWds.length) setSelectedIds([]);
    else setSelectedIds(pendingWds.map(w => w.id));
  }

  async function payOne(wd, notes) {
    const account = getAccount(wd.account_id);
    const currentBalance = account?.balance || 0;
    const newBalance = currentBalance - Math.abs(wd.amount);
    await base44.entities.Transaction.create({
      account_id: wd.account_id,
      type: 'withdrawal',
      amount: -Math.abs(wd.amount),
      description: `Withdrawal - ${wd.method}`,
      reference: `WD-${wd.id.slice(-6)}`,
      balance_after: newBalance,
      created_by_admin: true,
    });
    await base44.entities.Account.update(wd.account_id, { balance: newBalance });
    await base44.entities.WithdrawalRequest.update(wd.id, { status: 'paid', admin_notes: notes });
    await base44.entities.Notification.create({
      user_id: wd.user_id,
      title: 'Withdrawal Processed',
      message: `Your withdrawal of ${formatCurrency(Math.abs(wd.amount))} via ${wd.method} has been processed.`,
      type: 'success',
    });
    await sendTransactionEmail({
      user_id: wd.user_id,
      account,
      type: 'withdrawal',
      amount: Math.abs(wd.amount),
      description: `Withdrawal - ${wd.method}`,
      newBalance,
    });
    await logAuditEntry({
      action_type: 'withdrawal_processed',
      description: `Withdrawal processed: ${formatCurrency(Math.abs(wd.amount))} via ${wd.method}`,
      details: `Request ID: ${wd.id}, Notes: ${notes || 'None'}`,
      account_id: wd.account_id,
      amount: -Math.abs(wd.amount),
      balance_before: currentBalance,
      balance_after: newBalance,
      target_user_id: wd.user_id,
    });
  }

  async function rejectOne(wd, notes) {
    await base44.entities.WithdrawalRequest.update(wd.id, { status: 'rejected', admin_notes: notes });
    await base44.entities.Notification.create({
      user_id: wd.user_id,
      title: 'Withdrawal Rejected',
      message: `Your withdrawal request of ${formatCurrency(Math.abs(wd.amount))} was not approved. ${notes || ''}`,
      type: 'warning',
    });
    await logAuditEntry({
      action_type: 'withdrawal_rejected',
      description: `Withdrawal rejected: ${formatCurrency(Math.abs(wd.amount))} via ${wd.method}`,
      details: `Request ID: ${wd.id}, Reason: ${notes || 'No reason provided'}`,
      account_id: wd.account_id,
      amount: -Math.abs(wd.amount),
      target_user_id: wd.user_id,
    });
  }

  async function handlePay() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await payOne(selected, adminNotes);
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
      await rejectOne(selected, adminNotes);
      setSelected(null);
      setAdminNotes('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function handleBulkPay() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    const balanceMap = {};
    for (const id of selectedIds) {
      const wd = withdrawals.find(w => w.id === id);
      if (!wd) continue;
      try {
        const acct = getAccount(wd.account_id);
        const baseBalance = balanceMap[wd.account_id] !== undefined ? balanceMap[wd.account_id] : (acct?.balance || 0);
        await payOne({ ...wd, account_id: wd.account_id }, 'Bulk approved');
        balanceMap[wd.account_id] = baseBalance - Math.abs(wd.amount);
      } catch (e) { console.error('Bulk pay failed for', id, e); }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadData();
    setSubmitting(false);
  }

  async function handleBulkReject() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    for (const id of selectedIds) {
      const wd = withdrawals.find(w => w.id === id);
      if (!wd) continue;
      try { await rejectOne(wd, 'Bulk rejected'); } catch (e) { console.error('Bulk reject failed for', id, e); }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadData();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Withdrawals" description="Review and process withdrawal requests" icon={ArrowUpRight}>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Withdrawals" description="Review and process withdrawal requests" icon={ArrowUpRight}>
      {/* Bulk Action Bar */}
      {pendingWds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${bulkMode ? 'bg-brass/15 text-brass' : 'bg-[#242D38] text-[#AAB4C3] hover:text-white'}`}
          >
            <CheckSquare size={14} /> Bulk Select
          </button>
          {bulkMode && selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[#AAB4C3] text-xs">{selectedIds.length} selected</span>
              <button onClick={handleBulkPay} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-olive text-white rounded-xl text-xs font-semibold hover:bg-olive/80 transition-all disabled:opacity-40">
                <Check size={14} /> Bulk Pay ({selectedIds.length})
              </button>
              <button onClick={handleBulkReject} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-crimson text-white rounded-xl text-xs font-semibold hover:bg-crimson/80 transition-all disabled:opacity-40">
                <X size={14} /> Bulk Reject ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              {bulkMode && (
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-[#AAB4C3] hover:text-brass">
                    {selectedIds.length === pendingWds.length && pendingWds.length > 0 ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                  </button>
                </th>
              )}
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
              const isPending = wd.status === 'pending';
              return (
                <tr key={wd.id} className={`border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all ${selectedIds.includes(wd.id) ? 'bg-brass/5' : ''}`}>
                  {bulkMode && (
                    <td className="px-3 py-4">
                      {isPending ? (
                        <button onClick={() => toggleSelect(wd.id)} className="text-[#AAB4C3] hover:text-brass">
                          {selectedIds.includes(wd.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                        </button>
                      ) : <span className="inline-block w-4" />}
                    </td>
                  )}
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
                    {isPending && !bulkMode && (
                      <button onClick={() => setSelected(wd)} className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all">
                        Review
                      </button>
                    )}
                    {isPending && bulkMode && (
                      <button onClick={() => toggleSelect(wd.id)} className="text-[#AAB4C3] hover:text-brass">
                        {selectedIds.includes(wd.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {withdrawals.length === 0 && (
              <tr><td colSpan={bulkMode ? 7 : 6} className="py-12 text-center text-[#AAB4C3]">No withdrawal requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {withdrawals.map(wd => {
          const acct = getAccount(wd.account_id);
          const isPending = wd.status === 'pending';
          return (
            <div key={wd.id} className={`vantoris-card p-4 space-y-2 ${selectedIds.includes(wd.id) ? 'border-brass/40' : ''}`}>
              {bulkMode && isPending && (
                <button onClick={() => toggleSelect(wd.id)} className="flex items-center gap-2 text-xs text-[#AAB4C3]">
                  {selectedIds.includes(wd.id) ? <CheckSquare size={14} className="text-brass" /> : <Square size={14} />}
                  {selectedIds.includes(wd.id) ? 'Selected' : 'Select'}
                </button>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{acct?.account_name || '—'}</p>
                  <p className="text-[#AAB4C3] text-xs font-mono">{acct?.account_number || ''}</p>
                </div>
                <StatusBadge status={wd.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white text-xs">{wd.method}</span>
                <span className="text-red-400 font-semibold text-sm">{formatCurrency(Math.abs(wd.amount))}</span>
              </div>
              <p className="text-[#AAB4C3]/50 text-[10px]">
                {new Date(wd.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              {isPending && !bulkMode && (
                <button onClick={() => setSelected(wd)} className="w-full py-2 bg-brass/15 text-brass rounded-lg text-xs font-medium">
                  Review
                </button>
              )}
            </div>
          );
        })}
        {withdrawals.length === 0 && <p className="text-center text-[#AAB4C3] py-8">No withdrawal requests</p>}
      </div>

      {/* Review Dialog */}
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
                <button onClick={handlePay} disabled={submitting} className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40">
                  <Check size={16} /> Mark Paid
                </button>
                <button onClick={handleReject} disabled={submitting} className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/80 transition-all disabled:opacity-40">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  );
}