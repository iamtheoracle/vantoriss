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
import InstitutionalWorkQueue from '@/components/vantoris/widgets/InstitutionalWorkQueue';
import VantorisLoading from '@/components/vantoris/system/VantorisLoading';

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, totalBalance: 0, pendingApps: 0, pendingWithdrawals: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [users, apps, withdrawals, accounts, auditLogs] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.entities.Application.list('-created_date', 50),
        base44.entities.WithdrawalRequest.list('-created_date', 50),
        base44.entities.Account.list('-created_date', 200),
        base44.entities.AuditLog.list('-created_date', 15),
      ]);

      setStats({
        members: users.filter(u => u.role === 'user').length,
        totalBalance: accounts.reduce((s, a) => s + (a.balance || 0), 0),
        pendingApps: apps.filter(a => a.application_status === 'pending').length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
      });
      setRecentActivity(auditLogs.slice(0, 8).map(log => ({
        id: log.id,
        action: log.action_type?.replace(/_/g, ' ') || 'Action',
        description: log.description || '',
        admin: log.admin_name || 'System',
        date: log.created_date,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard hero label="Assets Under Management" value={formatCurrency(stats.totalBalance)} sublabel="Total across all member accounts" icon={Wallet} accent="navy" onClick={() => navigate('/operations/finance')} />
        <PremiumStatCard label="Total Members" value={stats.members} icon={Users} accent="blue" onClick={() => navigate('/operations/members')} />
        <PremiumStatCard label="Pending Applications" value={stats.pendingApps} icon={FileText} accent="gold" alert={stats.pendingApps > 0 ? stats.pendingApps : ''} alertIcon={AlertTriangle} onClick={() => navigate('/operations/applications')} />
        <PremiumStatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} icon={ArrowUpRight} accent="crimson" alert={stats.pendingWithdrawals > 0 ? stats.pendingWithdrawals : ''} alertIcon={AlertTriangle} onClick={() => navigate('/operations/withdrawals')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <TreasuryPosition />
        <LiveBankingActivity />
        <InstitutionalWorkQueue />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <PendingApprovalsWidget />
        <AIRecommendationsWidget />
        <SystemHealthWidget />
      </div>

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
              <div key={item.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-navy/8 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={14} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium capitalize truncate">{item.action}</p>
                  <p className="text-gray text-xs truncate">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray text-[10px]">{item.admin}</p>
                  <p className="text-gray/60 text-[10px]">{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OperationsPageLayout>
  );
}
