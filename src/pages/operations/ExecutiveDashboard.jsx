import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown, Wallet, Users, FileText,
  ArrowUpRight, Activity, AlertTriangle,
} from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import PremiumStatCard from '@/components/vantoris/PremiumStatCard';
import TreasuryPosition from '@/components/vantoris/widgets/TreasuryPosition';
import LiveBankingActivity from '@/components/vantoris/widgets/LiveBankingActivity';
import PendingApprovalsWidget from '@/components/vantoris/widgets/PendingApprovalsWidget';
import AIRecommendationsWidget from '@/components/vantoris/widgets/AIRecommendationsWidget';
import SystemHealthWidget from '@/components/vantoris/widgets/SystemHealthWidget';
import VantorisLoading from '@/components/vantoris/system/VantorisLoading';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


function buildMonthlyReportingSeries(accounts, investmentTransactions) {
  const now = new Date();
  const months = [];
  const index = new Map();
  for (let offset = 23; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    const point = { key, month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), accountOpenings: 0, investmentVolume: 0 };
    months.push(point);
    index.set(key, point);
  }
  accounts.forEach(account => {
    const date = new Date(account.created_date);
    if (Number.isNaN(date.getTime())) return;
    const point = index.get(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'));
    if (point) point.accountOpenings += 1;
  });
  investmentTransactions.forEach(transaction => {
    if (['failed', 'reversed', 'pending'].includes(transaction.status)) return;
    const date = new Date(transaction.transaction_date || transaction.created_date);
    const amount = Number(transaction.amount);
    if (Number.isNaN(date.getTime()) || !Number.isFinite(amount)) return;
    const point = index.get(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'));
    if (point) point.investmentVolume += Math.abs(amount);
  });
  return months;
}

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, totalBalance: 0, pendingApps: 0, pendingWithdrawals: 0, totalAccounts: 0, frozenAccounts: 0, totalDeposits: 0, totalWithdrawals: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState(12);
  const [monthlySeries, setMonthlySeries] = useState([]);
  const [integrityAlerts, setIntegrityAlerts] = useState([]);
  const [integrityAlertError, setIntegrityAlertError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [users, apps, withdrawals, accounts, transactions, auditLogs, investmentTransactions, alerts] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.entities.Application.list('-created_date', 50),
        base44.entities.WithdrawalRequest.list('-created_date', 50),
        base44.entities.Account.list('-created_date', 200),
        base44.entities.Transaction.list('-created_date', 100),
        base44.entities.AuditLog.list('-created_date', 15),
        base44.entities.InvestmentTransaction.list('-created_date', 500).catch(() => []),
        base44.entities.IntegrityAlert.filter({ status: 'open' }, '-created_date', 10).catch(error => { setIntegrityAlertError(error.message || 'Integrity alerts are not available yet.'); return []; }),
      ]);

      const memberCount = users.filter(u => u.role === 'user').length;
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
      const pendingApps = apps.filter(a => a.application_status === 'pending').length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
      const frozenAccounts = accounts.filter(a => a.status === 'frozen').length;
      const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

      setStats({ members: memberCount, totalBalance, pendingApps, pendingWithdrawals, totalAccounts: accounts.length, frozenAccounts, totalDeposits, totalWithdrawals });
      setMonthlySeries(buildMonthlyReportingSeries(accounts, investmentTransactions));
      setIntegrityAlerts(alerts);
      setRecentActivity(auditLogs.slice(0, 8).map(log => ({
        id: log.id, action: log.action_type?.replace(/_/g, ' ') || 'Action',
        description: log.description || '', admin: log.admin_name || 'System', date: log.created_date,
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Executive Dashboard" description="Enterprise overview and strategic metrics" icon={Crown} breadcrumb="Executive Workspace">
        <VantorisLoading className="h-64" />
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Executive Dashboard" description="Enterprise overview and strategic metrics" icon={Crown} breadcrumb="Executive Workspace">
      {/* Executive KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard hero label="Assets Under Management" value={formatCurrency(stats.totalBalance)} sublabel="Total across all member accounts" icon={Wallet} accent="navy" onClick={() => navigate('/operations/finance')} />
        <PremiumStatCard label="Total Members" value={stats.members} icon={Users} accent="blue" onClick={() => navigate('/operations/members')} />
        <PremiumStatCard label="Pending Applications" value={stats.pendingApps} icon={FileText} accent="gold" alert={stats.pendingApps > 0 ? stats.pendingApps : ''} alertIcon={AlertTriangle} onClick={() => navigate('/operations/applications')} />
        <PremiumStatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} icon={ArrowUpRight} accent="crimson" alert={stats.pendingWithdrawals > 0 ? stats.pendingWithdrawals : ''} alertIcon={AlertTriangle} onClick={() => navigate('/operations/withdrawals')} />
      </div>

      {/* Monthly reporting and integrity monitoring */}

      <section className="vantoris-glass-premium p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div><h3 className="text-foreground font-semibold text-sm">Monthly account growth & investment volume</h3>
            <p className="text-gray text-xs mt-1">New accounts opened and completed investment transaction activity. Not a balance or return forecast.</p></div>
          <div className="flex rounded-xl border border-border bg-white p-1 gap-1" aria-label="Chart date range">
            {[6, 12, 24].map(months => <button key={months} type="button" onClick={() => setChartRange(months)} aria-pressed={chartRange === months}
              className={chartRange === months ? "px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy text-white" : "px-3 py-1.5 rounded-lg text-xs font-semibold text-gray hover:bg-slate-50"}>{months}M</button>)}
          </div>
        </div>
        <div className="h-[320px] w-full">
          {monthlySeries.length ? <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlySeries.slice(-chartRange)} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9E0E8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#718096" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="accounts" allowDecimals={false} tick={{ fontSize: 11, fill: "#718096" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} tickFormatter={value => "$" + Number(value).toLocaleString()} />
              <Tooltip formatter={(value, name) => name === "Investment volume" ? formatCurrency(value) : [value, name]} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="accounts" dataKey="accountOpenings" name="New accounts" fill="#173D32" radius={[5, 5, 0, 0]} maxBarSize={28} />
              <Line yAxisId="volume" type="monotone" dataKey="investmentVolume" name="Investment volume" stroke="#B18B4C" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer> : <p className="text-sm text-gray text-center pt-20">No reporting data available for this period.</p>}
        </div>
        <p className="text-[10px] text-gray mt-2">Source: latest 200 account records and latest 500 investment transaction records returned by the data service. Older months may be incomplete if records exceed these limits.</p>
      </section>

      <section className="vantoris-glass-premium p-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h3 className="text-foreground font-semibold text-sm">Account integrity alerts</h3>
            <p className="text-gray text-xs mt-1">Open balance discrepancies detected by the backend monitor.</p></div>
          <span className={integrityAlerts.length ? "text-xs font-semibold rounded-full px-2.5 py-1 bg-red-100 text-red-700" : "text-xs font-semibold rounded-full px-2.5 py-1 bg-emerald-50 text-emerald-700"}>{integrityAlerts.length} open</span>
        </div>
        {integrityAlertError ? <p className="text-xs text-amber-700">{integrityAlertError}</p> :
          integrityAlerts.length === 0 ? <p className="text-sm text-gray py-4">No open discrepancy alerts.</p> :
          <div className="space-y-2">{integrityAlerts.map(alert => <div key={alert.id} className="rounded-xl border border-red-200 bg-red-50/70 p-3 flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-semibold text-red-900">{alert.title || "Balance discrepancy detected"}</p>
              <p className="text-xs text-red-800 mt-1">{alert.details || "Account balance differs from the latest posted ledger balance."}</p>
              <p className="text-[10px] text-red-700 mt-1">{alert.last_seen_at ? new Date(alert.last_seen_at).toLocaleString() : ""}</p></div>
            <span className="text-xs font-bold text-red-800 whitespace-nowrap">{formatCurrency(alert.difference || 0)}</span>
          </div>)}</div>}
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <TreasuryPosition />
        <LiveBankingActivity />
      </div>

      {/* Pending Approvals + AI Recommendations + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <PendingApprovalsWidget />
        <AIRecommendationsWidget />
        <SystemHealthWidget />
      </div>

      {/* Recent Governance Activity */}
      <div className="vantoris-glass-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-navy" />
            <h3 className="text-foreground font-semibold text-sm">Recent Governance Activity</h3>
          </div>
          <Link to="/operations/audit-logs" className="text-navy text-xs hover:underline flex items-center gap-1 font-medium">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity size={24} className="text-gray/30 mx-auto mb-2" />
            <p className="text-gray text-xs">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-0">
            {recentActivity.map(item => (
              <div key={item.id || Math.random()} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-navy/8 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={14} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium capitalize truncate">{item.action}</p>
                  <p className="text-gray text-xs truncate">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray text-[10px]">{item.admin}</p>
                  <p className="text-gray/60 text-[10px]">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OperationsPageLayout>
  );
}
