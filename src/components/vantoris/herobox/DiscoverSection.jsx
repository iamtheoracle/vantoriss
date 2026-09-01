import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function DiscoverSection({ title, icon: Icon, items, renderItem, onViewAll, viewAllTo }) {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-navy/8 flex items-center justify-center">
              <Icon size={14} className="text-navy" />
            </div>
          )}
          <h3 className="text-foreground font-semibold text-sm">{title}</h3>
          <span className="text-[10px] text-gray/60 font-medium">{items.length}</span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-0.5 text-[11px] text-navy font-medium hover:gap-1 transition-all"
          >
            Browse all <ChevronRight size={12} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => renderItem(item, i))}
      </div>
    </motion.div>
  );
}