import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, FileText, ExternalLink, BellRing, Trash2, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

export default function AdminKYC() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [openingDocument, setOpeningDocument] = useState('');
  const [reminderResult, setReminderResult] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkNotes, setBulkNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    const apps = await base44.entities.Application.list('-created_date', 50);
    setApplications(apps);
    setLoading(false);
  }

  async function performKycMutation(app, decision, rawNotes = '') {
    const adminNotes = rawNotes.trim();
    if (!app?.id || typeof app.updated_date !== 'string' || !app.updated_date) {
      throw new Error('The application revision is missing. Refresh the KYC queue before retrying.');
    }
    if (!['approved', 'rejected', 'reset'].includes(decision)) {
      throw new Error('Unsupported KYC decision.');
    }
    if (decision !== 'approved' && !adminNotes) {
      throw new Error('A review reason is required for rejection or document reset.');
    }
    if (decision === 'reset' && app.kyc_status !== 'rejected') {
      throw new Error('Documents can only be reset after a rejected KYC review.');
    }

    const operationScope = `kyc-review:${await fingerprintMutationScope(JSON.stringify({
      applicationId: app.id,
      decision,
      expectedUpdatedDate: app.updated_date,
      expectedKycStatus: app.kyc_status,
      adminNotes,
    }))}`;
    const idempotencyKey = await getMutationIdempotencyKey(operationScope);
    const response = await base44.functions.invoke('reviewKYCApplication', {
      application_id: app.id,
      decision,
      expected_updated_date: app.updated_date,
      expected_kyc_status: app.kyc_status,
      admin_notes: adminNotes,
      idempotency_key: idempotencyKey,
    });
    const result = response?.data || response;
    const savedApplication = result?.application;
    const expectedStatus = decision === 'reset' ? 'not_started' : decision;
    if (
      result?.success !== true ||
      result?.operation_id !== idempotencyKey ||
      result?.audit_recorded !== true ||
      savedApplication?.id !== app.id ||
      savedApplication?.user_id !== app.user_id ||
      savedApplication?.kyc_status !== expectedStatus ||
      typeof savedApplication?.updated_date !== 'string' ||
      savedApplication.updated_date === app.updated_date ||
      (decision === 'approved' && (
        result?.kyc_verified !== true ||
        !Array.isArray(savedApplication.kyc_documents) ||
        savedApplication.kyc_documents.length === 0
      )) ||
      (decision === 'rejected' && result?.documents_unchanged !== true) ||
      (decision === 'reset' && (
        !Array.isArray(savedApplication.kyc_documents) ||
        savedApplication.kyc_documents.length !== 0 ||
        result?.documents_retained !== true
      ))
    ) {
      throw new Error(result?.error || 'The server did not confirm the audited KYC decision and document-retention contract. Retry only with the same operation.');
    }
    await clearMutationIdempotencyKey(operationScope);
    return savedApplication;
  }

  async function handleOpenKycDocument(documentLocator) {
    if (!selected?.id || !selected.updated_date || typeof documentLocator !== 'string') {
      toast({ title: 'Document unavailable', description: 'The application revision is missing. Refresh the KYC queue and try again.', variant: 'destructive' });
      return;
    }
    const documentWindow = window.open('about:blank', '_blank');
    if (!documentWindow) {
      toast({ title: 'Popup blocked', description: 'Allow a new tab to open the short-lived, access-controlled document view.', variant: 'destructive' });
      return;
    }
    documentWindow.opener = null;
    setOpeningDocument(documentLocator);
    let operationScope = '';
    try {
      operationScope = `kyc-document-view:${await fingerprintMutationScope(JSON.stringify({
        applicationId: selected.id,
        documentLocator,
        expectedUpdatedDate: selected.updated_date,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('getKYCDocumentAccess', {
        application_id: selected.id,
        document_locator: documentLocator,
        expected_updated_date: selected.updated_date,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      let viewUrl;
      try { viewUrl = new URL(result?.view_url); } catch { viewUrl = null; }
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        !viewUrl ||
        viewUrl.protocol !== 'https:' ||
        viewUrl.username ||
        viewUrl.password ||
        viewUrl.hash ||
        typeof result?.expires_at !== 'string' ||
        Date.parse(result.expires_at) <= Date.now() ||
        Date.parse(result.expires_at) > Date.now() + 5 * 60 * 1000
      ) {
        throw new Error(result?.error || 'The document service did not authorize a short-lived private view.');
      }
      documentWindow.location.replace(viewUrl.href);
      await clearMutationIdempotencyKey(operationScope);
    } catch (err) {
      documentWindow.close();
      toast({ title: 'Document access unavailable', description: err?.response?.data?.error || err.message || 'The private document could not be opened.', variant: 'destructive' });
    } finally {
      setOpeningDocument('');
    }
  }

  async function handleAction(status) {
    if (!selected) return;
    setSubmitting(true);
    try {
      await performKycMutation(selected, status, notes);
      setSelected(null);
      setNotes('');
      await loadApps().catch(() => {});
      toast({ title: `KYC ${status}`, description: `${selected.full_name}'s KYC has been ${status}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'KYC action unavailable', description: e?.response?.data?.error || e.message || 'Unable to update KYC status.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteKyc() {
    if (!selected) return;
    if (!notes.trim()) {
      toast({ title: 'Reset reason required', description: 'Enter a reason before clearing linked document references.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await performKycMutation(selected, 'reset', notes);
      setSelected(null);
      setNotes('');
      await loadApps().catch(() => {});
      toast({ title: 'KYC document links reset', description: `${selected.full_name}'s linked documents were cleared; stored objects remain subject to retention policy.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Reset unavailable', description: e?.response?.data?.error || e.message || 'Unable to reset KYC documents.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendKycReminders() {
    setSendingReminders(true);
    try {
      const operationScope = `kyc-reminders:${await fingerprintMutationScope('pending-kyc-older-than-3-days')}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('sendKYCReminders', {
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const summary = result?.summary;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        !Number.isSafeInteger(summary?.eligible) ||
        !Number.isSafeInteger(summary?.queued) ||
        !Number.isSafeInteger(summary?.skipped) ||
        summary.eligible < 0 ||
        summary.queued < 0 ||
        summary.skipped < 0 ||
        summary.queued + summary.skipped > summary.eligible
      ) {
        throw new Error(result?.error || 'The server did not confirm the audited KYC reminder queue operation.');
      }
      await clearMutationIdempotencyKey(operationScope);
      setReminderResult({ sent: summary.queued, total: summary.eligible, skipped: summary.skipped });
      toast({
        title: 'KYC reminders queued',
        description: `${summary.queued} queued, ${summary.skipped} already queued or skipped.`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Reminder queue unavailable', description: e?.response?.data?.error || e.message || 'Unable to queue KYC reminders.', variant: 'destructive' });
    } finally {
      setSendingReminders(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    const pendingApps = applications.filter(a => a.kyc_status !== 'approved' && (a.kyc_documents || []).length > 0);
    if (selectedIds.length === pendingApps.length) setSelectedIds([]);
    else setSelectedIds(pendingApps.map(a => a.id));
  }

  async function approveOne(app) {
    return performKycMutation(app, 'approved');
  }

  async function rejectOne(app, reason) {
    return performKycMutation(app, 'rejected', reason);
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const app = applications.find(a => a.id === id);
      if (app) {
        try { await approveOne(app); ok++; } catch (e) { console.error('Bulk approve failed for', id, e); fail++; }
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadApps();
    toast({ title: 'Bulk approve complete', description: `${ok} approved${fail > 0 ? `, ${fail} failed` : ''}.` });
    setSubmitting(false);
  }

  async function handleBulkReject() {
    if (selectedIds.length === 0) return;
    if (!bulkNotes.trim()) {
      toast({ title: 'Bulk rejection reason required', description: 'Enter a shared reason before rejecting selected KYC applications.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const app = applications.find(a => a.id === id);
      if (app) {
        try { await rejectOne(app, bulkNotes); ok++; } catch (e) { console.error('Bulk reject failed for', id, e); fail++; }
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    setBulkNotes('');
    loadApps();
    toast({ title: 'Bulk reject complete', description: `${ok} rejected${fail > 0 ? `, ${fail} failed` : ''}.` });
    setSubmitting(false);
  }

  const kycApps = applications.filter(a => a.kyc_status !== 'approved');

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">KYC Review</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Verify member identity documents</p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSendKycReminders}
            disabled={sendingReminders}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brass/15 text-brass rounded-xl text-sm font-medium hover:bg-brass/25 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            <BellRing size={16} /> {sendingReminders ? 'Sending...' : 'Send Reminders'}
          </button>
          {reminderResult && (
            <span className="text-[#AAB4C3] text-sm">
              {reminderResult.sent > 0
                ? `✓ Queued ${reminderResult.sent} reminder${reminderResult.sent !== 1 ? 's' : ''}`
                : reminderResult.total === 0
                  ? 'No stale KYC applications found'
                  : `${reminderResult.skipped} reminder${reminderResult.skipped !== 1 ? 's were' : ' was'} already queued or skipped`}
            </span>
          )}
        </div>
        {kycApps.length > 0 && (
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${bulkMode ? 'bg-brass/15 text-brass' : 'bg-[#242D38] text-[#AAB4C3] hover:text-white'}`}
          >
            <CheckSquare size={14} /> Bulk Review
          </button>
        )}
      </div>

      {bulkMode && selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 p-4 bg-brass/10 rounded-lg border border-brass/20">
          <span className="text-[#AAB4C3] text-xs">{selectedIds.length} selected</span>
          <textarea
            value={bulkNotes}
            onChange={event => setBulkNotes(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Shared rejection reason (required for bulk rejection)"
            aria-label="Bulk KYC rejection reason"
            className="w-full sm:flex-1 bg-[#242D38] border border-[#242D38] rounded-xl px-3 py-2 text-white text-xs focus:border-brass/50 focus:outline-none resize-none"
          />
          <button onClick={handleBulkApprove} disabled={submitting} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-olive text-white rounded-xl text-xs font-semibold hover:bg-olive/80 transition-all disabled:opacity-40 whitespace-nowrap">
            <Check size={14} /> Approve
          </button>
          <button onClick={handleBulkReject} disabled={submitting} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-crimson text-white rounded-xl text-xs font-semibold hover:bg-crimson/80 transition-all disabled:opacity-40 whitespace-nowrap">
            <X size={14} /> Reject
          </button>
        </div>
      )}

      <div className="vantoris-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              {bulkMode && (
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-[#AAB4C3] hover:text-brass">
                    {selectedIds.length === kycApps.length && kycApps.length > 0 ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                  </button>
                </th>
              )}
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Applicant</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Documents</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">KYC Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {kycApps.map(app => (
              <tr key={app.id} className={`border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all ${selectedIds.includes(app.id) ? 'bg-brass/5' : ''}`}>
                {bulkMode && (
                  <td className="px-3 py-4">
                    <button onClick={() => toggleSelect(app.id)} disabled={(app.kyc_documents || []).length === 0} className="text-[#AAB4C3] hover:text-brass disabled:opacity-30" >
                      {selectedIds.includes(app.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                    </button>
                  </td>
                )}
                <td className="px-5 py-4">
                  <p className="text-white font-medium">{app.full_name}</p>
                  <p className="text-[#AAB4C3] text-xs">{app.email}</p>
                </td>
                <td className="px-5 py-4 text-white">{app.account_type}</td>
                <td className="px-5 py-4">
                  <span className="text-[#AAB4C3] text-xs">{(app.kyc_documents || []).length} document(s)</span>
                </td>
                <td className="px-5 py-4"><StatusBadge status={app.kyc_status} /></td>
                <td className="px-5 py-4">
                  {bulkMode ? (
                    <button onClick={() => toggleSelect(app.id)} className="text-[#AAB4C3] hover:text-brass">
                      {selectedIds.includes(app.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelected(app)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        app.kyc_status === 'rejected'
                          ? 'bg-crimson/15 text-red-400 hover:bg-crimson/25'
                          : app.kyc_status === 'not_started'
                            ? 'bg-olive/15 text-emerald-400 hover:bg-olive/25'
                            : 'bg-brass/15 text-brass hover:bg-brass/25'
                      }`}
                    >
                      {app.kyc_status === 'rejected' ? 'Re-review' : 'Review'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {kycApps.length === 0 && (
              <tr>
                <td colSpan={bulkMode ? 6 : 5} className="py-12 text-center text-[#AAB4C3]">No KYC submissions to review</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">KYC Document Review</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-4">
                <p className="text-white font-medium">{selected.full_name}</p>
                <p className="text-[#AAB4C3] text-xs">{selected.email}</p>
              </div>

              {/* Documents */}
              <div>
                <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Submitted Documents</p>
                {(selected.kyc_documents || []).length > 0 ? (
                  <div className="space-y-2">
                    {selected.kyc_documents.map((doc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleOpenKycDocument(doc)}
                        disabled={openingDocument === doc}
                        className="vantoris-card p-3 flex items-center gap-3 hover:border-brass/30 transition-all text-left w-full disabled:opacity-50"
                      >
                        <FileText size={16} className="text-brass" />
                        <span className="text-white text-sm flex-1">{openingDocument === doc ? 'Opening secure view…' : `Document ${i + 1}`}</span>
                        <ExternalLink size={14} className="text-[#AAB4C3]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#AAB4C3] text-sm">No documents uploaded</p>
                )}
              </div>

              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {selected.kyc_status === 'rejected' && (selected.kyc_documents || []).length > 0 && (
                <button
                  onClick={handleDeleteKyc}
                  disabled={submitting}
                  className="w-full py-2.5 border border-crimson/40 text-red-400 rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/10 transition-all disabled:opacity-40 text-xs font-medium"
                >
                  <Trash2 size={14} /> Clear Linked Documents &amp; Reset
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('approved')}
                  disabled={submitting || (selected.kyc_documents || []).length === 0}
                  className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40"
                >
                  <Check size={16} /> Approve KYC
                </button>
                <button
                  onClick={() => handleAction('rejected')}
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