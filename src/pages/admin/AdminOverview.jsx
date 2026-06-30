import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users, FileText, ArrowDownToLine, Wallet, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/vantoris/StatusBadge';
import AumChart from '@/components/vantoris/AumChart';
import QuickReview from '@/components/vantoris/QuickReview';
import DailyEmailSummary from '@/components/vantoris/DailyEmailSummary';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, pendingApps: 0, pendingWithdrawals: 0, totalBalance: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [quickReview, setQuickReview] = useState({ oldestApps: [], recentWithdrawals: [] });
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

      const oldestApps = apps
        .filter(a => a.application_status === 'pending')
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
        .slice(0, 3);
      const recentWithdrawals = withdrawals
        .filter(w => w.status === 'pending')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 2);
      setQuickReview({ oldestApps, recentWithdrawals });

      const recent = [
        ...apps.filter(a => a.application_status === 'pending').map(a => ({
          id: a.id, type: 'Application', name: a.full_name, detail: a.account_type,
          date: a.created_date, status: a.application_status,
        })),
        ...withdrawals.filter(w => w.status === 'pending').map(w => ({
          id: w.id, type: 'Withdrawal', name: `${formatCurrency(w.amount)}`, detail: w.method,
          date: w.created_date, status: w.status,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
      setRecentItems(recent);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Members', value: stats.members, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', path: '/operations/members' },
    { label: 'Pending Apps', value: stats.pendingApps, icon: FileText, color: 'text-brass', bg: 'bg-brass/15', path: '/operations/applications' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: ArrowDownToLine, color: 'text-red-400', bg: 'bg-crimson/15', path: '/operations/withdrawals' },
    { label: 'Total Balance (AUM)', value: formatCurrency(stats.totalBalance), icon: Wallet, color: 'text-emerald-400', bg: 'bg-olive/20', large: true, path: '/operations/finance' },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Operations Center</h1>
          <p className="text-[#AAB4C3] text-sm">System overview and pending actions</p>
        </div>
        <DailyEmailSummary />
      </div>

      {/* Stats Grid — responsive: 2 cols phone, 2 cols tablet portrait, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="vantoris-card p-4 sm:p-5 text-left hover:border-brass/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon size={18} className={card.color} />
                </div>
              </div>
              <p className={`font-bold text-white ${card.large ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'} leading-tight break-words`}>
                {card.value}
              </p>
              <p className="text-[#AAB4C3] text-[11px] sm:text-xs mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* AUM Chart */}
      <div className="mb-6 lg:mb-8">
        <AumChart />
      </div>

      {/* Quick Review */}
      <div className="mb-6 lg:mb-8">
        <QuickReview oldestApps={quickReview.oldestApps} recentWithdrawals={quickReview.recentWithdrawals} />
      </div>

      {/* Recent Queue */}
      <div className="vantoris-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Recent Queue</h3>
          <span className="text-[#AAB4C3] text-xs">{recentItems.length} pending items</span>
        </div>

        {/* Desktop / Tablet Table */}
         <div className="hidden md:block">
           <div className="overflow-x-auto">
           <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Type</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Details</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3 pr-4">Submitted</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map(item => (
                <tr key={item.id} className="border-b border-[#242D38]/40 last:border-0 hover:bg-[#242D38]/30 transition-all">
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.type === 'Application' ? 'bg-brass/10 text-brass' : 'bg-crimson/10 text-red-400'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-[#AAB4C3] text-xs">{item.detail}</p>
                  </td>
                  <td className="py-3 pr-4 text-[#AAB4C3] text-xs">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
              {recentItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#AAB4C3] text-sm">No pending items</td>
                </tr>
              )}
            </tbody>
            </table>
            </div>
            </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2">
          {recentItems.map(item => (
            <div key={item.id} className="border border-[#242D38]/40 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.type === 'Application' ? 'bg-brass/10 text-brass' : 'bg-crimson/10 text-red-400'
                }`}>
                  {item.type}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-white font-medium text-sm">{item.name}</p>
              <p className="text-[#AAB4C3] text-xs">{item.detail}</p>
              <p className="text-[#AAB4C3]/50 text-[10px] mt-1">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ))}
          {recentItems.length === 0 && (
            <div className="py-8 text-center text-[#AAB4C3] text-sm">No pending items</div>
          )}
        </div>
      </div>
    </div>
  );
}