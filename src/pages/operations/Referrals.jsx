import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users2 } from 'lucide-react';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [refs, usrs, accts, apps] = await Promise.all([
        base44.entities.Referral.list('-created_date', 200),
        base44.entities.User.list('-created_date', 200),
        base44.entities.Account.list('-created_date', 200),
        base44.entities.Application.list('-created_date', 200),
      ]);
      setReferrals(refs);
      setUsers(usrs);
      setAccounts(accts);
      setApplications(apps);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getUser(id) { return users.find(u => u.id === id); }

  // Build a summary per referrer with success rate
  const referrerStats = {};
  referrals.forEach(r => {
    if (!referrerStats[r.referrer_id]) {
      referrerStats[r.referrer_id] = { count: 0, completed: 0, totalBalance: 0, names: [] };
    }
    referrerStats[r.referrer_id].count++;
    if (r.status === 'completed') {
      referrerStats[r.referrer_id].completed++;
    }
    const refAccounts = accounts.filter(a => a.user_id === r.referred_id);
    referrerStats[r.referrer_id].totalBalance += refAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    referrerStats[r.referrer_id].names.push(r.referred_name || r.referred_email || '—');
  });

  // Sort by success rate
  const sortedReferrers = Object.entries(referrerStats)
    .map(([id, stats]) => ({
      id,
      ...stats,
      successRate: stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0,
    }))
    .sort((a, b) => b.completed - a.completed);

  if (loading) {
    return (
      <OperationsPageLayout title="Referrals" description="Track member referral activity" icon={Users2}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Referrals" description="Track member referral activity and signup sources" icon={Users2}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Total Referrals</p>
          <p className="text-2xl font-bold text-white mt-1">{referrals.length}</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Active Referrers</p>
          <p className="text-2xl font-bold text-white mt-1">{sortedReferrers.length}</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Completed Signups</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{referrals.filter(r => r.status === 'completed').length}</p>
        </div>
        <div className="vantoris-card p-4">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider">Total AUM from Referrals</p>
          <p className="text-lg font-bold text-brass mt-1">{formatCurrency(sortedReferrers.reduce((sum, r) => sum + r.totalBalance, 0))}</p>
        </div>
      </div>

      {/* Referrer Performance Table */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-lg mb-4">Referrer Performance & Incentives</h3>
        <div className="vantoris-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Referrer</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Referrals</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Success Rate</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Total AUM</th>
              </tr>
            </thead>
            <tbody>
              {sortedReferrers.map(referrer => {
                const user = getUser(referrer.id);
                return (
                  <tr key={referrer.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm">{user?.full_name || '—'}</p>
                      <p className="text-[#AAB4C3] text-xs">{user?.email || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white font-semibold">{referrer.completed}</span>
                      <span className="text-[#AAB4C3] text-xs"> / {referrer.count}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#242D38] rounded-full overflow-hidden">
                          <div className="h-full bg-brass" style={{ width: `${referrer.successRate}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${
                          referrer.successRate >= 80 ? 'text-emerald-400' :
                          referrer.successRate >= 50 ? 'text-brass' : 'text-red-400'
                        }`}>
                          {referrer.successRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-emerald-400 font-semibold">{formatCurrency(referrer.totalBalance)}</p>
                    </td>
                  </tr>
                );
              })}
              {sortedReferrers.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-[#AAB4C3]">No referrer data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Referrals Table */}
      <div>
        <h3 className="text-white font-semibold text-lg mb-4">All Referral Activity</h3>
        <div className="vantoris-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Referred By</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">New Member</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Member Balance</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(ref => {
                const referrer = getUser(ref.referrer_id);
                const referred = getUser(ref.referred_id);
                const referredAccts = accounts.filter(a => a.user_id === ref.referred_id);
                const referredBalance = referredAccts.reduce((s, a) => s + (a.balance || 0), 0);
                return (
                  <tr key={ref.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm">{referrer?.full_name || '—'}</p>
                      <p className="text-[#AAB4C3] text-xs">{referrer?.email || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-sm font-medium">{referred?.full_name || ref.referred_name || ref.referred_email || '—'}</p>
                      <p className="text-[#AAB4C3] text-xs">{referred?.email || ref.referred_email || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-sm font-semibold ${referredBalance > 0 ? 'text-emerald-400' : 'text-[#AAB4C3]'}`}>
                        {formatCurrency(referredBalance)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                      {new Date(ref.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        ref.status === 'completed'
                          ? 'bg-olive/20 text-emerald-400 border-olive/30'
                          : 'bg-brass/15 text-brass border-brass/30'
                      }`}>
                        {ref.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-[#AAB4C3]">No referrals yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </OperationsPageLayout>
  );
}