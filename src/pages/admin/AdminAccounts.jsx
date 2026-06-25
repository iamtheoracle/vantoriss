import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showTxn, setShowTxn] = useState(null);
  const [txnForm, setTxnForm] = useState({ type: 'deposit', amount: '', description: '', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    const accts = await base44.entities.Account.list('-created_date', 50);
    setAccounts(accts);
    setLoading(false);
  }

  async function handleAddTransaction() {
    if (!showTxn) return;
    setSubmitting(true);
    try {
      const amount = parseFloat(txnForm.amount);
      let newBalance = showTxn.balance;
      if (txnForm.type === 'deposit') newBalance += amount;
      else if (txnForm.type === 'withdrawal') newBalance -= amount;
      else newBalance += amount; // adjustment can be negative

      await base44.entities.Transaction.create({
        account_id: showTxn.id,
        type: txnForm.type,
        amount: txnForm.type === 'withdrawal' ? -Math.abs(amount) : amount,
        description: txnForm.description,
        reference: txnForm.reference,
        balance_after: newBalance,
        created_by_admin: true,
      });

      await base44.entities.Account.update(showTxn.id, { balance: newBalance });

      // Notify member
      const typeLabel = txnForm.type === 'deposit' ? 'Deposit Received'
        : txnForm.type === 'withdrawal' ? 'Withdrawal Processed'
        : 'Account Adjustment';
      await base44.entities.Notification.create({
        user_id: showTxn.user_id,
        title: typeLabel,
        message: `${txnForm.description || typeLabel}: ${formatCurrency(Math.abs(amount))}`,
        type: txnForm.type === 'withdrawal' ? 'action' : 'success',
      });

      setShowTxn(null);
      setTxnForm({ type: 'deposit', amount: '', description: '', reference: '' });
      loadAccounts();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  const filtered = accounts.filter(a =>
    (a.account_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.account_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Accounts</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">{accounts.length} total accounts</p>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search accounts..."
          className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
        />
      </div>

      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Account</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Number</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Balance</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(acct => (
              <tr key={acct.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                <td className="px-5 py-4 text-white font-medium">{acct.account_name}</td>
                <td className="px-5 py-4 text-[#AAB4C3] font-mono text-xs">{acct.account_number}</td>
                <td className="px-5 py-4 text-white">{acct.account_type}</td>
                <td className="px-5 py-4 text-white font-semibold">{formatCurrency(acct.balance)}</td>
                <td className="px-5 py-4"><StatusBadge status={acct.status} /></td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => setShowTxn(acct)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all"
                  >
                    <Plus size={12} /> Add Txn
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-[#AAB4C3]">No accounts found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!showTxn} onOpenChange={() => setShowTxn(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Transaction</DialogTitle>
          </DialogHeader>
          {showTxn && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-3">
                <p className="text-white text-sm font-medium">{showTxn.account_name}</p>
                <p className="text-[#AAB4C3] text-xs">Balance: {formatCurrency(showTxn.balance)}</p>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Type</label>
                <select
                  value={txnForm.type}
                  onChange={e => setTxnForm({ ...txnForm, type: e.target.value })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
                <input
                  type="number"
                  value={txnForm.amount}
                  onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Description</label>
                <input
                  value={txnForm.description}
                  onChange={e => setTxnForm({ ...txnForm, description: e.target.value })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="e.g. Wire deposit from client"
                />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Reference</label>
                <input
                  value={txnForm.reference}
                  onChange={e => setTxnForm({ ...txnForm, reference: e.target.value })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="e.g. WT-2025-001"
                />
              </div>
              <button
                disabled={!txnForm.amount || submitting}
                onClick={handleAddTransaction}
                className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40"
              >
                {submitting ? 'Processing...' : 'Add Transaction'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}