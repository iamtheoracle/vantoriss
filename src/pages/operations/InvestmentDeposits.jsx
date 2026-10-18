import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowDownToLine, Loader2, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

export default function InvestmentDeposits() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const reqs = await base44.entities.InvestmentDepositRequest.list('-created_date');
    setRequests(reqs);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  async function handleAction(req, action) {
    if (!req?.id || !req?.updated_date) {
      toast({ title: 'Review unavailable', description: 'The request revision is missing. Reload the request list before retrying.', variant: 'destructive' });
      return;
    }
    const decision = action === 'approve' ? 'approved' : 'rejected';
    setProcessing(req.id);
    let operationScope = '';
    try {
      operationScope = `investment-review:${await fingerprintMutationScope(JSON.stringify({
        requestId: req.id,
        requestType: 'deposit',
        decision,
        expectedUpdatedDate: req.updated_date,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('reviewInvestmentRequest', {
        request_id: req.id,
        request_type: 'deposit',
        decision,
        expected_updated_date: req.updated_date,
        admin_notes: req.review_notes || '',
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
          result.transaction.type !== 'deposit' ||
          result.transaction.amount !== req.amount ||
          result.transaction.status !== 'completed' ||
          result.portfolio?.id !== req.portfolio_id ||
          typeof result.portfolio.updated_date !== 'string'
        )) ||
        (approved && result?.funding_verified !== true)
      ) {
        throw new Error(result?.error || 'The server did not confirm the audited investment review and required financial evidence. Retry only with the same operation.');
      }

      await clearMutationIdempotencyKey(operationScope);
      toast({
        title: approved ? 'Deposit approved' : 'Deposit rejected',
        description: approved
          ? 'Verified funding was credited to the portfolio.'
          : 'The request was rejected; no portfolio credit was applied.',
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
    <OperationsPageLayout title="Investment Deposit Requests" description="Review and approve member deposit requests" icon={ArrowDownToLine}>
      {requests.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <p className="text-gray">No deposit requests.</p>
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
                {req.review_notes && <p className="text-xs text-gray mt-1">Notes: {req.review_notes}</p>}
              </div>
              {req.status === 'requested' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req, 'approve')}
                    disabled={processing === req.id}
                    className="px-3 py-2 rounded-lg bg-mint/10 text-mint text-xs font-semibold hover:bg-mint/20 transition flex items-center gap-1.5"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(req, 'reject')}
                    disabled={processing === req.id}
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