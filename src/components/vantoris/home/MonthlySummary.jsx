import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CATEGORY_META = {
  deposit: { label: 'Deposits', color: '#10b981' },
  withdrawal: { label: 'Withdrawals', color: '#ef4444' },
  opening_balance: { label: 'Opening Balance', color: '#1e56a0' },
  adjustment: { label: 'Adjustments', color: '#64748b' },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg">
      <p className="text-foreground text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray">{entry.name}:</span>
          <span className="text-foreground font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function MonthlySummary({ transactions }) {
  const [expandedMonth, setExpandedMonth] = useState(null);

  const monthlyData = useMemo(() => {
    const byMonth = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_date || t.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = format(date, 'MMMM yyyy');

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          key: monthKey,
          label: monthLabel,
          categories: {},
          totalIn: 0,
          totalOut: 0,
          net: 0,
          count: 0,
        };
      }

      const month = byMonth[monthKey];
      const type = t.type || 'adjustment';

      if (!month.categories[type]) {
        month.categories[type] = { count: 0, total: 0 };
      }
      month.categories[type].count++;
      month.categories[type].total += Math.abs(t.amount || 0);

      if (t.amount >= 0) {
        month.totalIn += t.amount || 0;
      } else {
        month.totalOut += Math.abs(t.amount || 0);
      }
      month.net += t.amount || 0;
      month.count++;
    });

    return Object.values(byMonth).sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions]);

  const chartData = useMemo(() => {
    return monthlyData.slice(0, 6).reverse().map(m => ({
      month: format(new Date(m.key + '-01'), 'MMM'),
      Deposits: m.totalIn,
      Withdrawals: m.totalOut,
    }));
  }, [monthlyData]);

  if (transactions.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold text-sm">Monthly Summary</h3>
        <span className="text-gray text-[11px]">Last {chartData.length} month{chartData.length !== 1 ? 's' : ''}</span>
      </div>

      {chartData.length > 0 && (
        <div className="mb-5 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="Deposits" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="Withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-mint" />
          <span className="text-gray text-[11px]">Money In</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-crimson" />
          <span className="text-gray text-[11px]">Money Out</span>
        </div>
      </div>

      <div className="space-y-2">
        {monthlyData.map(month => (
          <div key={month.key} className="border border-slate-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedMonth(expandedMonth === month.key ? null : month.key)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${month.net >= 0 ? 'bg-mint/10' : 'bg-crimson/10'}`}>
                  {month.net >= 0
                    ? <TrendingDown size={14} className="text-mint" />
                    : <TrendingUp size={14} className="text-crimson" />
                  }
                </div>
                <div className="text-left">
                  <p className="text-foreground text-sm font-medium">{month.label}</p>
                  <p className="text-gray text-[11px]">{month.count} transaction{month.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${month.net >= 0 ? 'text-mint' : 'text-crimson'}`}>
                    {month.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(month.net))}
                  </p>
                  <p className="text-gray text-[10px]">Net flow</p>
                </div>
                {expandedMonth === month.key
                  ? <ChevronUp size={16} className="text-gray" />
                  : <ChevronDown size={16} className="text-gray" />}
              </div>
            </button>

            {expandedMonth === month.key && (
              <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-mint/5 rounded-lg p-2.5">
                    <p className="text-gray text-[10px] uppercase tracking-wider mb-0.5">Total In</p>
                    <p className="text-mint text-sm font-semibold">{formatCurrency(month.totalIn)}</p>
                  </div>
                  <div className="bg-crimson/5 rounded-lg p-2.5">
                    <p className="text-gray text-[10px] uppercase tracking-wider mb-0.5">Total Out</p>
                    <p className="text-crimson text-sm font-semibold">{formatCurrency(month.totalOut)}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-2">
                  {Object.entries(month.categories).map(([type, data]) => {
                    const meta = CATEGORY_META[type] || { label: type, color: '#64748b' };
                    return (
                      <div key={type} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                          <span className="text-foreground text-xs">{meta.label}</span>
                          <span className="text-gray text-[10px]">({data.count})</span>
                        </div>
                        <span className="text-foreground text-xs font-medium">{formatCurrency(data.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}