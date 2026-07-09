import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, Lock, ScrollText, Activity,
  Users, Wallet, ArrowUpRight, FileText, DollarSign,
  HeartPulse, Eye, Scale, GitBranch,
} from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import PremiumStatCard from '@/components/vantoris/PremiumStatCard';
import StatusBadge from '@/components/vantoris/StatusBadge';

export default function SecurityComplianceDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAccounts: 0, frozenAccounts: 0, totalMembers: 0, pendingWithdrawals: 0, pendingApps: 0, pendingKyc: 0, totalAuditLogs: 0, totalTransactions: 0 });
  const [recentAudit, setRecentAudit] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [accounts, users, withdrawals, apps, auditLogs, transactions] = await Promise.all([
        base44.entities.Account.list('-created_date', 200),
        base44.entities.User.list('-created_date', 200),
        base44.entities.WithdrawalRequest.list('-created_date', 20),
        base44.entities.Application.list('-created_date', 100),
        base44.entities.AuditLog.list('-created_date', 10),
        base44.entities.Transaction.list('-created_date', 200),
      ]);

      const frozenAccounts = accounts.filter(a => a.status === 'frozen').length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
      const pendingKyc = apps.filter(a => a.kyc_status === 'pending').length;
      const pendingApps = apps.filter(a => a.application_status === 'pending').length;
      const memberCount = users.filter(u => u.role === 'user').length;

      setStats({
        totalAccounts: accounts.length,
        frozenAccounts,
        totalMembers: memberCount,
        pendingWithdrawals,
        pendingApps,
        pendingKyc,
        totalAuditLogs: auditLogs.length,
        totalTransactions: transactions.length,
      });

      setRecentAudit(auditLogs.slice(0, 6));
      setRecentWithdrawals(withdrawals.filter(w => w.status === 'pending').slice(0, 5));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Security & Compliance Dashboard" description="Risk monitoring, audit trail, and compliance overview" icon={ShieldCheck} breadcrumb="Security & Compliance Workspace">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const complianceLinks = [
    { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText, description: 'Immutable activity trail' },
    { label: 'Activity Timeline', path: '/operations/activity', icon: Activity, description: 'Real-time member activity' },
    { label: 'Security Center', path: '/operations/security', icon: Lock, description: 'Access controls & policies' },
    { label: 'KYC Review', path: '/operations/kyc', icon: ShieldCheck, description: 'Identity verification queue' },
    { label: 'Verification Requests', path: '/operations/verification-requests', icon: Eye, description: 'Deposit verification queue' },
    { label: 'Documents', path: '/operations/documents', icon: FileText, description: 'Member document archive' },
    { label: 'Finance Overview', path: '/operations/finance', icon: DollarSign, description: 'Treasury & financial controls' },
    { label: 'System Health', path: '/operations/system-health', icon: HeartPulse, description: 'Platform monitoring' },
    { label: 'API Management', path: '/operations/api-management', icon: GitBranch, description: 'API security & access' },
    { label: 'Configuration', path: '/operations/configuration', icon: Scale, description: 'Platform settings' },
  ];

  return (
    <OperationsPageLayout title="Security & Compliance Dashboard" description="Risk monitoring, audit trail, and compliance overview" icon={ShieldCheck} breadcrumb="Security & Compliance Workspace">
      {/* Risk Indicator Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <PremiumStatCard
          label="Frozen Accounts"
          value={stats.frozenAccounts}
          icon={Lock}
          accent="crimson"
          alert={stats.frozenAccounts > 0 ? stats.frozenAccounts : ''}
          alertIcon={AlertTriangle}
          onClick={() => navigate('/operations/accounts')}
        />
        <PremiumStatCard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          icon={ArrowUpRight}
          accent="gold"
          alert={stats.pendingWithdrawals > 0 ? stats.pendingWithdrawals : ''}
          alertIcon={AlertTriangle}
          onClick={() => navigate('/operations/withdrawals')}
        />
        <PremiumStatCard
          label="Pending KYC"
          value={stats.pendingKyc}
          icon={ShieldCheck}
          accent="brass"
          alert={stats.pendingKyc > 0 ? stats.pendingKyc : ''}
          alertIcon={AlertTriangle}
          onClick={() => navigate('/operations/kyc')}
        />
        <PremiumStatCard
          label="Pending Applications"
          value={stats.pendingApps}
          icon={FileText}
          accent="blue"
          onClick={() => navigate('/operations/applications')}
        />
      </div>

      {/* Compliance & Security Tools */}
      <div className="vantoris-glass p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={16} className="text-brass" />
          <h3 className="text-white font-semibold text-sm">Compliance & Security Tools</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {complianceLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-brass/15 transition-all"
              >
                <Icon size={16} className="text-brass" />
                <span className="text-white text-xs font-medium">{link.label}</span>
                <span className="text-[#AAB4C3]/60 text-[10px]">{link.description}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Audit Trail + Withdrawal Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Recent Audit Trail */}
        <div className="vantoris-glass p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ScrollText size={16} className="text-brass" />
              <h3 className="text-white font-semibold text-sm">Recent Audit Trail</h3>
            </div>
            <Link to="/operations/audit-logs" className="text-brass text-xs hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentAudit.length === 0 ? (
            <div className="text-center py-8">
              <ScrollText size={24} className="text-[#AAB4C3]/30 mx-auto mb-2" />
              <p className="text-[#AAB4C3] text-xs">No audit entries</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentAudit.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-brass/10 border border-brass/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ScrollText size={13} className="text-brass" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium capitalize truncate">
                      {log.action_type?.replace(/_/g, ' ') || 'Action'}
                    </p>
                    <p className="text-[#AAB4C3] text-xs truncate">{log.description}</p>
                    <p className="text-[#AAB4C3]/50 text-[10px] mt-0.5">
                      {log.admin_name || 'System'} · {new Date(log.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Withdrawal Review */}
        <div className="vantoris-glass p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={16} className="text-red-400" />
              <h3 className="text-white font-semibold text-sm">Pending Withdrawal Review</h3>
            </div>
            <Link to="/operations/withdrawals" className="text-brass text-xs hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentWithdrawals.length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpRight size={24} className="text-[#AAB4C3]/30 mx-auto mb-2" />
              <p className="text-[#AAB4C3] text-xs">No pending withdrawals</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentWithdrawals.map(wd => (
                <Link
                  key={wd.id}
                  to="/operations/withdrawals"
                  className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.04] -mx-2 px-2 rounded-lg transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-crimson/10 border border-crimson/15 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight size={13} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-red-400 text-sm font-bold">{formatCurrency(Math.abs(wd.amount))}</p>
                    <p className="text-[#AAB4C3] text-xs truncate">{wd.method}</p>
                  </div>
                  <StatusBadge status={wd.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </OperationsPageLayout>
  );
}