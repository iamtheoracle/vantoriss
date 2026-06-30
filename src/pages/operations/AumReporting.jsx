import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { formatCurrency } from '@/lib/formatCurrency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export default function AumReporting() {
  const [timeRange, setTimeRange] = useState('month');
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ currentAum: 0, growth: 0, peakAum: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [timeRange]);

  async function loadData() {
    try {
      const accounts = await base44.entities.Account.list('-created_date', 300);
      const transactions = await base44.entities.Transaction.list('-created_date', 500);

      const currentAum = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      const today = new Date();
      let dataPoints = [];

      if (timeRange === 'week') {
        // 7 days by day
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const dayTxns = transactions.filter(t => {
            const tDate = new Date(t.created_date);
            return tDate >= dayStart && tDate <= dayEnd;
          });

          let dayBalance = 0;
          dayTxns.forEach(t => {
            dayBalance += t.amount || 0;
          });

          dataPoints.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            aum: Math.max(0, dayBalance),
          });
        }
      } else if (timeRange === 'month') {
        // 4 weeks
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const weekTxns = transactions.filter(t => {
            const tDate = new Date(t.created_date);
            return tDate >= weekStart && tDate <= weekEnd;
          });

          let weekBalance = 0;
          weekTxns.forEach(t => {
            weekBalance += t.amount || 0;
          });

          dataPoints.push({
            date: `Week ${4 - i}`,
            aum: Math.max(0, weekBalance),
          });
        }
      } else if (timeRange === 'year') {
        // 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const monthTxns = transactions.filter(t => {
            const tDate = new Date(t.created_date);
            return tDate >= monthStart && tDate <= monthEnd;
          });

          let monthBalance = 0;
          monthTxns.forEach(t => {
            monthBalance += t.amount || 0;
          });

          dataPoints.push({
            date: date.toLocaleDateString('en-US', { month: 'short' }),
            aum: Math.max(0, monthBalance),
          });
        }
      }

      // Add current AUM as final point
      dataPoints.push({
        date: 'Today',
        aum: currentAum,
      });

      const peakAum = Math.max(...dataPoints.map(d => d.aum), 0);
      const startBalance = dataPoints[0]?.aum || 0;
      const growth = startBalance > 0 ? ((currentAum - startBalance) / startBalance) * 100 : 0;

      setChartData(dataPoints);
      setStats({ currentAum, growth, peakAum });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="AUM Reporting" description="Track assets under management over time" icon={TrendingUp}>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="AUM Reporting" description="Track assets under management over time" icon={TrendingUp}>
      {/* Time Range Selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#AAB4C3]" />
          <span className="text-[#AAB4C3] text-sm font-medium">View:</span>
        </div>
        {['week', 'month', 'year'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              timeRange === range
                ? 'bg-brass text-[#0E1A2B]'
                : 'bg-[#242D38] text-[#AAB4C3] hover:text-white'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Current AUM</p>
          <p className="text-white font-bold text-2xl">{formatCurrency(stats.currentAum)}</p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Period Growth</p>
          <p className={`text-2xl font-bold ${stats.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}%
          </p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Peak AUM</p>
          <p className="text-white font-bold text-2xl">{formatCurrency(stats.peakAum)}</p>
        </div>
      </div>

      {/* AUM Trend Chart */}
      <div className="vantoris-card p-6 mb-6">
        <h3 className="text-white font-semibold mb-6">AUM Trend</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
              <XAxis dataKey="date" stroke="#AAB4C3" />
              <YAxis stroke="#AAB4C3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38' }}
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend wrapperStyle={{ color: '#AAB4C3' }} />
              <Line
                type="monotone"
                dataKey="aum"
                name="AUM"
                stroke="#B08D57"
                strokeWidth={3}
                dot={{ fill: '#B08D57', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[#AAB4C3] text-center py-12">No data available</p>
        )}
      </div>

      {/* Period-over-Period Comparison (Bar Chart) */}
      <div className="vantoris-card p-6">
        <h3 className="text-white font-semibold mb-6">Period Comparison</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
              <XAxis dataKey="date" stroke="#AAB4C3" />
              <YAxis stroke="#AAB4C3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="aum" fill="#B08D57" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[#AAB4C3] text-center py-12">No data available</p>
        )}
      </div>
    </OperationsPageLayout>
  );
}