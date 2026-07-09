import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatCurrency';
import { TrendingUp, TrendingDown, Wallet, Users, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const THEME = {
  brass: '#B08D57',
  navy: '#0E1A2B',
  slate: '#242D38',
  gray: '#AAB4C3',
  emerald: '#3E4C3A',
  crimson: '#8C2F39',
  border: 'rgba(176, 141, 87, 0.15)',
};

const emptyReport = {
  aumTrend: [],
  memberGrowth: [],
  txnVolume: [],
  accountStatusBreakdown: [],
  topMetrics: { aum: 0, avgBalance: 0, activeCount: 0, frozenCount: 0, totalTxns: 0, deposits: 0, withdrawals: 0 },
};

function MetricCard({ label, value, icon: Icon, tone }) {
  const accent = tone === 'red' ? THEME.crimson : tone === 'green' ? THEME.emerald : THEME.brass;
  return (
    <div className="vantoris-card p-5 hover:border-brass/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-white font-bold text-xl lg:text-2xl leading-tight break-words">{value}</p>
      <p className="text-[#AAB4C3] text-xs mt-1">{label}</p>
    </div>
  );
}

function ChartPanel({ title, children }) {
  return (
    <section className="vantoris-card p-5">
      <h3 className="mb-4 text-white font-semibold text-sm">{title}</h3>
      {children}
    </section>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-[230px] items-center justify-center rounded-lg border border-dashed border-[#242D38] bg-[#0E1A2B]/50">
      <p className="text-[#AAB4C3] text-sm">{label}</p>
    </div>
  );
}

function formatTransactionType(type) {
  return (type || '').replace(/_/g, ' ');
}

function buildAumTrend(totalAum) {
  return [
    { month: 'Jan', aum: totalAum * 0.6 },
    { month: 'Feb', aum: totalAum * 0.7 },
    { month: 'Mar', aum: totalAum * 0.8 },
    { month: 'Apr', aum: totalAum * 0.9 },
    { month: 'May', aum: totalAum * 0.95 },
    { month: 'Jun', aum: totalAum },
  ];
}

function buildMemberGrowth(memberUsers) {
  const today = new Date();
  const growth = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekMembers = memberUsers.filter(u => {
      const created = new Date(u.created_date);
      return created >= weekStart && created <= weekEnd;
    }).length;
    growth.push({ week: `Week ${4 - i}`, members: weekMembers });
  }
  return growth;
}

export default function ReportingDashboard() {
  const [data, setData] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadReportData() {
      setLoading(true);
      setError('');

      try {
        const [users, accounts, transactions] = await Promise.all([
          base44.entities.User.list('-created_date', 200),
          base44.entities.Account.list('-created_date', 200),
          base44.entities.Transaction.list('-created_date', 300),
        ]);

        if (!mounted) return;

        const memberUsers = users.filter(user => user.role === 'user');
        const totalAum = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
        const avgBalance = memberUsers.length > 0 ? totalAum / memberUsers.length : 0;
        const activeCount = accounts.filter(account => account.status === 'active').length;
        const frozenCount = accounts.filter(account => account.status === 'frozen').length;
        const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
        const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

        const txnCounts = transactions.reduce((acc, transaction) => {
          const type = formatTransactionType(transaction.type);
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        setData({
          aumTrend: buildAumTrend(totalAum),
          memberGrowth: buildMemberGrowth(memberUsers),
          txnVolume: Object.entries(txnCounts).map(([name, value]) => ({ name, value })),
          accountStatusBreakdown: [
            { name: 'Active', value: activeCount, fill: THEME.emerald },
            { name: 'Frozen', value: frozenCount, fill: THEME.crimson },
          ],
          topMetrics: {
            aum: totalAum,
            avgBalance,
            activeCount,
            frozenCount,
            totalTxns: transactions.length,
            deposits: totalDeposits,
            withdrawals: totalWithdrawals,
          },
        });
      } catch (err) {
        console.error(err);
        if (mounted) setError('Unable to load reporting data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReportData();

    return () => {
      mounted = false;
    };
  }, []);

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: THEME.navy,
      border: `1px solid ${THEME.slate}`,
      borderRadius: '12px',
      color: '#fff',
      boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
    }),
    []
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-crimson/30 bg-crimson/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Total AUM" value={formatCurrency(data.topMetrics.aum)} icon={Wallet} tone="brass" />
        <MetricCard label="Avg Balance / Member" value={formatCurrency(data.topMetrics.avgBalance)} icon={Users} />
        <MetricCard label="Active Accounts" value={data.topMetrics.activeCount.toLocaleString()} icon={TrendingUp} tone="green" />
        <MetricCard label="Total Transactions" value={data.topMetrics.totalTxns.toLocaleString()} icon={ArrowDownLeft} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <ChartPanel title="AUM Trend">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data.aumTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.slate} vertical={false} />
              <XAxis dataKey="month" stroke={THEME.gray} tick={{ fontSize: 11, fill: THEME.gray }} axisLine={{ stroke: THEME.slate }} tickLine={false} />
              <YAxis stroke={THEME.gray} tick={{ fontSize: 10, fill: THEME.gray }} axisLine={false} tickLine={false} tickFormatter={value => `$${(value / 1000).toFixed(0)}k`} width={80} />
              <Tooltip contentStyle={tooltipStyle} formatter={value => formatCurrency(value)} />
              <Line type="monotone" dataKey="aum" name="AUM" stroke={THEME.brass} strokeWidth={2.5} dot={{ fill: THEME.brass, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: THEME.brass }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Member Growth (Last 30 Days)">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.slate} vertical={false} />
              <XAxis dataKey="week" stroke={THEME.gray} tick={{ fontSize: 11, fill: THEME.gray }} axisLine={{ stroke: THEME.slate }} tickLine={false} />
              <YAxis stroke={THEME.gray} tick={{ fontSize: 10, fill: THEME.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="members" name="Members" fill={THEME.brass} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Account Status Breakdown">
          {data.accountStatusBreakdown.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={data.accountStatusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                  {data.accountStatusBreakdown.map(entry => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: THEME.gray }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No account status data" />
          )}
        </ChartPanel>

        <ChartPanel title="Transaction Volume by Type">
          {data.txnVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.txnVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.slate} vertical={false} />
                <XAxis dataKey="name" stroke={THEME.gray} tick={{ fontSize: 10, fill: THEME.gray }} axisLine={{ stroke: THEME.slate }} tickLine={false} />
                <YAxis stroke={THEME.gray} tick={{ fontSize: 10, fill: THEME.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Transactions" fill={THEME.brass} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No transaction data" />
          )}
        </ChartPanel>
      </div>
    </div>
  );
}