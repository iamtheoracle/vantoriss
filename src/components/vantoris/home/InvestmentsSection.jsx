import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { Briefcase, ChevronRight, Bitcoin, LineChart, TrendingUp, ArrowRight } from 'lucide-react';

const TYPE_META = {
  Forex: { color: 'text-brass', bg: 'bg-brass/12', icon: TrendingUp, label: 'Forex' },
  Stocks: { color: 'text-mint', bg: 'bg-mint/12', icon: LineChart, label: 'Stocks' },
  Crypto: { color: 'text-champagne', bg: 'bg-champagne/12', icon: Bitcoin, label: 'Crypto' },
  Mixed: { color: 'text-purple-500', bg: 'bg-purple-500/12', icon: Briefcase, label: 'Diversified' },
};

export default function InvestmentsSection({ tradingAccounts, hideBalance }) {
  const navigate = useNavigate();

  // No trading accounts — show invitation
  if (!tradingAccounts || tradingAccounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-balance-hero rounded-3xl p-6 mb-5 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brass/[0.05] blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center border border-white/10">
              <Briefcase size={18} className="text-brass" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Investments</h3>
              <p className="text-white/50 text-[11px]">Grow your wealth</p>
            </div>
          </div>
          <p className="text-white/70 text-xs mb-4 leading-relaxed">
            Start investing in stocks, crypto, and forex markets. Your capital is ready to work for you.
          </p>
          <button
            onClick={() => navigate('/investments')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brass hover:bg-brass/90 rounded-xl text-white text-xs font-semibold transition-all w-full justify-center"
          >
            Start Investing
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  const totalValue = tradingAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalEquity = tradingAccounts.reduce((s, a) => s + (a.equity || 0), 0);

  const byType = tradingAccounts.reduce((acc, acct) => {
    const type = acct.account_type || 'Mixed';
    if (!acc[type]) acc[type] = { count: 0, value: 0 };
    acc[type].count++;
    acc[type].value += acct.balance || 0;
    return acc;
  }, {});

  const types = Object.entries(byType);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="text-brass" />
          <h3 className="text-foreground font-semibold text-sm">Investments</h3>
        </div>
        <button onClick={() => navigate('/investments')} className="text-brass text-xs font-medium flex items-center gap-0.5">
          View All <ChevronRight size={12} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-glass-premium p-4 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brass/[0.05] blur-2xl" />

        <div className="relative z-10">
          <div className="mb-4">
            <p className="text-gray/70 text-[10px] uppercase tracking-wider font-medium mb-0.5">Portfolio Value</p>
            <p className="text-foreground font-bold text-2xl">
              {hideBalance ? '••••••' : formatCurrency(totalValue)}
            </p>
            <p className="text-gray text-xs mt-0.5">
              {tradingAccounts.length} {tradingAccounts.length === 1 ? 'Account' : 'Accounts'} · Equity {hideBalance ? '•••' : formatCurrency(totalEquity)}
            </p>
          </div>

          {/* Allocation bar */}
          <div className="mb-4">
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
              {types.map(([type, data], idx) => {
                const pct = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
                const barColors = {
                  Forex: 'bg-brass/70',
                  Stocks: 'bg-mint/70',
                  Crypto: 'bg-champagne/70',
                  Mixed: 'bg-purple-500/70',
                };
                return (
                  <motion.div
                    key={type}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                    className={barColors[type] || 'bg-gray/50'}
                  />
                );
              })}
            </div>
          </div>

          {/* Holdings breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {types.map(([type, data]) => {
              const meta = TYPE_META[type] || TYPE_META.Mixed;
              const Icon = meta.icon;
              return (
                <div key={type} className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center`}>
                    <Icon size={14} className={meta.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray/70 text-[10px] uppercase tracking-wider">{meta.label}</p>
                    <p className="text-foreground font-semibold text-sm">
                      {hideBalance ? '•••' : formatCurrency(data.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}