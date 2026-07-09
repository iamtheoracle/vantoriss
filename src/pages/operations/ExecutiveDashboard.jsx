import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown, TrendingUp, TrendingDown, Wallet, Users, FileText,
  ArrowDownToLine, ArrowUpRight, BarChart3, ShieldCheck,
  HeartPulse, Activity, DollarSign, ScrollText, Bot,
} from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';
import ReportingDashboard from '@/components/vantoris/ReportingDashboard';

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, totalBalance: 0, pendingApps: 0, pendingWithdrawals: 0, totalAccounts: 0, frozenAccounts: 0, totalDeposits: 0, totalWithdrawals: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [users, apps, withdrawals, accounts, transactions, auditLogs] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.entities.Application.list('-created_date', 50),
        base44.entities.WithdrawalRequest.list('-created_date', 50),
        base44.entities.Account.list('-created_date', 200),
        base44.entities.Transaction.list('-created_date', 100),
        base44.entities.AuditLog.list('-created_date', 15),
      ]);

      const memberCount = users.filter(u => u.role === 'user').length;
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
      const pendingApps = apps.filter(a => a.application_status === 'pending').length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
      const frozenAccounts = accounts.filter(a => a.status === 'frozen').length;
      const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

      setStats({
        members: memberCount,
        totalBalance,
        pendingApps,
        pendingWithdrawals,
        totalAccounts: accounts.length,
        frozenAccounts,
        totalDeposits,
        totalWithdrawals,
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
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const kpiCards = [
    { label: 'Assets Under Management', value: formatCurrency(stats.totalBalance), icon: Wallet, color: 'text-brass', bg: 'bg-brass/15', path: '/operations/finance' },
    { label: 'Total Members', value: stats.members, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', path: '/operations/members' },
    { label: 'Active Accounts', value: stats.totalAccounts, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-olive/20', path: '/operations/accounts' },
    { label: 'Frozen Accounts', value: stats.frozenAccounts, icon: ShieldCheck, color: 'text-red-400', bg: 'bg-crimson/15', path: '/operations/accounts' },
    { label: 'Pending Applications', value: stats.pendingApps, icon: FileText, color: 'text-brass', bg: 'bg-brass/15', path: '/operations/applications' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-crimson/15', path: '/operations/withdrawals' },
    { label: 'Total Deposits (YTD)', value: formatCurrency(stats.totalDeposits), icon: ArrowDownToLine, color: 'text-emerald-400', bg: 'bg-olive/20', path: '/operations/deposits' },
    { label: 'Total Withdrawals (YTD)', value: formatCurrency(stats.totalWithdrawals), icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-crimson/15', path: '/operations/withdrawals' },
  ];

  const quickLinks = [
    { label: 'Platform Analytics', path: '/operations', icon: BarChart3 },
    { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
    { label: 'System Health', path: '/operations/system-health', icon: HeartPulse },
    { label: 'AI Assistant', path: '/operations/assistant', icon: Bot },
    { label: 'Reports', path: '/operations/reports', icon: TrendingUp },
    { label: 'Configuration', path: '/operations/configuration', icon: ShieldCheck },
  ];

  return (
    <OperationsPageLayout title="Executive Dashboard" description="Enterprise overview and strategic metrics" icon={Crown} breadcrumb="Executive Workspace">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="vantoris-card p-4 sm:p-5 text-left hover:border-brass/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon size={17} className={card.color} />
                </div>
              </div>
              <p className={`font-bold text-white text-lg sm:text-xl lg:text-2xl leading-tight break-words`}>
                {card.value}
              </p>
              <p className="text-[#AAB4C3] text-[11px] sm:text-xs mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="vantoris-card p-4 sm:p-5 mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#242D38]/40 hover:bg-[#242D38] hover:border-brass/20 border border-transparent transition-all"
              >
                <Icon size={18} className="text-brass" />
                <span className="text-[#AAB4C3] text-[11px] text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics */}
      <div className="mb-6">
        <h2 className="text-white font-semibold text-base mb-4">Platform Analytics</h2>
        <ReportingDashboard />
      </div>

      {/* Recent Audit Activity */}
      <div className="vantoris-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Recent Governance Activity</h3>
          <Link to="/operations/audit-logs" className="text-brass text-xs hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-center py-6">
            <Activity size={24} className="text-[#AAB4C3]/30 mx-auto mb-2" />
            <p className="text-[#AAB4C3] text-xs">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-0">
            {recentActivity.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-3 border-b border-[#242D38]/40 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-brass/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={14} className="text-brass" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize truncate">{item.action}</p>
                  <p className="text-[#AAB4C3] text-xs truncate">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#AAB4C3] text-[10px]">{item.admin}</p>
                  <p className="text-[#AAB4C3]/50 text-[10px]">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OperationsPageLayout>
  );
}