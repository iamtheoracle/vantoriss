import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Download } from 'lucide-react';

const DATE_RANGES = ['7D', '30D', '90D', '6M', '1Y', 'All'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vantoris-glass-dropdown p-3 text-xs">
      <p className="text-foreground font-semibold mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-gray">{entry.name}:</span>
          <span className="text-foreground font-medium">{(entry.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function CommunityGrowthChart({ data }) {
  const [range, setRange] = useState('90D');
  const [showAverage, setShowAverage] = useState(true);

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-foreground font-bold text-base">Community Growth</h3>
          <p className="text-gray text-xs">Cumulative support, growth & sponsor contributions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {DATE_RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  range === r ? 'bg-white text-navy shadow-sm' : 'text-gray hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAverage(!showAverage)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border ${
              showAverage ? 'bg-navy/8 text-navy border-navy/15' : 'bg-white text-gray border-slate-200'
            }`}
          >
            Rolling Avg
          </button>
          <button className="p-1.5 rounded-lg bg-slate-100 text-gray hover:text-foreground transition-all">
            <Download size={13} />
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#071C38" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#071C38" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSponsor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F5EFF" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#1F5EFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,28,56,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          <Area type="monotone" dataKey="cumulative" name="Cumulative Support" stroke="#071C38" strokeWidth={2.5} fill="url(#gradGrowth)" animationDuration={600} />
          <Area type="monotone" dataKey="sponsors" name="Sponsor Growth" stroke="#1F5EFF" strokeWidth={2} fill="url(#gradSponsor)" animationDuration={600} />
          {showAverage && (
            <Line type="monotone" dataKey="average" name="Rolling Average" stroke="#C9A227" strokeWidth={1.5} strokeDasharray="5 5" dot={false} animationDuration={600} />
          )}
          <Line type="monotone" dataKey="weekly" name="Weekly Growth" stroke="#16A34A" strokeWidth={2} dot={false} animationDuration={600} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}