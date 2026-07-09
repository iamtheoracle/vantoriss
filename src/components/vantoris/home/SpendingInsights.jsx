import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function SpendingInsights({ transactions }) {
  const deposits = transactions
    .filter(t => t.type === 'deposit' || t.type === 'opening_balance')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const withdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const total = deposits + withdrawals;
  const depositPct = total > 0 ? (deposits / total) * 100 : 0;
  const withdrawalPct = total > 0 ? (withdrawals / total) * 100 : 0;
  const netFlow = deposits - withdrawals;

  return (
    <div className="vantoris-glass-flat p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-brass" />
        <h3 className="text-white font-semibold text-sm">Cash Flow Insights</h3>
      </div>

      {/* Flow bar */}
      <div className="mb-4">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-white/[0.04]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${depositPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-mint/70"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${withdrawalPct}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="bg-crimson/60"
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mint/12 flex items-center justify-center">
            <ArrowDownLeft size={14} className="text-mint" />
          </div>
          <div>
            <p className="text-[#AAB4C3]/70 text-[10px] uppercase tracking-wider">Inflows</p>
            <p className="text-mint font-semibold text-sm">{formatCurrency(deposits)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crimson/10 flex items-center justify-center">
            <ArrowUpRight size={14} className="text-red-400" />
          </div>
          <div>
            <p className="text-[#AAB4C3]/70 text-[10px] uppercase tracking-wider">Outflows</p>
            <p className="text-red-400 font-semibold text-sm">{formatCurrency(withdrawals)}</p>
          </div>
        </div>
      </div>

      {/* Net flow */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <span className="text-[#AAB4C3] text-xs">Net Position</span>
        <div className="flex items-center gap-1.5">
          {netFlow >= 0 ? <TrendingUp size={14} className="text-mint" /> : <TrendingDown size={14} className="text-red-400" />}
          <span className={`font-bold text-sm ${netFlow >= 0 ? 'text-mint' : 'text-red-400'}`}>{formatCurrency(netFlow)}</span>
        </div>
      </div>
    </div>
  );
}