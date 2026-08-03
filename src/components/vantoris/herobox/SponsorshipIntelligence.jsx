import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, RefreshCw, DollarSign, Activity, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const SPONSOR_STATS = [
  { icon: UserPlus, label: 'New Sponsors', key: 'new_sponsors', color: 'text-champagne', bg: 'bg-champagne/12' },
  { icon: RefreshCw, label: 'Returning Sponsors', key: 'returning', color: 'text-mint', bg: 'bg-mint/12' },
  { icon: DollarSign, label: 'Avg Contribution', key: 'avg_contribution', color: 'text-brass', bg: 'bg-brass/12' },
  { icon: Target, label: 'Retention Rate', key: 'retention', color: 'text-navy', bg: 'bg-navy/8', suffix: '%' },
];

const MISSION_DISTRIBUTION = [
  { mission: 'Care Pkg', value: 45 },
  { mission: 'Internet', value: 30 },
  { mission: 'Financial', value: 55 },
  { mission: 'Comms', value: 20 },
  { mission: 'Supplies', value: 38 },
];

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vantoris-glass-dropdown p-3 text-xs">
      <p className="text-foreground font-semibold mb-1">{label}</p>
      <span className="text-gray">{payload[0].value}</span>
    </div>
  );
}

export default function SponsorshipIntelligence({ stats, monthlyActivity }) {
  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground font-bold text-base">Sponsorship Intelligence</h3>
          <p className="text-gray text-xs">Sponsor engagement & mission distribution</p>
        </div>
        <Activity size={16} className="text-gray" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {SPONSOR_STATS.map((stat, idx) => {
          const Icon = stat.icon;
          const value = stats?.[stat.key] || 0;
          const display = stat.suffix === '%' ? `${value}%` : typeof value === 'number' && value > 999 ? `${(value / 1000).toFixed(1)}k` : value;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06 }}
              className="vantoris-glass-flat p-3"
            >
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <Icon size={13} className={stat.color} />
              </div>
              <p className="text-foreground font-bold text-lg leading-none">{display}</p>
              <p className="text-gray text-[9px] uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Monthly Activity Bar Chart */}
        <div>
          <h4 className="text-foreground text-xs font-semibold mb-3">Monthly Sponsor Activity</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyActivity || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(7,28,56,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipCard />} />
              <Bar dataKey="value" name="Sponsors" fill="#071C38" radius={[4, 4, 0, 0]} animationDuration={600} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mission Distribution Radar */}
        <div>
          <h4 className="text-foreground text-xs font-semibold mb-3">Mission Distribution</h4>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={MISSION_DISTRIBUTION} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <PolarGrid stroke="rgba(7,28,56,0.08)" />
              <PolarAngleAxis dataKey="mission" tick={{ fontSize: 9, fill: '#64748B' }} />
              <PolarRadiusAxis tick={{ fontSize: 8, fill: '#94A3B8' }} axisLine={false} />
              <Radar name="Distribution" dataKey="value" stroke="#1F5EFF" fill="#1F5EFF" fillOpacity={0.15} strokeWidth={2} animationDuration={600} />
              <Tooltip content={<TooltipCard />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}