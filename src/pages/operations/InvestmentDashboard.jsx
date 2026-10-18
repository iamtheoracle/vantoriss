import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { PieChart, ArrowDownToLine, ArrowUpRight, TrendingUp, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

export default function InvestmentDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const [ports, deps, wrs, sigs] = await Promise.all([
      base44.entities.InvestmentPortfolio.list().catch(() => []),
      base44.entities.InvestmentDepositRequest.filter({ status: 'requested' }).catch(() => []),
      base44.entities.InvestmentWithdrawalRequest.filter({ status: 'requested' }).catch(() => []),
      base44.entities.InvestmentSignal.filter({ status: 'active' }, '-created_date', 5).catch(() => []),
    ]);
    setPortfolios(ports);
    setPendingDeposits(deps);
    setPendingWithdrawals(wrs);
    setSignals(sigs);
  }, []);

  async function handleReview(request, requestType, decision) {
    const actionKey = `${requestType}:${request.id}`;
    const notesKey = actionKey;
    const adminNotes = (reviewNotes[notesKey] || '').trim();
    if (!request?.id || typeof request.updated_date !== 'string' || !request.updated_date) {
      toast({ title: 'Review unavailable', description: 'The request revision is missing. Refresh the queue before reviewing.', variant: 'destructive' });
      return;
    }
    if (decision === 'rejected' && !adminNotes) {
      toast({ title: 'Rejection reason required', description: 'Enter a concise reason before rejecting this request.', variant: 'destructive' });
      return;
    }

    setReviewingId(actionKey);
    let operationScope = '';
    try {
      operationScope = `investment-review:${await fingerprintMutationScope(JSON.stringify({
        requestId: request.id,
        requestType,
        decision,
        adminNotes,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('reviewInvestmentRequest', {
        request_id: request.id,
        request_type: requestType,
        decision,
        admin_notes: adminNotes,
        expected_updated_date: request.updated_date,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const savedRequest = result?.request;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        !savedRequest ||
        savedRequest.id !== request.id ||
        savedRequest.status !== decision ||
        savedRequest.amount !== request.amount ||
        savedRequest.portfolio_id !== request.portfolio_id ||
        savedRequest.updated_date === request.updated_date ||
        typeof savedRequest.updated_date !== 'string'
      ) {
        throw new Error(result?.error || 'The server did not confirm the audited investment decision. Retry only with the same operation.');
      }
      if (decision === 'approved') {
        if (
          !result.transaction ||
          typeof result.transaction.id !== 'string' ||
          result.transaction.status !== 'completed' ||
          result.transaction.amount !== request.amount ||
          result.transaction.portfolio_id !== request.portfolio_id ||
          !result.portfolio ||
          typeof result.portfolio.updated_date !== 'string' ||
          (requestType === 'deposit' && result.funding_verified !== true) ||
          (requestType === 'withdrawal' && result.payout_confirmed !== true)
        ) {
          throw new Error('The provider did not confirm verified funding or completed payout, ledger entry, portfolio revision, and audit. The decision outcome must be resolved with the same idempotency key.');
        }
      }

      await clearMutationIdempotencyKey(operationScope);
      toast({
        title: requestType === 'deposit'
          ? (decision === 'approved' ? 'Deposit approved' : 'Deposit rejected')
          : (decision === 'approved' ? 'Withdrawal settled' : 'Withdrawal rejected'),
        description: decision === 'approved'
          ? (requestType === 'deposit'
            ? 'Verified funding was confirmed and the portfolio ledger was updated.'
            : 'Payout confirmation was received and the portfolio ledger was updated.')
          : 'The request was rejected and its audit record was confirmed.',
      });
      setReviewNotes(current => ({ ...current, [notesKey]: '' }));
      await loadData().catch(() => {});
    } catch (err) {
      toast({
        title: 'Investment review unavailable',
        description: err?.response?.data?.error || err.message || 'The server did not confirm the review.',
        variant: 'destructive',
      });
    } finally {
      setReviewingId(null);
    }
  }

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  const totalAUM = portfolios.reduce((s, p) => s + (p.total_value || 0), 0);
  const totalCash = portfolios.reduce((s, p) => s + (p.cash_balance || 0), 0);
  const totalInvested = portfolios.reduce((s, p) => s + (p.invested_amount || 0), 0);

  return (
    <OperationsPageLayout title="Investment Dashboard" description="Portfolio overview and operator queue" icon={PieChart}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Total AUM</p>
          <p className="text-foreground text-xl font-bold mt-1">{formatCurrency(totalAUM)}</p>
        </div>
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Total Cash</p>
          <p className="text-foreground text-xl font-bold mt-1">{formatCurrency(totalCash)}</p>
        </div>
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Total Invested</p>
          <p className="text-foreground text-xl font-bold mt-1">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="vantoris-glass p-4">
          <p className="text-gray text-xs uppercase tracking-wider">Active Portfolios</p>
          <p className="text-foreground text-xl font-bold mt-1">{portfolios.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="vantoris-glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownToLine size={18} className="text-mint" />
            <h3 className="text-sm font-bold text-foreground">Pending Deposit Requests</h3>
          </div>
          {pendingDeposits.length === 0 ? (
            <p className="text-gray text-sm py-4 text-center">No pending deposits</p>
          ) : (
            <div className="space-y-2">
              {pendingDeposits.map(d => {
                const actionKey = `deposit:${d.id}`;
                return (
                  <div key={d.id} className="py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(d.amount)}</p>
                        <p className="text-xs text-gray">{d.created_date?.substring(0, 10)} · {d.user_id}</p>
                      </div>
                      <span className="text-xs text-brass font-medium">Awaiting review</span>
                    </div>
                    <input
                      value={reviewNotes[actionKey] || ''}
                      onChange={event => setReviewNotes(current => ({ ...current, [actionKey]: event.target.value }))}
                      maxLength={2000}
                      placeholder="Operator note (required to reject)"
                      aria-label="Deposit review note"
                      className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"
                    />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleReview(d, 'deposit', 'approved')} disabled={reviewingId !== null} className="flex-1 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        {reviewingId === actionKey ? 'Processing…' : 'Approve deposit'}
                      </button>
                      <button onClick={() => handleReview(d, 'deposit', 'rejected')} disabled={reviewingId !== null || !(reviewNotes[actionKey] || '').trim()} className="flex-1 rounded-lg border border-crimson/30 px-3 py-2 text-xs font-semibold text-crimson disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="vantoris-glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={18} className="text-crimson" />
            <h3 className="text-sm font-bold text-foreground">Pending Withdrawal Requests</h3>
          </div>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-gray text-sm py-4 text-center">No pending withdrawals</p>
          ) : (
            <div className="space-y-2">
              {pendingWithdrawals.map(w => {
                const actionKey = `withdrawal:${w.id}`;
                return (
                  <div key={w.id} className="py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(w.amount)}</p>
                        <p className="text-xs text-gray">{w.created_date?.substring(0, 10)} · {w.user_id}</p>
                      </div>
                      <span className="text-xs text-brass font-medium">Awaiting review</span>
                    </div>
                    <input
                      value={reviewNotes[actionKey] || ''}
                      onChange={event => setReviewNotes(current => ({ ...current, [actionKey]: event.target.value }))}
                      maxLength={2000}
                      placeholder="Operator note (required to reject)"
                      aria-label="Withdrawal review note"
                      className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs"
                    />
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleReview(w, 'withdrawal', 'approved')} disabled={reviewingId !== null} className="flex-1 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        {reviewingId === actionKey ? 'Processing…' : 'Approve & settle'}
                      </button>
                      <button onClick={() => handleReview(w, 'withdrawal', 'rejected')} disabled={reviewingId !== null || !(reviewNotes[actionKey] || '').trim()} className="flex-1 rounded-lg border border-crimson/30 px-3 py-2 text-xs font-semibold text-crimson disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="vantoris-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-champagne" />
          <h3 className="text-sm font-bold text-foreground">Active Signals</h3>
        </div>
        {signals.length === 0 ? (
          <p className="text-gray text-sm py-4 text-center">No active signals</p>
        ) : (
          <div className="space-y-2">
            {signals.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.asset_symbol} · <span className="capitalize">{s.signal_type}</span></p>
                  <p className="text-xs text-gray">Confidence: {s.confidence}</p>
                </div>
                {!s.provider_connected && <span className="text-xs text-warning">Data not connected</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </OperationsPageLayout>
  );
}