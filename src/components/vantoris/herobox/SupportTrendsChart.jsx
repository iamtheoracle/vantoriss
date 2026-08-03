import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, Area, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const CHART_TYPES = [
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
  { id: 'bar', label: 'Bar' },
  { id: 'stacked', label: 'Stacked' },
];

const SERIES = [
  { key: 'requests', label: 'Support Requests', color: '#1F5EFF' },
  { key: 'completed', label: 'Completed Support', color: '#16A34A' },
  { key: 'pending', label: 'Pending Support', color: '#C9A227' },
  { key: 'volunteer', label: 'Volunteer Activity', color: '#64748B' },
  { key: 'sponsor', label: 'Sponsor Activity', color: '#071C38' },
  { key: 'packages', label: 'Package Deliveries', color: '#DC2626' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vantoris-glass-dropdown p-3 text-xs">
      <p className="text-foreground font-semibold mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-gray">{entry.name}:</span>
          <span className="text-foreground font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SupportTrendsChart({ data }) {
  const [chartType, setChartType] = useState('stacked');

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-foreground font-bold text-base">Community Support Trends</h3>
          <p className="text-gray text-xs">Multi-dimensional activity overview</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {CHART_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setChartType(t.id)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                chartType === t.id ? 'bg-white text-navy shadow-sm' : 'text-gray hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,28,56,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {SERIES.map(s => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} animationDuration={600} />
            ))}
          </LineChart>
        ) : chartType === 'area' ? (
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,28,56,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {SERIES.map(s => (
              <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.08} strokeWidth={2} animationDuration={600} />
            ))}
          </ComposedChart>
        ) : (
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} stackOffset={chartType === 'stacked' ? 'expand' : 'none'}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,28,56,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {SERIES.map(s => (
              <Bar key={s.key} dataKey={s.key} stackId={chartType === 'stacked' ? 'a' : undefined} fill={s.color} radius={[3, 3, 0, 0]} animationDuration={600} />
            ))}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}