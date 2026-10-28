import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowUpRight, Loader2, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

export default function InvestmentWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const reqs = await base44.entities.InvestmentWithdrawalRequest.list('-created_date');
    setRequests(reqs);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  async function handleAction(req, action) {
    if (!req?.id || !req?.updated_date) {
      toast({ title: 'Review unavailable', description: 'The request revision is missing. Reload the request list before retrying.', variant: 'destructive' });
      return;
    }
    const decision = action === 'approve' ? 'approved' : 'rejected';
    const adminNotes = (reviewNotes[req.id] || '').trim();
    if (decision === 'rejected' && !adminNotes) {
      toast({ title: 'Rejection reason required', description: 'Enter a concise reason before rejecting this request.', variant: 'destructive' });
      return;
    }
    setProcessing(req.id);
    let operationScope = '';
    try {
      operationScope = `investment-review:${await fingerprintMutationScope(JSON.stringify({
        requestId: req.id,
        requestType: 'withdrawal',
        decision,
        adminNotes,
        expectedUpdatedDate: req.updated_date,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('reviewInvestmentRequest', {
        request_id: req.id,
        request_type: 'withdrawal',
        decision,
        expected_updated_date: req.updated_date,
        admin_notes: adminNotes,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const savedRequest = result?.request;
      const approved = decision === 'approved';
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        savedRequest?.id !== req.id ||
        savedRequest?.status !== decision ||
        savedRequest?.user_id !== req.user_id ||
        savedRequest?.portfolio_id !== req.portfolio_id ||
        savedRequest?.amount !== req.amount ||
        typeof savedRequest?.updated_date !== 'string' ||
        savedRequest.updated_date === req.updated_date ||
        (approved && (
          !result?.transaction ||
          typeof result.transaction.id !== 'string' ||
          result.transaction.portfolio_id !== req.portfolio_id ||
          result.transaction.user_id !== req.user_id ||
          result.transaction.type !== 'withdrawal' ||
          result.transaction.amount !== req.amount ||
          result.transaction.status !== 'completed' ||
          result.portfolio?.id !== req.portfolio_id ||
          typeof result.portfolio.updated_date !== 'string'
        )) ||
        (approved && (result?.payout_confirmed !== true || savedRequest?.payout_confirmed !== true))
      ) {
        throw new Error(result?.error || 'The server did not confirm the audited investment review and required financial evidence. Retry only with the same operation.');
      }

      await clearMutationIdempotencyKey(operationScope);
      setReviewNotes(current => ({ ...current, [req.id]: '' }));
      toast({
        title: approved ? 'Withdrawal paid' : 'Withdrawal rejected',
        description: approved
          ? 'The provider confirmed payout and the withdrawal was settled.'
          : 'The request was rejected and its reservation was released.',
      });
      await loadData().catch(() => {});
    } catch (err) {
      toast({
        title: 'Review unavailable',
        description: err?.response?.data?.error || err.message || 'The server did not confirm the investment review. Retry only with the same operation.',
        variant: 'destructive',
      });
    } finally {
      setProcessing('');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="Investment Withdrawal Requests" description="Review and approve member withdrawal requests" icon={ArrowUpRight}>
      {requests.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <p className="text-gray">No withdrawal requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="vantoris-glass p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{formatCurrency(req.amount)}</p>
                <p className="text-xs text-gray mt-0.5">
                  Submitted: {req.created_date?.substring(0, 10)} · Status: <span className="capitalize">{req.status.replace(/_/g, ' ')}</span>
                </p>
                {req.review_notes && <p className="text-xs text-gray mt-1">Previous review note: {req.review_notes}</p>}
                <input
                  value={reviewNotes[req.id] || ''}
                  onChange={event => setReviewNotes(current => ({ ...current, [req.id]: event.target.value }))}
                  maxLength={2000}
                  placeholder="Operator note (required to reject)"
                  aria-label="Withdrawal review note"
                  className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"
                />
              </div>
              {req.status === 'requested' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req, 'approve')}
                    disabled={processing === req.id}
                    className="px-3 py-2 rounded-lg bg-mint/10 text-mint text-xs font-semibold hover:bg-mint/20 transition flex items-center gap-1.5"
                  >
                    <Check size={14} /> Approve &amp; settle
                  </button>
                  <button
                    onClick={() => handleAction(req, 'reject')}
                    disabled={processing === req.id || !(reviewNotes[req.id] || '').trim()}
                    className="px-3 py-2 rounded-lg bg-crimson/10 text-crimson text-xs font-semibold hover:bg-crimson/20 transition flex items-center gap-1.5"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}