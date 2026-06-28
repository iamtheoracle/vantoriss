import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/vantoris/StatusBadge';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import InternalComments from '@/components/vantoris/InternalComments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Wrench } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [reqs, usrs] = await Promise.all([
        base44.entities.ServiceRequest.list('-created_date', 100),
        base44.entities.User.list('-created_date', 100),
      ]);
      setRequests(reqs);
      setUsers(usrs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getUser(id) { return users.find(u => u.id === id); }

  async function handleAction(status) {
    if (!selected) return;
    setSubmitting(true);
    try {
      await base44.entities.ServiceRequest.update(selected.id, {
        status,
        admin_notes: adminNotes,
      });
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: status === 'approved' ? 'Service Request Approved' : 'Service Request Rejected',
        message: status === 'approved'
          ? `Your request for ${selected.service_type} has been approved.`
          : `Your request for ${selected.service_type} was not approved. ${adminNotes || ''}`,
        type: status === 'approved' ? 'success' : 'warning',
      });
      await logAuditEntry({
        action_type: 'application_approved',
        description: `Service request ${status}: ${selected.service_type}`,
        details: `Notes: ${adminNotes || 'None'}`,
        target_user_id: selected.user_id,
      });
      setSelected(null);
      setAdminNotes('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Service Requests" description="Review member service and product requests" icon={Wrench}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Service Requests" description="Review member service and product requests" icon={Wrench}>
      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Member</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Service</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Details</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => {
              const user = getUser(req.user_id);
              return (
                <tr key={req.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium text-sm">{user?.full_name || '—'}</p>
                    <p className="text-[#AAB4C3] text-xs">{user?.email || ''}</p>
                  </td>
                  <td className="px-5 py-4 text-white text-sm">{req.service_type}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs max-w-xs truncate">{req.details || '—'}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                    {new Date(req.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-5 py-4">
                    {req.status === 'pending' && (
                      <button onClick={() => setSelected(req)} className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-[#AAB4C3]">No service requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Review Service Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-4 space-y-2">
                <div className="flex justify-between"><span className="text-[#AAB4C3] text-xs">Service</span><span className="text-white text-sm font-medium">{selected.service_type}</span></div>
                {selected.details && (
                  <div><span className="text-[#AAB4C3] text-xs">Details</span><p className="text-white text-sm mt-1">{selected.details}</p></div>
                )}
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none" rows={3} />
              </div>
              <InternalComments entityType="service_request" entityId={selected.id} />
              <div className="flex gap-3">
                <button onClick={() => handleAction('approved')} disabled={submitting} className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40">
                  <Check size={16} /> Approve
                </button>
                <button onClick={() => handleAction('rejected')} disabled={submitting} className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/80 transition-all disabled:opacity-40">
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