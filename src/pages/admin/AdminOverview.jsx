import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users, FileText, ArrowUpRight, Wallet, Briefcase } from 'lucide-react';
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

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, pendingApps: 0, pendingWithdrawals: 0, totalBalance: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [users, apps, withdrawals, accounts] = await Promise.all([
        base44.entities.User.list('-created_date', 50),
        base44.entities.Application.list('-created_date', 50),
        base44.entities.WithdrawalRequest.list('-created_date', 50),
        base44.entities.Account.list('-created_date', 50),
      ]);
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      const pendingApps = apps.filter(a => a.application_status === 'pending').length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
      const memberCount = users.filter(u => u.role === 'user').length;
      setStats({ members: memberCount, pendingApps, pendingWithdrawals, totalBalance });
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
      <OperationsPageLayout title="Daily Operations" description="Operational dashboard and queue management" icon={Briefcase} breadcrumb="Operations Workspace">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Daily Operations"
      description="Operational dashboard and queue management"
      icon={Briefcase}
      breadcrumb="Operations Workspace"
      actions={<div className="flex items-center gap-2"><QuickActionsMenu onActionComplete={loadData} /><DailyEmailSummary /></div>}
    >
      {/* Today's Operational Summary */}
      <div className="mb-6">
        <TodaysOperationalSummary />
      </div>

      {/* Critical Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard hero label="Assets Under Management" value={formatCurrency(stats.totalBalance)} sublabel="Total across all accounts" icon={Wallet} accent="brass" onClick={() => navigate('/operations/finance')} />
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
      <div className="vantoris-glass p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Operations Queue</h3>
          <span className="text-[#AAB4C3] text-xs">{recentItems.length} pending items</span>
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Type</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Details</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Submitted</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map(item => (
                  <tr key={item.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-all">
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Application' ? 'bg-brass/10 text-brass' : 'bg-crimson/10 text-red-400'}`}>{item.type}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-[#AAB4C3] text-xs">{item.detail}</p>
                    </td>
                    <td className="py-3 pr-4 text-[#AAB4C3] text-xs">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="py-3"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
                {recentItems.length === 0 && (<tr><td colSpan={4} className="py-8 text-center text-[#AAB4C3] text-sm">No pending items</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-2">
          {recentItems.map(item => (
            <div key={item.id} className="border border-white/[0.06] rounded-xl p-3 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Application' ? 'bg-brass/10 text-brass' : 'bg-crimson/10 text-red-400'}`}>{item.type}</span>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-white font-medium text-sm">{item.name}</p>
              <p className="text-[#AAB4C3] text-xs">{item.detail}</p>
              <p className="text-[#AAB4C3]/50 text-[10px] mt-1">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          ))}
          {recentItems.length === 0 && (<div className="py-8 text-center text-[#AAB4C3] text-sm">No pending items</div>)}
        </div>
      </div>
    </OperationsPageLayout>
  );
}