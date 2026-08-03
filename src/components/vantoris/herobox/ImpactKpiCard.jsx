import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ImpactKpiCard({ icon: Icon, label, value, change, trend, color, bg, delay = 0, onClick }) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend === 'up' ? 'text-mint' : trend === 'down' ? 'text-crimson' : 'text-gray';
  const changeValue = change !== undefined && change !== null ? Math.abs(change) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className={`vantoris-glass-premium p-4 relative overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-float transition-all' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg || 'bg-navy/8'} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={color || 'text-navy'} />
        </div>
        {change !== undefined && change !== null && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon size={13} />
            <span className="text-xs font-semibold">{changeValue}%</span>
          </div>
        )}
      </div>
      <p className="text-foreground font-bold text-2xl tracking-tight leading-none mb-1">{value}</p>
      <p className="text-gray text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      {change !== undefined && change !== null && (
        <p className={`text-[10px] mt-1.5 ${trendColor} font-medium`}>
          {trend === 'up' ? '↑ vs last month' : trend === 'down' ? '↓ vs last month' : '— no change'}
        </p>
      )}
    </motion.div>
  );
}