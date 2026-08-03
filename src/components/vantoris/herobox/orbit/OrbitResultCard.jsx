import React from 'react';
import { motion } from 'framer-motion';
import { Package, Heart, FileText, Users, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const TYPE_CONFIG = {
  request: { icon: Package, bg: 'bg-brass/10', color: 'text-brass', actionBg: 'bg-navy text-white' },
  activity: { icon: Heart, bg: 'bg-mint/10', color: 'text-mint', actionBg: 'bg-slate-100 text-navy' },
  document: { icon: FileText, bg: 'bg-navy/8', color: 'text-navy', actionBg: 'bg-slate-100 text-navy' },
  profile: { icon: Users, bg: 'bg-champagne/12', color: 'text-champagne', actionBg: 'bg-slate-100 text-navy' },
};

const STATUS_COLORS = {
  approved: 'bg-mint/10 text-mint', active: 'bg-mint/10 text-mint', completed: 'bg-mint/10 text-mint',
  delivered: 'bg-mint/10 text-mint', paid: 'bg-mint/10 text-mint',
  pending: 'bg-brass/10 text-brass', under_review: 'bg-brass/10 text-brass', in_progress: 'bg-champagne/12 text-champagne',
  rejected: 'bg-crimson/10 text-crimson', not_started: 'bg-slate-100 text-gray',
};

export default function OrbitResultCard({ result, onAction, index = 0 }) {
  const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.request;
  const Icon = config.icon;
  const statusClass = STATUS_COLORS[result.status] || 'bg-slate-100 text-gray';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="vantoris-glass-premium p-3.5 flex items-center gap-3"
    >
      <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={19} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-foreground text-sm font-semibold truncate">{result.title}</p>
          {result.status && result.status !== 'completed' && (
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusClass} flex-shrink-0`}>
              {result.status.replace('_', ' ')}
            </span>
          )}
        </div>
        <p className="text-gray text-[11px] truncate">{result.description || result.category}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {result.amount != null && result.amount > 0 && (
            <span className="text-brass text-[11px] font-semibold">{formatCurrency(result.amount)}</span>
          )}
          <span className="text-gray/40 text-[10px]">{result.category}</span>
        </div>
      </div>
      <button
        onClick={() => onAction(result)}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 flex items-center gap-0.5 ${config.actionBg} hover:opacity-90 transition-opacity`}
      >
        {result.action}
        <ChevronRight size={11} />
      </button>
    </motion.div>
  );
}