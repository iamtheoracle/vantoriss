import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users, FileText, ArrowUpRight, Wallet, Briefcase, Activity, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Totals come from the server so they are not limited to the most recent page of records.
      const [users, apps, withdrawals, balanceAgg, pendingApps, pendingWithdrawals] = await Promise.all([
        base44.entities.User.list('-created_date', 500),
        base44.entities.Application.list('-created_date', 50),
        base44.entities.WithdrawalRequest.list('-created_date', 50),
        base44.entities.Account.aggregate({ sum: ['balance'] }),
        base44.entities.Application.count({ application_status: 'pending' }),
        base44.entities.WithdrawalRequest.count({ status: 'pending' }),
      ]);
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
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
      setRecentItems(recent);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

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

      {/* Today's Operational Summary */}
      <div className="mb-6">
        <TodaysOperationalSummary />
      </div>

      {/* Critical Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard hero label="Assets Under Management" value={formatCurrency(stats.totalBalance)} sublabel={`Across ${stats.accountCount} account${stats.accountCount === 1 ? '' : 's'}`} icon={Wallet} accent="navy" onClick={() => navigate('/operations/finance')} />
        <PremiumStatCard label="Total Members" value={stats.members} icon={Users} accent="blue" onClick={() => navigate('/operations/members')} />
        <PremiumStatCard label="Pending Applications" value={stats.pendingApps} icon={FileText} accent="gold" onClick={() => navigate('/operations/applications')} />
        <PremiumStatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} icon={ArrowUpRight} accent="crimson" onClick={() => navigate('/operations/withdrawals')} />
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