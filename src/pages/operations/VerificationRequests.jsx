import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import StatusBadge from '@/components/vantoris/StatusBadge';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import InternalComments from '@/components/vantoris/InternalComments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckSquare, Square, Check, X, ShieldCheck } from 'lucide-react';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

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

  async function mutateFundingRequest(req, decision, notes) {
    if (!req?.id || !req.updated_date) {
      throw new Error('This funding request is missing its revision token. Reload the request before retrying.');
    }
    const normalizedNotes = typeof notes === 'string' ? notes.trim() : '';
    const fingerprint = await fingerprintMutationScope(JSON.stringify({
      request_id: req.id,
      decision,
      expected_updated_date: req.updated_date,
      admin_notes: normalizedNotes,
    }));
    const operationScope = `funding.review:${fingerprint}`;
    const idempotencyKey = await getMutationIdempotencyKey(operationScope);
    const response = await base44.functions.invoke('reviewFundingRequest', {
      request_id: req.id,
      decision,
      admin_notes: normalizedNotes,
      expected_updated_date: req.updated_date,
      idempotency_key: idempotencyKey,
    });
    const payload = response?.data || response;
    if (
      payload?.success !== true ||
      payload?.operation_id !== idempotencyKey ||
      payload?.audit_recorded !== true ||
      payload?.request?.id !== req.id ||
      payload?.request?.status !== decision
    ) {
      throw new Error(payload?.error || 'The funding decision was not confirmed. Retry the same action without changing its details.');
    }
    await clearMutationIdempotencyKey(operationScope);
    return payload;
  }

  async function handleApprove() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await mutateFundingRequest(selected, 'approved', adminNotes);
      toast({ title: 'Funding approved', description: 'The transactional service confirmed the funding decision and audit record.' });
      setSelected(null);
      setAdminNotes('');
      await loadData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Approval not confirmed', description: e.response?.data?.error || e.message || 'No success was confirmed. Retry the same request.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await mutateFundingRequest(selected, 'rejected', adminNotes);
      toast({ title: 'Funding rejected', description: 'The transactional service confirmed the decision and audit record.' });
      setSelected(null);
      setAdminNotes('');
      await loadData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Rejection not confirmed', description: e.response?.data?.error || e.message || 'No success was confirmed. Retry the same request.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkApprove() {
    const targets = selectedIds.map(id => requests.find(request => request.id === id)).filter(Boolean);
    if (targets.length === 0) return;
    setSubmitting(true);
    let succeeded = 0;
    let failed = 0;
    for (const request of targets) {
      try {
        await mutateFundingRequest(request, 'approved', 'Bulk approved');
        succeeded += 1;
      } catch (error) {
        console.error('Bulk funding approval not confirmed for', request.id, error);
        failed += 1;
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    await loadData();
    toast({
      title: 'Bulk funding review finished',
      description: `${succeeded} confirmed, ${failed} not confirmed. Failed operations retain their idempotency keys for safe retries.`,
      ...(failed > 0 ? { variant: 'destructive' } : {}),
    });
    setSubmitting(false);
  }

  async function handleBulkReject() {
    const targets = selectedIds.map(id => requests.find(request => request.id === id)).filter(Boolean);
    if (targets.length === 0) return;
    setSubmitting(true);
    let succeeded = 0;
    let failed = 0;
    for (const request of targets) {
      try {
        await mutateFundingRequest(request, 'rejected', 'Bulk rejected');
        succeeded += 1;
      } catch (error) {
        console.error('Bulk funding rejection not confirmed for', request.id, error);
        failed += 1;
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    await loadData();
    toast({
      title: 'Bulk funding review finished',
      description: `${succeeded} confirmed, ${failed} not confirmed. Failed operations retain their idempotency keys for safe retries.`,
      ...(failed > 0 ? { variant: 'destructive' } : {}),
    });
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

  return (
    <OperationsPageLayout title="Verification Requests" description="Review and process funding submissions" icon={ShieldCheck}>
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
              <button onClick={handleBulkApprove} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-xl text-xs font-semibold hover:bg-mint/80 transition-all disabled:opacity-40">
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
                <button onClick={handleApprove} disabled={submitting} className="flex-1 py-3 bg-mint text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mint/80 transition-all disabled:opacity-40">
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