import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ArrowDownToLine, ArrowUpRight, PieChart, Signal, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/formatCurrency';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

export default function Investment() {
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [portfolios] = await Promise.all([
      base44.entities.InvestmentPortfolio.filter({ user_id: me.id }).catch(() => []),
    ]);
    const portf = portfolios[0] || null;
    setPortfolio(portf);
    if (portf) {
      const [txns, deps, wrs, sigs] = await Promise.all([
        base44.entities.InvestmentTransaction.filter({ portfolio_id: portf.id }, '-created_date', 20).catch(() => []),
        base44.entities.InvestmentDepositRequest.filter({ user_id: me.id }, '-created_date', 10).catch(() => []),
        base44.entities.InvestmentWithdrawalRequest.filter({ user_id: me.id }, '-created_date', 10).catch(() => []),
        base44.entities.InvestmentSignal.filter({ status: 'active' }, '-created_date', 5).catch(() => []),
      ]);
      setTransactions(txns);
      setDepositRequests(deps);
      setWithdrawalRequests(wrs);
      setSignals(sigs);
    }
  }, []);

  useEffect(() => {
    loadData().catch(() => {}).finally(() => setLoading(false));
  }, [loadData]);

  async function handleCreatePortfolio() {
    setSubmitting(true);
    let operationScope = '';
    try {
      const me = await base44.auth.me();
      operationScope = `investment-portfolio-create:${await fingerprintMutationScope(me.id)}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('createInvestmentPortfolio', {
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const created = result?.portfolio;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        !created ||
        typeof created.id !== 'string' ||
        created.user_id !== me.id ||
        created.status !== 'pending_setup' ||
        created.provider_connected !== false ||
        created.total_value !== 0 ||
        created.cash_balance !== 0 ||
        created.invested_amount !== 0 ||
        typeof created.updated_date !== 'string'
      ) {
        throw new Error(result?.error || 'The server did not confirm an audited, zero-balance portfolio. Retry only with the same operation.');
      }
      await clearMutationIdempotencyKey(operationScope);
      setPortfolio(created);
      toast({ title: 'Portfolio created', description: 'Your investment portfolio is pending setup.' });
    } catch (err) {
      toast({
        title: 'Portfolio unavailable',
        description: err?.response?.data?.error || err.message || 'The server did not confirm portfolio creation.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitInvestmentRequest(requestType, rawAmount) {
    const amount = Number(rawAmount);
    if (
      typeof rawAmount !== 'string' ||
      !rawAmount.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100_000_000 ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > Number.EPSILON * Math.max(1, Math.abs(amount * 100)) * 4
    ) {
      toast({ title: 'Invalid amount', description: 'Enter a positive amount with no more than two decimal places.', variant: 'destructive' });
      return;
    }
    if (!portfolio?.id || !portfolio?.updated_date) {
      toast({ title: 'Request unavailable', description: 'The portfolio revision is missing. Refresh your portfolio before retrying.', variant: 'destructive' });
      return;
    }
    if (requestType === 'withdrawal' && !portfolio.provider_connected) {
      toast({ title: 'Withdrawal unavailable', description: 'Connect an investment provider before requesting a withdrawal. Available cash and pending reservations must be verified.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    let operationScope = '';
    try {
      operationScope = `investment-request:${await fingerprintMutationScope(JSON.stringify({
        portfolioId: portfolio.id,
        requestType,
        amount,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('createInvestmentRequest', {
        portfolio_id: portfolio.id,
        request_type: requestType,
        amount,
        expected_updated_date: portfolio.updated_date,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const request = result?.request;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        !request ||
        typeof request.id !== 'string' ||
        request.user_id !== user?.id ||
        request.portfolio_id !== portfolio.id ||
        request.amount !== amount ||
        request.status !== 'requested' ||
        typeof request.updated_date !== 'string'
      ) {
        throw new Error(result?.error || 'The server did not confirm the audited investment request. Retry only with the same operation.');
      }

      await clearMutationIdempotencyKey(operationScope);
      toast({
        title: requestType === 'deposit' ? 'Deposit requested' : 'Withdrawal requested',
        description: requestType === 'deposit'
          ? 'Your deposit request is pending operator review. No funds have been credited.'
          : 'Your withdrawal request is pending operator review. No funds have been transferred.',
      });
      if (requestType === 'deposit') {
        setShowDeposit(false);
        setDepositAmount('');
      } else {
        setShowWithdraw(false);
        setWithdrawAmount('');
      }
      // A refresh failure must not misreport an already-confirmed request as failed.
      await loadData().catch(() => {});
    } catch (err) {
      toast({
        title: 'Request unavailable',
        description: err?.response?.data?.error || err.message || 'The server did not confirm the investment request.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeposit() {
    return submitInvestmentRequest('deposit', depositAmount);
  }

  function handleWithdraw() {
    return submitInvestmentRequest('withdrawal', withdrawAmount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-8 vantoris-scroll min-h-screen bg-background">
      <button onClick={() => navigate('/more')} className="flex items-center gap-2 text-sm text-gray hover:text-foreground mb-6">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-mint/10 border border-mint/15 flex items-center justify-center">
          <TrendingUp size={22} className="text-mint" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Vantoris Investment</h1>
          <p className="text-xs text-gray">A separate investment experience</p>
        </div>
      </div>

      {!portfolio ? (
        <div className="vantoris-glass-premium p-8 text-center">
          <PieChart size={48} className="text-gray mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">No Investment Portfolio</h2>
          <p className="text-gray text-sm mb-6">
            Create an investment portfolio to get started. This is a separate experience from your ordinary Vantoris banking.
          </p>
          <button
            onClick={handleCreatePortfolio}
            disabled={submitting}
            className="w-full py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Portfolio'}
          </button>
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          <div className="vantoris-balance-hero p-6 mb-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Portfolio Value</p>
                <p className="text-white text-2xl font-bold mt-1">{formatCurrency(portfolio.total_value || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Status</p>
                <p className="text-white text-sm font-semibold mt-1 capitalize">{(portfolio.status || 'pending_setup').replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Available Cash</p>
                <p className="text-white text-lg font-bold mt-0.5">{formatCurrency(portfolio.cash_balance || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider">Invested</p>
                <p className="text-white text-lg font-bold mt-0.5">{formatCurrency(portfolio.invested_amount || 0)}</p>
              </div>
            </div>
          </div>

          {/* Provider status — honest */}
          {!portfolio.provider_connected && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-5 flex items-start gap-3">
              <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground text-sm font-semibold">No Brokerage Provider Connected</p>
                <p className="text-gray text-xs mt-0.5">
                  Investment trading, live market data, and custody are not connected. Deposit requests may be submitted for operator review. Withdrawals remain unavailable until a provider supplies authoritative available-cash and pending-reservation data. No live prices or positions are available.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setShowDeposit(true)}
              className="vantoris-glass p-4 flex flex-col items-center gap-2 hover:shadow-md transition"
            >
              <ArrowDownToLine size={22} className="text-mint" />
              <span className="text-sm font-semibold text-foreground">Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={submitting || !portfolio.provider_connected}
              title={!portfolio.provider_connected ? 'Connect an investment provider before requesting a withdrawal' : undefined}
              className="vantoris-glass p-4 flex flex-col items-center gap-2 hover:shadow-md transition disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <ArrowUpRight size={22} className="text-crimson" />
              <span className="text-sm font-semibold text-foreground">Withdraw</span>
            </button>
          </div>

          {/* Pending requests */}
          {(depositRequests.length > 0 || withdrawalRequests.length > 0) && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Pending Requests</h3>
              <div className="space-y-2">
                {depositRequests.filter(r => !['completed', 'rejected', 'failed'].includes(r.status)).map(r => (
                  <div key={r.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Deposit · {formatCurrency(r.amount)}</p>
                      <p className="text-xs text-gray capitalize">{r.status.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-xs text-brass font-medium">Pending</span>
                  </div>
                ))}
                {withdrawalRequests.filter(r => !['completed', 'rejected', 'failed'].includes(r.status)).map(r => (
                  <div key={r.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Withdrawal · {formatCurrency(r.amount)}</p>
                      <p className="text-xs text-gray capitalize">{r.status.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-xs text-brass font-medium">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signals — honest about uncertainty */}
          {signals.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Signal size={16} className="text-champagne" />
                <h3 className="text-sm font-bold text-foreground">Signals</h3>
              </div>
              <div className="space-y-2">
                {signals.map(s => (
                  <div key={s.id} className="vantoris-glass-flat p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">{s.asset_symbol}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.signal_type === 'buy' ? 'bg-mint/10 text-mint' :
                        s.signal_type === 'sell' ? 'bg-crimson/10 text-crimson' :
                        'bg-gray/10 text-gray'
                      }`}>{s.signal_type}</span>
                    </div>
                    {s.confidence && <p className="text-xs text-gray">Confidence: {s.confidence}</p>}
                    {s.risk_considerations && <p className="text-xs text-gray mt-1">{s.risk_considerations}</p>}
                    {!s.provider_connected && (
                      <p className="text-[10px] text-warning mt-1">Market data not connected — signal may be stale</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent transactions */}
          {transactions.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="vantoris-glass-flat p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{t.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray">{t.description || ''}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.type === 'withdrawal' || t.type === 'fee' ? 'text-crimson' : 'text-mint'}`}>
                      {t.type === 'withdrawal' || t.type === 'fee' ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Deposit modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowDeposit(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Request Deposit</h3>
            <p className="text-xs text-gray mb-4">Your deposit request will be reviewed by an investment operator. Funds become available only after approval.</p>
            <input
              type="number"
              min="0.01"
              max="100000000"
              step="0.01"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Amount (USD)"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm mb-4 focus:border-brass/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowDeposit(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Cancel</button>
              <button onClick={handleDeposit} disabled={submitting || !depositAmount} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Request Withdrawal</h3>
            <p className="text-xs text-gray mb-4">Your withdrawal request will be reviewed by an investment operator. Funds are transferred only after approval.</p>
            <input
              type="number"
              min="0.01"
              max="100000000"
              step="0.01"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount (USD)"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm mb-4 focus:border-brass/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowWithdraw(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Cancel</button>
              <button onClick={handleWithdraw} disabled={submitting || !withdrawAmount} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}