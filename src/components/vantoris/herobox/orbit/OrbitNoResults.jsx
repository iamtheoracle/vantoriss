import React from 'react';
import { motion } from 'framer-motion';
import { SearchX, Package, Heart, Wifi, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const RELATED_CATEGORIES = [
  { label: 'Care Packages', query: 'care package', icon: Package, color: 'bg-brass/10 text-brass' },
  { label: 'Internet Support', query: 'internet support', icon: Wifi, color: 'bg-champagne/12 text-champagne' },
  { label: 'Medical Supplies', query: 'medical supplies', icon: Shield, color: 'bg-mint/10 text-mint' },
  { label: 'Sponsor a Hero', query: 'sponsor hero support', icon: Heart, color: 'bg-navy/8 text-navy' },
];

export default function OrbitNoResults({ query, popularItems, onSelectSuggestion, onSelectItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-8"
    >
      {/* No results message */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <SearchX size={24} className="text-gray/50" />
        </div>
        <h3 className="text-foreground font-semibold text-sm">No exact matches</h3>
        <p className="text-gray text-xs mt-1 max-w-xs mx-auto">
          We couldn't find results for "<span className="text-foreground font-medium">{query}</span>", but here are some ways to help.
        </p>
      </div>

      {/* Related categories */}
      <div className="mb-6">
        <p className="text-gray text-[10px] font-bold uppercase tracking-wider mb-2.5 px-1">Explore Categories</p>
        <div className="grid grid-cols-2 gap-2.5">
          {RELATED_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.label}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectSuggestion(cat.query)}
                className="vantoris-glass p-3 flex items-center gap-2.5 hover:shadow-float transition-all"
              >
                <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} />
                </div>
                <span className="text-foreground text-xs font-semibold">{cat.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Popular items */}
      {popularItems && popularItems.length > 0 && (
        <div>
          <p className="text-gray text-[10px] font-bold uppercase tracking-wider mb-2.5 px-1">Popular Items</p>
          <div className="space-y-2">
            {popularItems.slice(0, 3).map((item, i) => (
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
    </motion.div>
  );
}