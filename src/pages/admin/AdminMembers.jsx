import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users, Search, Plus, Wallet, Download } from 'lucide-react';
import { generateAccountNumber } from '@/lib/formatCurrency';
import { logAuditEntry } from '@/lib/auditLogger';
import { exportToCsv } from '@/lib/exportCsv';
import { sendTransactionEmail } from '@/lib/transactionEmails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const ACCOUNT_TYPES = ['Personal', 'Joint', 'Business', 'Organization'];

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(null);
  const [acctForm, setAcctForm] = useState({ account_type: 'Personal', account_name: '', opening_balance: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [u, a] = await Promise.all([
      base44.entities.User.list('-created_date', 50),
      base44.entities.Account.list('-created_date', 50),
    ]);
    setUsers(u);
    setAccounts(a);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  async function handleCreateAccount() {
    if (!showCreate) return;
    setCreating(true);
    try {
      const acctNum = generateAccountNumber();
      const balance = parseFloat(acctForm.opening_balance) || 0;
      const account = await base44.entities.Account.create({
        user_id: showCreate.id,
        account_number: acctNum,
        account_type: acctForm.account_type,
        account_name: acctForm.account_name || `${showCreate.full_name} - ${acctForm.account_type}`,
        balance: balance,
        status: 'active',
      });
      if (balance > 0) {
        await base44.entities.Transaction.create({
          account_id: account.id,
          type: 'opening_balance',
          amount: balance,
          description: 'Opening Balance',
          balance_after: balance,
          created_by_admin: true,
        });
        await sendTransactionEmail({
          user_id: showCreate.id,
          account,
          type: 'opening_balance',
          amount: balance,
          description: 'Opening Balance',
          newBalance: balance,
        });
      }
      await base44.entities.Notification.create({
        user_id: showCreate.id,
        title: 'New Account Created',
        message: `A ${acctForm.account_type} account has been created for you. Account: ${acctNum}`,
        type: 'success',
      });
      await logAuditEntry({
        action_type: 'account_created',
        description: `Created ${acctForm.account_type} account ${acctNum} for ${showCreate.full_name}`,
        details: `Opening balance: ${formatCurrency(balance)}`,
        account_id: account.id,
        amount: balance,
        balance_before: 0,
        balance_after: balance,
        target_user_id: showCreate.id,
      });
      setShowCreate(null);
      setAcctForm({ account_type: 'Personal', account_name: '', opening_balance: '' });
      loadData();
    } catch (e) { console.error(e); }
    setCreating(false);
  }

  function handleExportMembers() {
    const headers = ['Member Name', 'Email', 'Account Type', 'Account Number', 'Account Name', 'Balance', 'Status', 'Joined'];
    const rows = [];
    for (const member of members) {
      const memberAccts = accounts.filter(a => a.user_id === member.id);
      if (memberAccts.length === 0) {
        rows.push({
          'Member Name': member.full_name || '',
          'Email': member.email || '',
          'Account Type': '—',
          'Account Number': '—',
          'Account Name': '—',
          'Balance': 0,
          'Status': '—',
          'Joined': new Date(member.created_date).toLocaleDateString(),
        });
      } else {
        for (const acct of memberAccts) {
          rows.push({
            'Member Name': member.full_name || '',
            'Email': member.email || '',
            'Account Type': acct.account_type || '',
            'Account Number': acct.account_number || '',
            'Account Name': acct.account_name || '',
            'Balance': acct.balance || 0,
            'Status': acct.status || '',
            'Joined': new Date(member.created_date).toLocaleDateString(),
          });
        }
      }
    }
    exportToCsv('vantoris_members_balances', headers, rows);
  }

  const members = users.filter(u => u.role === 'user');
  const filtered = members.filter(m =>
    (m.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Members</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">{members.length} registered members</p>

      {/* Search + Export */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
          />
        </div>
        <button
          onClick={handleExportMembers}
          className="flex items-center gap-1.5 px-4 py-3 bg-olive/15 text-emerald-400 rounded-xl text-xs font-medium hover:bg-olive/25 transition-all whitespace-nowrap"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Member</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Email</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Accounts</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Total Balance</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Joined</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => {
              const memberAccts = accounts.filter(a => a.user_id === member.id);
              const totalBal = memberAccts.reduce((sum, a) => sum + (a.balance || 0), 0);
              return (
                <tr key={member.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brass/15 flex items-center justify-center">
                        <span className="text-brass text-xs font-bold">{(member.full_name || 'U').charAt(0)}</span>
                      </div>
                      <p className="text-white font-medium">{member.full_name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#AAB4C3]">{member.email}</td>
                  <td className="px-5 py-4 text-white">{memberAccts.length}</td>
                  <td className="px-5 py-4 text-white font-medium">{formatCurrency(totalBal)}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                    {new Date(member.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => { setShowCreate(member); setAcctForm({ account_type: 'Personal', account_name: '', opening_balance: '' }); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all"
                    >
                      <Plus size={12} /> Add Account
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#AAB4C3]">No members found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!showCreate} onOpenChange={() => setShowCreate(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create Account for {showCreate?.full_name}</DialogTitle>
          </DialogHeader>
          {showCreate && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-3">
                <p className="text-white text-sm font-medium">{showCreate.full_name}</p>
                <p className="text-[#AAB4C3] text-xs">{showCreate.email}</p>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Account Type</label>
                <Select
                  value={acctForm.account_type}
                  onValueChange={val => setAcctForm({ ...acctForm, account_type: val })}
                >
                  <SelectTrigger className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242D38] border-[#242D38]">
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="text-white focus:bg-brass/15 focus:text-brass">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Account Name</label>
                <input
                  value={acctForm.account_name}
                  onChange={e => setAcctForm({ ...acctForm, account_name: e.target.value })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder={`${showCreate.full_name} - ${acctForm.account_type}`}
                />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Opening Balance (USD)</label>
                <input
                  type="number"
                  value={acctForm.opening_balance}
                  onChange={e => setAcctForm({ ...acctForm, opening_balance: e.target.value })}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <button
                disabled={creating}
                onClick={handleCreateAccount}
                className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Wallet size={16} /> {creating ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}