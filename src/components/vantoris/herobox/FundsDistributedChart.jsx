import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vantoris-glass-dropdown p-3 text-xs">
      <p className="text-foreground font-semibold mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color || entry.fill }} />
          <span className="text-gray">{entry.name}:</span>
          <span className="text-foreground font-medium">${(entry.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function FundsDistributedChart({ data, period, onPeriodChange, breakdown, onBreakdownChange }) {
  const breakdowns = ['Mission', 'Community', 'Campaign', 'Package', 'Region'];
  const colors = ['#071C38', '#1F5EFF', '#16A34A', '#C9A227', '#DC2626'];
  const keys = breakdowns.slice(0, Math.max(1, breakdown ? breakdowns.indexOf(breakdown) + 1 : 3));

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-foreground font-bold text-base">Funds Distributed</h3>
          <p className="text-gray text-xs">Distribution breakdown by {breakdown?.toLowerCase() || 'category'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {Object.entries(PERIOD_LABELS).map(([k, label]) => (
              <button
                key={k}
                onClick={() => onPeriodChange?.(k)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  period === k ? 'bg-white text-navy shadow-sm' : 'text-gray hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={breakdown || keys[0]}
            onChange={e => onBreakdownChange?.(e.target.value)}
            className="bg-slate-100 border-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-navy/20"
          >
            {breakdowns.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {keys.map((key, i) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[i]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,28,56,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          {keys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i]}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              animationDuration={600}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}