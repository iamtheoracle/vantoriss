import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function AumChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [accounts, transactions] = await Promise.all([
        base44.entities.Account.list('-created_date', 200),
        base44.entities.Transaction.list('-created_date', 500),
      ]);

      const currentAum = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

      // Build last 6 months
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
          aum: 0,
        });
      }

      // For each month, sum all transactions up to end of that month = AUM at that point
      months.forEach((m) => {
        const total = transactions.reduce((sum, t) => {
          const tDate = new Date(t.transaction_date || t.created_date);
          if (tDate <= m.end) {
            return sum + (t.amount || 0);
          }
          return sum;
        }, 0);
        m.aum = total;
      });

      // If we have transactions but the running sum doesn't match current balance,
      // anchor the latest month to the actual current AUM for accuracy
      if (months.length > 0) {
        months[months.length - 1].aum = currentAum;
      }

      setData(months);
    } catch (e) {
      console.error('AUM chart error:', e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="vantoris-card p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="vantoris-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg">Assets Under Management</h3>
          <p className="text-[#AAB4C3] text-xs mt-0.5">Portfolio growth — last 6 months</p>
        </div>
        <div className="text-right">
          <p className="text-brass font-bold text-2xl">
            {formatCurrency(data[data.length - 1]?.aum || 0)}
          </p>
          <p className="text-[#AAB4C3] text-xs">Current AUM</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B08D57" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#B08D57" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#242D38" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#AAB4C3"
            tick={{ fontSize: 12, fill: '#AAB4C3' }}
            axisLine={{ stroke: '#242D38' }}
            tickLine={false}
          />
          <YAxis
            stroke="#AAB4C3"
            tick={{ fontSize: 11, fill: '#AAB4C3' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0E1A2B',
              border: '1px solid #242D38',
              borderRadius: '12px',
              color: '#fff',
            }}
            labelStyle={{ color: '#AAB4C3', fontSize: 12 }}
            formatter={(value) => [formatCurrency(value), 'AUM']}
          />
          <Area
            type="monotone"
            dataKey="aum"
            stroke="#B08D57"
            strokeWidth={2.5}
            fill="url(#aumGradient)"
            dot={{ fill: '#B08D57', r: 4 }}
            activeDot={{ r: 6, fill: '#B08D57' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}