import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import StatusBadge from '@/components/vantoris/StatusBadge';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import InternalComments from '@/components/vantoris/InternalComments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckSquare, Square, Check, X, ShieldCheck, Mail } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';
import { sendTransactionEmail } from '@/lib/transactionEmails';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VerificationRequests() {
  const [requests, setRequests] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [reqs, accts, usrs] = await Promise.all([
        base44.entities.VerificationRequest.list('-created_date', 100),
        base44.entities.Account.list('-created_date', 100),
        base44.entities.User.list('-created_date', 100),
      ]);
      setRequests(reqs);
      setAccounts(accts);
      setUsers(usrs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getAccount(id) { return accounts.find(a => a.id === id); }
  function getUser(id) { return users.find(u => u.id === id); }

  const pendingReqs = requests.filter(r => r.status === 'pending');

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }
  function toggleSelectAll() {
    if (selectedIds.length === pendingReqs.length) setSelectedIds([]);
    else setSelectedIds(pendingReqs.map(r => r.id));
  }

  async function approveOne(req, notes, balanceOverride) {
    const account = getAccount(req.account_id);
    const currentBalance = balanceOverride !== undefined ? balanceOverride : (account?.balance || 0);
    const newBalance = currentBalance + Math.abs(req.amount);
    await base44.entities.Transaction.create({
      account_id: req.account_id,
      type: req.method === 'Opening Contribution' ? 'opening_balance' : 'deposit',
      amount: Math.abs(req.amount),
      description: `${req.method} — ${req.reference || 'No reference'}`,
      balance_after: newBalance,
      created_by_admin: true,
    });
    await base44.entities.Account.update(req.account_id, { balance: newBalance });
    await base44.entities.VerificationRequest.update(req.id, { status: 'approved', admin_notes: notes });
    await base44.entities.Notification.create({
      user_id: req.user_id,
      title: 'Funding Verified',
      message: `Your ${req.method} of ${formatCurrency(Math.abs(req.amount))} has been verified and credited to your account.`,
      type: 'success',
    });
    await sendTransactionEmail({
      user_id: req.user_id,
      account,
      type: req.method === 'Opening Contribution' ? 'opening_balance' : 'deposit',
      amount: Math.abs(req.amount),
      description: `${req.method} — ${req.reference || 'No reference'}`,
      newBalance,
    });
    await logAuditEntry({
      action_type: 'transaction_created',
      description: `Verification approved: ${formatCurrency(Math.abs(req.amount))} via ${req.method}`,
      details: `Request ID: ${req.id}, Notes: ${notes || 'None'}`,
      account_id: req.account_id,
      amount: Math.abs(req.amount),
      balance_before: currentBalance,
      balance_after: newBalance,
      target_user_id: req.user_id,
    });
  }

  async function rejectOne(req, notes) {
    await base44.entities.VerificationRequest.update(req.id, { status: 'rejected', admin_notes: notes });
    await base44.entities.Notification.create({
      user_id: req.user_id,
      title: 'Funding Rejected',
      message: `Your ${req.method} of ${formatCurrency(Math.abs(req.amount))} was not approved. ${notes || ''}`,
      type: 'warning',
    });
    await logAuditEntry({
      action_type: 'withdrawal_rejected',
      description: `Verification rejected: ${formatCurrency(Math.abs(req.amount))} via ${req.method}`,
      details: `Request ID: ${req.id}, Reason: ${notes || 'No reason provided'}`,
      account_id: req.account_id,
      amount: Math.abs(req.amount),
      target_user_id: req.user_id,
    });
  }

  async function handleApprove() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await approveOne(selected, adminNotes);
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

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    const balanceMap = {};
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const req = requests.find(r => r.id === id);
      if (!req) continue;
      try {
        const acct = getAccount(req.account_id);
        const baseBalance = balanceMap[req.account_id] !== undefined ? balanceMap[req.account_id] : (acct?.balance || 0);
        await approveOne(req, 'Bulk approved', baseBalance);
        balanceMap[req.account_id] = baseBalance + Math.abs(req.amount);
        ok++;
      } catch (e) {
        console.error('Bulk approve failed for', id, e);
        fail++;
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadData();
    setSubmitting(false);
  }

  async function handleBulkReject() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const req = requests.find(r => r.id === id);
      if (!req) continue;
      try {
        await rejectOne(req, 'Bulk rejected');
        ok++;
      } catch (e) {
        console.error('Bulk reject failed for', id, e);
        fail++;
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadData();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Verification Requests" description="Review and process funding submissions" icon={ShieldCheck}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  // Analytics data
  const statusData = [
    { name: 'Pending', value: requests.filter(r => r.status === 'pending').length, fill: '#B08D57' },
    { name: 'Approved', value: requests.filter(r => r.status === 'approved').length, fill: '#22c55e' },
    { name: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, fill: '#ef4444' },
  ];

  const methodData = {};
  requests.forEach(req => {
    methodData[req.method] = (methodData[req.method] || 0) + 1;
  });
  const methodChartData = Object.entries(methodData).map(([method, count]) => ({
    name: method,
    count,
  }));

  const totalAmount = requests.reduce((sum, r) => sum + (Math.abs(r.amount) || 0), 0);
  const approvedAmount = requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (Math.abs(r.amount) || 0), 0);
  const pendingAmount = requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + (Math.abs(r.amount) || 0), 0);

  return (
    <OperationsPageLayout title="Verification Requests" description="Review and process funding submissions" icon={ShieldCheck}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Total Amount</p>
          <p className="text-white font-bold text-2xl">{formatCurrency(totalAmount)}</p>
          <p className="text-[#AAB4C3] text-xs mt-1">{requests.length} requests</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Pending Amount</p>
          <p className="text-brass font-bold text-2xl">{formatCurrency(pendingAmount)}</p>
          <p className="text-[#AAB4C3] text-xs mt-1">{pendingReqs.length} waiting</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Approved Amount</p>
          <p className="text-emerald-400 font-bold text-2xl">{formatCurrency(approvedAmount)}</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="vantoris-card p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Status Distribution</h3>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#AAB4C3] text-center py-12">No requests yet</p>
          )}
        </div>

        {/* Requests by Method */}
        <div className="vantoris-card p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Requests by Method</h3>
          {methodChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={methodChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
                <XAxis dataKey="name" stroke="#AAB4C3" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#AAB4C3" />
                <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#B08D57" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#AAB4C3] text-center py-12">No requests yet</p>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {pendingReqs.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${bulkMode ? 'bg-brass/15 text-brass' : 'bg-[#242D38] text-[#AAB4C3] hover:text-white'}`}
          >
            <CheckSquare size={14} /> Bulk Select
          </button>
          {bulkMode && selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[#AAB4C3] text-xs">{selectedIds.length} selected</span>
              <button onClick={handleBulkApprove} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-olive text-white rounded-xl text-xs font-semibold hover:bg-olive/80 transition-all disabled:opacity-40">
                <Check size={14} /> Bulk Approve ({selectedIds.length})
              </button>
              <button onClick={handleBulkReject} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-crimson text-white rounded-xl text-xs font-semibold hover:bg-crimson/80 transition-all disabled:opacity-40">
                <X size={14} /> Bulk Reject ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      )}

      <div className="hidden md:block vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              {bulkMode && (
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-[#AAB4C3] hover:text-brass">
                    {selectedIds.length === pendingReqs.length && pendingReqs.length > 0 ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                  </button>
                </th>
              )}
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Member</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Account</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Method</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Reference</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => {
              const acct = getAccount(req.account_id);
              const user = getUser(req.user_id);
              const isPending = req.status === 'pending';
              return (
                <tr key={req.id} className={`border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all ${selectedIds.includes(req.id) ? 'bg-brass/5' : ''}`}>
                  {bulkMode && (
                    <td className="px-3 py-4">
                      {isPending ? (
                        <button onClick={() => toggleSelect(req.id)} className="text-[#AAB4C3] hover:text-brass">
                          {selectedIds.includes(req.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                        </button>
                      ) : <span className="inline-block w-4" />}
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <p className="text-white font-medium text-sm">{user?.full_name || '—'}</p>
                    <p className="text-[#AAB4C3] text-xs">{user?.email || ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white text-xs font-medium">{acct?.account_name || '—'}</p>
                    <p className="text-[#AAB4C3] text-xs font-mono">{acct?.account_number || ''}</p>
                  </td>
                  <td className="px-5 py-4 text-emerald-400 font-semibold">{formatCurrency(Math.abs(req.amount))}</td>
                  <td className="px-5 py-4 text-white text-xs">{req.method}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs font-mono">{req.reference || '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-5 py-4">
                    {isPending && (
                      <button onClick={() => setSelected(req)} className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan={bulkMode ? 8 : 7} className="py-12 text-center text-[#AAB4C3]">No verification requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {requests.map(req => {
          const acct = getAccount(req.account_id);
          const user = getUser(req.user_id);
          const isPending = req.status === 'pending';
          return (
            <div key={req.id} className={`vantoris-card p-4 space-y-2 ${selectedIds.includes(req.id) ? 'border-brass/40' : ''}`}>
              {bulkMode && isPending && (
                <button onClick={() => toggleSelect(req.id)} className="flex items-center gap-2 text-xs text-[#AAB4C3]">
                  {selectedIds.includes(req.id) ? <CheckSquare size={14} className="text-brass" /> : <Square size={14} />}
                  {selectedIds.includes(req.id) ? 'Selected' : 'Select'}
                </button>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{user?.full_name || '—'}</p>
                  <p className="text-[#AAB4C3] text-xs">{user?.email || ''}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium">{acct?.account_name || '—'}</p>
                  <p className="text-[#AAB4C3] text-xs font-mono">{acct?.account_number || ''}</p>
                </div>
                <p className="text-emerald-400 font-semibold text-sm">{formatCurrency(Math.abs(req.amount))}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white text-xs">{req.method}</span>
                <span className="text-[#AAB4C3] text-xs font-mono truncate ml-2">{req.reference || '—'}</span>
              </div>
              {isPending && !bulkMode && (
                <button onClick={() => setSelected(req)} className="w-full py-2 bg-brass/15 text-brass rounded-lg text-xs font-medium">
                  Review
                </button>
              )}
            </div>
          );
        })}
        {requests.length === 0 && <p className="text-center text-[#AAB4C3] py-8">No verification requests</p>}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Review Funding Submission</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-4 space-y-2">
                <div className="flex justify-between"><span className="text-[#AAB4C3] text-xs">Amount</span><span className="text-emerald-400 font-bold text-lg">{formatCurrency(Math.abs(selected.amount))}</span></div>
                <div className="flex justify-between"><span className="text-[#AAB4C3] text-xs">Method</span><span className="text-white text-sm">{selected.method}</span></div>
                <div className="flex justify-between"><span className="text-[#AAB4C3] text-xs">Reference</span><span className="text-white text-sm font-mono">{selected.reference || '—'}</span></div>
                <div className="flex justify-between"><span className="text-[#AAB4C3] text-xs">Account Balance</span><span className="text-white text-sm">{formatCurrency(getAccount(selected.account_id)?.balance || 0)}</span></div>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none" rows={3} />
              </div>
              <InternalComments entityType="verification_request" entityId={selected.id} />
              <div className="flex gap-3">
                <button onClick={handleApprove} disabled={submitting} className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40">
                  <Check size={16} /> Approve & Credit
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