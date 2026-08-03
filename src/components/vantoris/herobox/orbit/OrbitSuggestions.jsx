import React from 'react';
import { motion } from 'framer-motion';
import { Package, Heart, Shield, AlertTriangle, Wifi, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const SUGGESTIONS = [
  { label: 'Military Care Packages', query: 'military care package snacks', icon: Package, color: 'bg-navy/8 text-navy' },
  { label: "Children's Programs", query: 'children support programs', icon: Heart, color: 'bg-brass/12 text-brass' },
  { label: 'Medical Support', query: 'medical supplies health', icon: Shield, color: 'bg-mint/10 text-mint' },
  { label: 'Emergency Relief', query: 'disaster relief emergency urgent', icon: AlertTriangle, color: 'bg-crimson/10 text-crimson' },
  { label: 'Internet Support', query: 'internet connectivity wifi', icon: Wifi, color: 'bg-champagne/12 text-champagne' },
  { label: 'Volunteer', query: 'volunteer community service', icon: Clock, color: 'bg-navy/8 text-navy' },
];

export default function OrbitSuggestions({ recentItems, onSelectSuggestion, onSelectItem }) {
  return (
    <div className="px-4 py-4">
      {/* Orbit intro */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center mx-auto mb-3 shadow-premium">
          <Sparkles size={24} className="text-brass" />
        </div>
        <h2 className="text-foreground font-bold text-lg">Orbit Discovery</h2>
        <p className="text-gray text-xs mt-1 max-w-xs mx-auto">Find the right way to create meaningful impact. Just ask naturally.</p>
      </div>

      {/* Quick suggestions */}
      <div className="mb-6">
        <p className="text-gray text-[10px] font-bold uppercase tracking-wider mb-2.5 px-1">Try These</p>
        <div className="grid grid-cols-2 gap-2.5">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectSuggestion(s.query)}
                className="vantoris-glass p-3.5 text-left hover:shadow-float transition-all"
              >
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
                  <Icon size={16} />
                </div>
                <p className="text-foreground text-xs font-semibold">{s.label}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recently added */}
      {recentItems && recentItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <TrendingUp size={12} className="text-brass" />
            <p className="text-gray text-[10px] font-bold uppercase tracking-wider">Recently Added</p>
          </div>
          <div className="space-y-2">
            {recentItems.slice(0, 3).map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectItem(item)}
                className="w-full vantoris-glass-flat p-3 flex items-center gap-3 text-left hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-navy/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-xs font-medium truncate">{item.title}</p>
                  <p className="text-gray text-[10px] capitalize">{item.request_type?.replace('_', ' ') || 'Item'}</p>
                </div>
                {item.amount > 0 && (
                  <span className="text-brass text-[11px] font-semibold flex-shrink-0">{formatCurrency(item.amount)}</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}