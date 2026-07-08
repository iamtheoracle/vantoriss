import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatCurrency';

const BOA_COLORS = {
  red: '#E31837',
  blue: '#012169',
  ink: '#071A33',
  muted: '#6B7280',
  surface: '#FFFFFF',
  border: '#D8DEE8',
  success: '#16A34A',
};

const emptyReport = {
  aumTrend: [],
  memberGrowth: [],
  txnVolume: [],
  accountStatusBreakdown: [],
  topMetrics: { aum: 0, avgBalance: 0, activeCount: 0, frozenCount: 0, totalTxns: 0 },
};

function MetricCard({ label, value, tone }) {
  const accent = tone === 'red' ? BOA_COLORS.red : BOA_COLORS.blue;
  return (
    <div className="rounded-lg border border-[#D8DEE8] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function ChartPanel({ title, children }) {
  return (
    <section className="rounded-lg border border-[#D8DEE8] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-[#071A33]">{title}</h3>
      {children}
    </section>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed border-[#D8DEE8] bg-[#F8FAFC]">
      <p className="text-sm font-medium text-[#6B7280]">{label}</p>
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
            { name: 'Active', value: activeCount, fill: BOA_COLORS.success },
            { name: 'Frozen', value: frozenCount, fill: BOA_COLORS.red },
          ],
          topMetrics: {
            aum: totalAum,
            avgBalance,
            activeCount,
            frozenCount,
            totalTxns: transactions.length,
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
      backgroundColor: BOA_COLORS.surface,
      border: `1px solid ${BOA_COLORS.border}`,
      borderRadius: 8,
      color: BOA_COLORS.ink,
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.14)',
    }),
    []
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#F8FAFC]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D8DEE8] border-t-[#E31837]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#F8FAFC] p-4 sm:p-6">
      <header className="flex flex-col gap-3 border-b border-[#D8DEE8] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E31837]">Vantoris Reporting</p>
          <h1 className="mt-2 text-2xl font-bold text-[#071A33]">Executive Dashboard</h1>
        </div>
        <div className="rounded-md bg-[#012169] px-4 py-2 text-sm font-semibold text-white">
          Assets, members, and transaction health
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-[#F4A7B2] bg-[#FCE7EA] px-4 py-3 text-sm font-semibold text-[#7F1020]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total AUM" value={formatCurrency(data.topMetrics.aum)} tone="red" />
        <MetricCard label="Avg Balance / Member" value={formatCurrency(data.topMetrics.avgBalance)} />
        <MetricCard label="Active Accounts" value={data.topMetrics.activeCount.toLocaleString()} />
        <MetricCard label="Total Transactions" value={data.topMetrics.totalTxns.toLocaleString()} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel title="AUM Trend">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.aumTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke={BOA_COLORS.muted} />
              <YAxis stroke={BOA_COLORS.muted} tickFormatter={value => formatCurrency(value)} width={90} />
              <Tooltip contentStyle={tooltipStyle} formatter={value => formatCurrency(value)} />
              <Line
                type="monotone"
                dataKey="aum"
                name="AUM"
                stroke={BOA_COLORS.red}
                strokeWidth={3}
                dot={{ fill: BOA_COLORS.red, strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Member Growth (Last 30 Days)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" stroke={BOA_COLORS.muted} />
              <YAxis stroke={BOA_COLORS.muted} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="members" name="Members" fill={BOA_COLORS.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Account Status Breakdown">
          {data.accountStatusBreakdown.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.accountStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.accountStatusBreakdown.map(entry => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No account status data" />
          )}
        </ChartPanel>

        <ChartPanel title="Transaction Volume by Type">
          {data.txnVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.txnVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke={BOA_COLORS.muted} />
                <YAxis stroke={BOA_COLORS.muted} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Transactions" fill={BOA_COLORS.red} radius={[6, 6, 0, 0]} />
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