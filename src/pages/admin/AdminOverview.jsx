import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users, FileText, ArrowUpRight, Wallet, Briefcase, Activity, Sparkles, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import { buildMonthlyReporting } from '@/lib/monthlyReporting';
import { findLedgerDiscrepancies } from '@/lib/ledgerIntegrity';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/vantoris/StatusBadge';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import PremiumStatCard from '@/components/vantoris/PremiumStatCard';
import TodaysOperationalSummary from '@/components/vantoris/widgets/TodaysOperationalSummary';
import PendingApprovalsWidget from '@/components/vantoris/widgets/PendingApprovalsWidget';
import HighPriorityCases from '@/components/vantoris/widgets/HighPriorityCases';
import LiveBankingActivity from '@/components/vantoris/widgets/LiveBankingActivity';
import DailyEmailSummary from '@/components/vantoris/DailyEmailSummary';
import QuickActionsMenu from '@/components/vantoris/QuickActionsMenu';
import VantorisLoading from '@/components/vantoris/system/VantorisLoading';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, pendingApps: 0, pendingWithdrawals: 0, totalBalance: 0, accountCount: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [integrityIssues, setIntegrityIssues] = useState([]);
  const [integrityCheckedAt, setIntegrityCheckedAt] = useState(null);
  const [integrityError, setIntegrityError] = useState('');
  const notifiedIssueKeys = useRef(new Set());
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const loadData = useCallback(async () => {
    try {
      // Totals come from the server so they are not limited to the most recent page of records.
      const [users, apps, withdrawals, balanceAgg, pendingApps, pendingWithdrawals, accounts, investmentTransactions] = await Promise.all([
        base44.entities.User.list('-created_date', 500),
        base44.entities.Application.list('-created_date', 50),
        base44.entities.WithdrawalRequest.list('-created_date', 50),
        base44.entities.Account.aggregate({ sum: ['balance'] }),
        base44.entities.Application.count({ application_status: 'pending' }),
        base44.entities.WithdrawalRequest.count({ status: 'pending' }),
        base44.entities.Account.list('-created_date', 500),
        base44.entities.InvestmentTransaction.list('-created_date', 500).catch(() => []),
      ]);
      setMonthlyReport(buildMonthlyReporting(accounts, investmentTransactions));
      const balanceRow = balanceAgg?.rows?.[0] || {};
      const totalBalance = balanceRow.sum_balance || 0;
      const memberCount = users.filter(u => u.role === 'user').length;
      setStats({
        members: memberCount,
        pendingApps,
        pendingWithdrawals,
        totalBalance,
        accountCount: balanceRow.count || 0,
      });
      const recent = [
        ...apps.filter(a => a.application_status === 'pending').map(a => ({ id: a.id, type: 'Application', name: a.full_name, detail: a.account_type, date: a.created_date, status: a.application_status })),
        ...withdrawals.filter(w => w.status === 'pending').map(w => ({ id: w.id, type: 'Withdrawal', name: `${formatCurrency(w.amount)}`, detail: w.method, date: w.created_date, status: w.status })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
      setRecentItems(recent);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let active = true;
    let checking = false;
    const seen = new Set();
    try {
      const stored = sessionStorage.getItem('avcu-integrity-alerts-v1:' + (adminUser?.id || 'unknown'));
      if (stored) JSON.parse(stored).forEach(key => seen.add(key));
    } catch (_) { /* Session storage is optional; monitoring still works in memory. */ }
    notifiedIssueKeys.current = seen;

    const checkIntegrity = async () => {
      if (checking) return;
      checking = true;
      try {
        const [accounts, transactions] = await Promise.all([
          base44.entities.Account.list('-created_date', 500),
          base44.entities.Transaction.list('-created_date', 500),
        ]);
        if (!active) return;
        const findings = findLedgerDiscrepancies(accounts, transactions);
        setIntegrityIssues(findings);
        setIntegrityCheckedAt(new Date());
        setIntegrityError('');
        const newFindings = findings.filter(issue => !notifiedIssueKeys.current.has(issue.key));
        newFindings.forEach(issue => notifiedIssueKeys.current.add(issue.key));
        if (newFindings.length) {
          try { sessionStorage.setItem('avcu-integrity-alerts-v1:' + (adminUser?.id || 'unknown'), JSON.stringify([...notifiedIssueKeys.current].slice(-500))); } catch (_) { /* Keep in-memory deduplication. */ }
          const alertTitle = newFindings.length + ' account integrity alert' + (newFindings.length === 1 ? '' : 's');
          const alertMessage = newFindings[0].kind + ': ' + newFindings[0].accountName + '. Review the integrity monitor.';
          toast({ title: alertTitle, description: alertMessage, variant: 'destructive' });
          if (adminUser?.id) {
            base44.entities.Notification.create({
              user_id: adminUser.id,
              title: alertTitle,
              message: alertMessage,
              type: 'warning',
              link: '/operations/data-integrity',
            }).catch(error => console.error('Integrity notification could not be saved:', error));
          }
        }
      } catch (error) {
        if (active) setIntegrityError(error.message || 'Integrity check could not be completed.');
      } finally {
        checking = false;
      }
    };

    checkIntegrity();
    const interval = setInterval(checkIntegrity, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [toast, adminUser?.id]);

  if (loading) {
    return (
      <OperationsPageLayout title="Operations Overview" description="Protected staff workspace for member service, review queues and institution controls" icon={Briefcase} breadcrumb="Atchison Village · Operations">
        <VantorisLoading className="h-64" />
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Operations Overview"
      description="Protected staff workspace for member service, review queues and institution controls"
      icon={Briefcase}
      breadcrumb="Atchison Village · Operations"
      actions={<div className="flex items-center gap-2">
        <button onClick={() => navigate('/operations/ava')} className="inline-flex items-center gap-2 rounded-xl bg-[#173D32] text-white px-3 py-2 text-xs font-semibold hover:bg-[#102C25] transition-colors"><Sparkles size={14} /> AVA Operations</button>
        <QuickActionsMenu onActionComplete={loadData} />
        <DailyEmailSummary />
      </div>}
    >
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#173D32] via-[#204F40] to-[#102C25] p-5 sm:p-6 mb-6 text-white">
        <div className="absolute -right-12 -top-24 w-64 h-64 rounded-full border border-[#C5A66A]/20" />
        <div className="absolute -right-3 -top-14 w-44 h-44 rounded-full border border-[#C5A66A]/15" />
        <div className="relative max-w-3xl">
          <p className="text-[10px] uppercase tracking-[.18em] text-[#E5D2A8] font-bold">Authorized personnel only</p>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">The institution, in focus.</h2>
          <p className="text-sm text-white/75 mt-2 leading-relaxed">Review member activity, service requests and approval queues from this protected operations workspace. Member banking remains in its separate portal.</p>
        </div>
      </section>

      <section className="vantoris-glass-premium p-5 mb-6" aria-labelledby="monthly-report-heading">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.16em] text-gray font-bold">12-month view</p>
            <h3 id="monthly-report-heading" className="text-foreground font-semibold text-base mt-1">Account growth & investment volume</h3>
            <p className="text-xs text-gray mt-1">New accounts opened each month and gross completed investment transaction activity.</p>
          </div>
          <span className="text-[11px] text-gray">Source: account and investment transaction records</span>
        </div>
        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyReport} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="accounts" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 11 }} tickFormatter={value => formatCurrency(value)} />
              <Tooltip formatter={(value, name) => [name === 'Investment volume' ? formatCurrency(value) : value, name]} />
              <Legend />
              <Bar yAxisId="volume" dataKey="investmentVolume" name="Investment volume" fill="#B08D57" radius={[5, 5, 0, 0]} />
              <Line yAxisId="accounts" type="monotone" dataKey="newAccounts" name="New accounts" stroke="#173D32" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-gray mt-2">Investment volume is gross completed transaction activity (absolute amounts); it is not portfolio value, profit or assets under management. Data is limited to the latest 500 records returned by each source.</p>
      </section>

      <section className="vantoris-glass-premium p-5 mb-6" aria-labelledby="integrity-monitor-heading">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={integrityIssues.length ? 'w-10 h-10 rounded-xl flex items-center justify-center bg-crimson/10' : 'w-10 h-10 rounded-xl flex items-center justify-center bg-mint/10'}>
              <AlertTriangle size={19} className={integrityIssues.length ? 'text-crimson' : 'text-mint'} />
            </div>
            <div>
              <h3 id="integrity-monitor-heading" className="text-foreground font-semibold text-sm">Account integrity monitor</h3>
              <p className="text-xs text-gray mt-1">
                {integrityCheckedAt ? 'Last checked ' + integrityCheckedAt.toLocaleTimeString() : 'Checking account ledger…'}
                {' · '}Refreshes every 30 seconds while this dashboard is open
              </p>
            </div>
          </div>
          <button type="button" onClick={() => window.location.assign('/operations/data-integrity')} className="text-xs font-semibold text-[#173D32] hover:underline">Open audit</button>
        </div>
        {integrityError && <p role="alert" className="mt-3 text-xs text-crimson">Monitoring error: {integrityError}</p>}
        {!integrityError && integrityIssues.length === 0 && integrityCheckedAt && <p className="mt-3 text-sm text-mint">No discrepancies found in the records checked.</p>}
        {integrityIssues.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-crimson">{integrityIssues.length} discrepancy alert{integrityIssues.length === 1 ? '' : 's'} detected</p>
            {integrityIssues.slice(0, 5).map(issue => (
              <div key={issue.key} className="rounded-xl border border-crimson/15 bg-crimson/5 p-3">
                <p className="text-xs font-semibold text-foreground">{issue.kind} · {issue.accountName}</p>
                <p className="text-[11px] text-gray mt-1">{issue.detail}</p>
                <p className="text-[11px] text-gray mt-1">Ledger: {formatCurrency(issue.expectedBalance)} · Recorded: {formatCurrency(issue.recordedBalance)}</p>
              </div>
            ))}
            {integrityIssues.length > 5 && <p className="text-xs text-gray">Showing 5 of {integrityIssues.length}. Open the full audit for review.</p>}
          </div>
        )}
        <p className="text-[10px] text-gray mt-3">Foreground monitoring only: checks up to 500 recent accounts and transactions while this dashboard is open. It does not change balances or ledger records and is not an always-on server alert.</p>
      </section>

      {/* Today's Operational Summary */}
      <div className="mb-6">
        <TodaysOperationalSummary />
      </div>

      {/* Critical Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard hero alert={null} alertIcon={null} label="Assets Under Management" value={formatCurrency(stats.totalBalance)} sublabel={`Across ${stats.accountCount} account${stats.accountCount === 1 ? '' : 's'}`} icon={Wallet} accent="navy" onClick={() => navigate('/operations/finance')} />
        <PremiumStatCard label="Total Members" value={stats.members} sublabel="" alert={null} alertIcon={null} hero={false} icon={Users} accent="blue" onClick={() => navigate('/operations/members')} />
        <PremiumStatCard label="Pending Applications" value={stats.pendingApps} sublabel="" alert={null} alertIcon={null} hero={false} icon={FileText} accent="gold" onClick={() => navigate('/operations/applications')} />
        <PremiumStatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} sublabel="" alert={null} alertIcon={null} hero={false} icon={ArrowUpRight} accent="crimson" onClick={() => navigate('/operations/withdrawals')} />
      </div>

      {/* Pending Approvals + High Priority + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <PendingApprovalsWidget />
        <HighPriorityCases />
        <LiveBankingActivity />
      </div>

      {/* Operations Queue */}
      <div className="vantoris-glass-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-navy" />
            <h3 className="text-foreground font-semibold text-sm">Operations Queue</h3>
          </div>
          <span className="text-gray text-xs">{recentItems.length} pending items</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-gray text-xs font-semibold uppercase tracking-wider py-3 pr-4">Type</th>
                  <th className="text-left text-gray text-xs font-semibold uppercase tracking-wider py-3 pr-4">Details</th>
                  <th className="text-left text-gray text-xs font-semibold uppercase tracking-wider py-3 pr-4">Submitted</th>
                  <th className="text-left text-gray text-xs font-semibold uppercase tracking-wider py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all">
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Application' ? 'bg-brass/10 text-brass' : 'bg-crimson/10 text-crimson'}`}>{item.type}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-foreground font-medium">{item.name}</p>
                      <p className="text-gray text-xs">{item.detail}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray text-xs">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="py-3"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
                {recentItems.length === 0 && (<tr><td colSpan={4} className="py-8 text-center text-gray text-sm">No pending items</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {recentItems.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Application' ? 'bg-brass/10 text-brass' : 'bg-crimson/10 text-crimson'}`}>{item.type}</span>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-foreground font-medium text-sm">{item.name}</p>
              <p className="text-gray text-xs">{item.detail}</p>
              <p className="text-gray/60 text-[10px] mt-1">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          ))}
          {recentItems.length === 0 && (<div className="py-8 text-center text-gray text-sm">No pending items</div>)}
        </div>
      </div>
    </OperationsPageLayout>
  );
}