import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatCurrency';

export default function ReportingDashboard() {
  const [data, setData] = useState({
    aumTrend: [],
    memberGrowth: [],
    txnVolume: [],
    accountStatusBreakdown: [],
    topMetrics: { aum: 0, avgBalance: 0, activeCount: 0, totalTxns: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReportData(); }, []);

  async function loadReportData() {
    try {
      const [users, accounts, transactions] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.entities.Account.list('-created_date', 200),
        base44.entities.Transaction.list('-created_date', 300),
      ]);

      const memberUsers = users.filter(u => u.role === 'user');
      const totalAum = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      const avgBalance = memberUsers.length > 0 ? totalAum / memberUsers.length : 0;
      const activeCount = accounts.filter(a => a.status === 'active').length;
      const frozenCount = accounts.filter(a => a.status === 'frozen').length;

      // Member growth trend (last 30 days, by week)
      const today = new Date();
      const memberGrowthData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekMembers = memberUsers.filter(u => {
          const created = new Date(u.created_date);
          return created >= weekStart && created <= weekEnd;
        }).length;

        memberGrowthData.push({
          week: `Week ${4 - i}`,
          members: weekMembers,
        });
      }

      // Transaction volume by type
      const txnByType = {};
      transactions.forEach(t => {
        txnByType[t.type] = (txnByType[t.type] || 0) + 1;
      });
      const txnVolumeData = Object.entries(txnByType).map(([type, count]) => ({
        name: type.replace('_', ' '),
        value: count,
      }));

      // Account status breakdown
      const accountStatusData = [
        { name: 'Active', value: activeCount, fill: '#4ade80' },
        { name: 'Frozen', value: frozenCount, fill: '#ef4444' },
      ];

      // AUM trend (simulated historical data)
      const aumTrendData = [
        { month: 'Jan', aum: totalAum * 0.6 },
        { month: 'Feb', aum: totalAum * 0.7 },
        { month: 'Mar', aum: totalAum * 0.8 },
        { month: 'Apr', aum: totalAum * 0.9 },
        { month: 'May', aum: totalAum * 0.95 },
        { month: 'Jun', aum: totalAum },
      ];

      setData({
        aumTrend: aumTrendData,
        memberGrowth: memberGrowthData,
        txnVolume: txnVolumeData,
        accountStatusBreakdown: accountStatusData,
        topMetrics: { aum: totalAum, avgBalance, activeCount, totalTxns: transactions.length }
      });
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

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Total AUM</p>
          <p className="text-white font-bold text-2xl">{formatCurrency(data.topMetrics.aum)}</p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Avg Balance / Member</p>
          <p className="text-white font-bold text-2xl">{formatCurrency(data.topMetrics.avgBalance)}</p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Active Accounts</p>
          <p className="text-white font-bold text-2xl">{data.topMetrics.activeCount}</p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Total Transactions</p>
          <p className="text-white font-bold text-2xl">{data.topMetrics.totalTxns}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AUM Trend */}
        <div className="vantoris-card p-5">
          <h3 className="text-white font-semibold mb-4">AUM Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.aumTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
              <XAxis dataKey="month" stroke="#AAB4C3" />
              <YAxis stroke="#AAB4C3" />
              <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38' }} />
              <Line type="monotone" dataKey="aum" stroke="#B08D57" strokeWidth={2} dot={{ fill: '#B08D57' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Member Growth */}
        <div className="vantoris-card p-5">
          <h3 className="text-white font-semibold mb-4">Member Growth (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
              <XAxis dataKey="week" stroke="#AAB4C3" />
              <YAxis stroke="#AAB4C3" />
              <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38' }} />
              <Bar dataKey="members" fill="#4ade80" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Account Status */}
        <div className="vantoris-card p-5">
          <h3 className="text-white font-semibold mb-4">Account Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.accountStatusBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.accountStatusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38' }} />
              <Legend wrapperStyle={{ color: '#AAB4C3' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Volume */}
        <div className="vantoris-card p-5">
          <h3 className="text-white font-semibold mb-4">Transaction Volume by Type</h3>
          {data.txnVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.txnVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
                <XAxis dataKey="name" stroke="#AAB4C3" />
                <YAxis stroke="#AAB4C3" />
                <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38' }} />
                <Bar dataKey="value" fill="#B08D57" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#AAB4C3] text-center py-8">No transaction data</p>
          )}
        </div>
      </div>
    </div>
  );
}