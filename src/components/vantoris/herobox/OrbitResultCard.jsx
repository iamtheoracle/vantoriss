import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Eye, FileText, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const STATUS_STYLES = {
  pending: 'bg-brass/10 text-brass',
  under_review: 'bg-brass/10 text-brass',
  approved: 'bg-mint/10 text-mint',
  in_progress: 'bg-champagne/10 text-champagne',
  delivered: 'bg-mint/10 text-mint',
  completed: 'bg-mint/10 text-mint',
  active: 'bg-mint/10 text-mint',
  inactive: 'bg-slate-100 text-gray',
};

const ACTION_LABELS = {
  request: 'View',
  profile: 'Learn More',
  activity: 'Track',
  document: 'Open',
};

const ACTION_ICONS = {
  request: Eye,
  profile: ChevronRight,
  activity: ChevronRight,
  document: FileText,
};

export default function OrbitResultCard({ item, group, onAction }) {
  const title = item.title || item.mission_statement || item.full_name || 'Untitled';
  const description = item.description || item.mission_notes || item.mission_statement || '';
  const status = item.status;
  const amount = item.amount;
  const ActionIcon = ACTION_ICONS[group.type] || ChevronRight;
  const Icon = group.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onAction}
      className="w-full vantoris-glass-premium p-3.5 flex items-start gap-3 hover:shadow-float transition-all text-left"
    >
      <div className={`w-10 h-10 rounded-xl ${group.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={17} className={group.color} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium truncate">{title}</p>
        {description && (
          <p className="text-gray text-[11px] mt-0.5 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {status && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_STYLES[status] || 'bg-slate-100 text-gray'}`}>
              {status.replace(/_/g, ' ')}
            </span>
          )}
          {amount > 0 && (
            <span className="text-brass text-[11px] font-semibold">{formatCurrency(amount)}</span>
          )}
          {item.recipient_name && (
            <span className="text-gray/50 text-[10px] truncate">· {item.recipient_name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-navy text-[10px] font-semibold flex-shrink-0 mt-1">
        {ACTION_LABELS[group.type] || 'View'}
        <ActionIcon size={12} />
      </div>
    </motion.button>
  );
}