import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * PremiumStatCard — Institutional KPI card (light theme).
 * Backward-compatible API with VantorisKPICard.
 */
const ACCENTS = {
  navy:      { text: 'text-navy',      bg: 'bg-navy/8',       border: 'border-navy/15',       hex: '7,28,56' },
  gold:      { text: 'text-brass',     bg: 'bg-brass/10',     border: 'border-brass/20',      hex: '201,162,39' },
  brass:     { text: 'text-brass',     bg: 'bg-brass/10',     border: 'border-brass/20',      hex: '201,162,39' },
  blue:      { text: 'text-champagne', bg: 'bg-champagne/10', border: 'border-champagne/20', hex: '31,94,255' },
  champagne: { text: 'text-champagne', bg: 'bg-champagne/10', border: 'border-champagne/20', hex: '31,94,255' },
  mint:      { text: 'text-mint',      bg: 'bg-mint/10',      border: 'border-mint/20',       hex: '22,163,74' },
  crimson:   { text: 'text-crimson',   bg: 'bg-crimson/10',   border: 'border-crimson/20',   hex: '220,38,38' },
  warning:   { text: 'text-warning',   bg: 'bg-warning/10',   border: 'border-warning/20',   hex: '245,158,11' },
  emerald:   { text: 'text-mint',      bg: 'bg-mint/10',      border: 'border-mint/20',       hex: '22,163,74' },
};

export default function PremiumStatCard({ label, value, sublabel, icon: Icon, accent = 'navy', alert, alertIcon: AlertIcon, onClick, hero, className = '' }) {
  const a = ACCENTS[accent] || ACCENTS.navy;
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`vantoris-glass-premium p-5 text-left transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-float hover:border-navy/10' : ''
      } ${hero ? 'lg:col-span-2' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center`}>
          {Icon && <Icon size={20} className={a.text} strokeWidth={2} />}
        </div>
        {alert != null && alert !== '' && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.bg} ${a.text} border ${a.border}`}>
            {AlertIcon && <AlertIcon size={10} />}
            {typeof alert === 'number' ? alert : alert}
          </span>
        )}
      </div>
      <p className={`font-bold text-foreground tracking-tight ${hero ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'} leading-tight break-words`}>
        {value}
      </p>
      <p className="text-gray text-xs mt-1.5 font-medium">{label}</p>
      {sublabel && <p className="text-gray/60 text-[11px] mt-0.5">{sublabel}</p>}
    </Tag>
  );
}