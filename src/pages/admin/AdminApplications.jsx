import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency, generateAccountNumber } from '@/lib/formatCurrency';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, CheckSquare, Square } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    const apps = await base44.entities.Application.list('-created_date', 50);
    setApplications(apps);
    setLoading(false);
  }

  const bulkEligible = applications.filter(a => a.application_status === 'pending' && a.kyc_status === 'approved');

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    if (selectedIds.length === bulkEligible.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bulkEligible.map(a => a.id));
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      for (const id of selectedIds) {
        const app = applications.find(a => a.id === id);
        if (!app) continue;
        const acctNum = generateAccountNumber();
        const account = await base44.entities.Account.create({
          user_id: app.user_id,
          account_number: acctNum,
          account_type: app.account_type,
          account_name: app.business_name
            ? `${app.business_name} (${app.account_type})`
            : `${app.full_name} - ${app.account_type}`,
          balance: 0,
          status: 'active',
          application_id: app.id,
        });
        await base44.entities.Transaction.create({
          account_id: account.id,
          type: 'opening_balance',
          amount: 0,
          description: 'Opening Balance',
          balance_after: 0,
          created_by_admin: true,
        });
        await base44.entities.Application.update(id, {
          application_status: 'approved',
          admin_notes: 'Bulk approved',
        });
        await base44.entities.Notification.create({
          user_id: app.user_id,
          title: 'Account Approved',
          message: `Your ${app.account_type} account has been approved. Account: ${acctNum}`,
          type: 'success',
        });
      }
      setSelectedIds([]);
      setBulkMode(false);
      loadApps();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function handleBulkReject() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      for (const id of selectedIds) {
        const app = applications.find(a => a.id === id);
        if (!app) continue;
        await base44.entities.Application.update(id, {
          application_status: 'rejected',
          admin_notes: 'Bulk rejected',
        });
        await base44.entities.Notification.create({
          user_id: app.user_id,
          title: 'Application Not Approved',
          message: 'Your application was not approved at this time.',
          type: 'warning',
        });
      }
      setSelectedIds([]);
      setBulkMode(false);
      loadApps();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function handleApprove() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const acctNum = generateAccountNumber();
      const balance = parseFloat(openingBalance) || 0;

      // Create the account
      const account = await base44.entities.Account.create({
        user_id: selected.user_id,
        account_number: acctNum,
        account_type: selected.account_type,
        account_name: selected.business_name
          ? `${selected.business_name} (${selected.account_type})`
          : `${selected.full_name} - ${selected.account_type}`,
        balance: balance,
        status: 'active',
        application_id: selected.id,
      });

      // Create opening balance transaction
      if (balance > 0) {
        await base44.entities.Transaction.create({
          account_id: account.id,
          type: 'opening_balance',
          amount: balance,
          description: 'Opening Balance',
          balance_after: balance,
          created_by_admin: true,
        });
      }

      // Update application
      await base44.entities.Application.update(selected.id, {
        application_status: 'approved',
        admin_notes: adminNotes,
        opening_balance: balance,
      });

      // Notify member
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: 'Account Approved',
        message: `Your ${selected.account_type} account has been approved. Account: ${acctNum}`,
        type: 'success',
      });

      await logAuditEntry({
        action_type: 'application_approved',
        description: `Application approved for ${selected.full_name} — ${selected.account_type} account ${acctNum}`,
        details: `Opening balance: ${formatCurrency(balance)}, Notes: ${adminNotes || 'None'}`,
        account_id: account.id,
        amount: balance,
        balance_before: 0,
        balance_after: balance,
        target_user_id: selected.user_id,
      });

      setSelected(null);
      setOpeningBalance('');
      setAdminNotes('');
      loadApps();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function handleReject() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await base44.entities.Application.update(selected.id, {
        application_status: 'rejected',
        admin_notes: adminNotes,
      });
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: 'Application Not Approved',
        message: adminNotes || 'Your application was not approved at this time.',
        type: 'warning',
      });
      await logAuditEntry({
        action_type: 'application_rejected',
        description: `Application rejected for ${selected.full_name}`,
        details: `Reason: ${adminNotes || 'No reason provided'}`,
        target_user_id: selected.user_id,
      });
      setSelected(null);
      setAdminNotes('');
      loadApps();
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
      <h1 className="text-2xl font-bold text-white mb-1">Applications</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Review and approve member applications</p>

      {/* Bulk Action Bar */}
      {bulkEligible.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                bulkMode ? 'bg-brass/15 text-brass' : 'bg-[#242D38] text-[#AAB4C3] hover:text-white'
              }`}
            >
              <CheckSquare size={14} /> Bulk Select
            </button>
            {bulkMode && selectedIds.length > 0 && (
              <span className="text-[#AAB4C3] text-xs">{selectedIds.length} selected</span>
            )}
          </div>
          {bulkMode && selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkApprove}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-olive text-white rounded-xl text-xs font-semibold hover:bg-olive/80 transition-all disabled:opacity-40"
              >
                <Check size={14} /> Bulk Approve ({selectedIds.length})
              </button>
              <button
                onClick={handleBulkReject}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-crimson text-white rounded-xl text-xs font-semibold hover:bg-crimson/80 transition-all disabled:opacity-40"
              >
                <X size={14} /> Bulk Reject ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      )}

      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              {bulkMode && (
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-[#AAB4C3] hover:text-brass transition-all">
                    {selectedIds.length === bulkEligible.length && bulkEligible.length > 0
                      ? <CheckSquare size={16} className="text-brass" />
                      : <Square size={16} />}
                  </button>
                </th>
              )}
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Applicant</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">KYC</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => {
              const isBulkEligible = bulkMode && app.application_status === 'pending' && app.kyc_status === 'approved';
              return (
                <tr key={app.id} className={`border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all ${
                  selectedIds.includes(app.id) ? 'bg-brass/5' : ''
                }`}>
                  {bulkMode && (
                    <td className="px-3 py-4">
                      {isBulkEligible ? (
                        <button onClick={() => toggleSelect(app.id)} className="text-[#AAB4C3] hover:text-brass">
                          {selectedIds.includes(app.id)
                            ? <CheckSquare size={16} className="text-brass" />
                            : <Square size={16} />}
                        </button>
                      ) : (
                        <span className="inline-block w-4" />
                      )}
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{app.full_name}</p>
                    <p className="text-[#AAB4C3] text-xs">{app.email}</p>
                  </td>
                  <td className="px-5 py-4 text-white">{app.account_type}</td>
                  <td className="px-5 py-4"><StatusBadge status={app.kyc_status} /></td>
                  <td className="px-5 py-4"><StatusBadge status={app.application_status} /></td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                    {new Date(app.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    {app.application_status === 'pending' && app.kyc_status === 'approved' && (
                      <button
                        onClick={() => setSelected(app)}
                        className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all"
                      >
                        Review
                      </button>
                    )}
                    {app.application_status === 'pending' && app.kyc_status !== 'approved' && (
                      <span className="text-[#AAB4C3] text-xs">Awaiting KYC</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan={bulkMode ? 7 : 6} className="py-12 text-center text-[#AAB4C3]">No applications</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Review Application</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-4">
                <p className="text-white font-medium">{selected.full_name}</p>
                <p className="text-[#AAB4C3] text-xs">{selected.email}</p>
                <p className="text-[#AAB4C3] text-xs mt-1">Type: {selected.account_type}</p>
                {selected.business_name && <p className="text-[#AAB4C3] text-xs">Business: {selected.business_name}</p>}
                {selected.address && <p className="text-[#AAB4C3] text-xs">Address: {selected.address}</p>}
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Opening Balance (USD)</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                  placeholder="0.00"
                />
                <p className="text-[#AAB4C3] text-[11px] mt-1">Enter the amount received via wire/deposit outside the app</p>
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
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40"
                >
                  <Check size={16} /> Approve
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