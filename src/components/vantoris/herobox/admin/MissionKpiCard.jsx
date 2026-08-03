import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function MissionKpiCard({ icon: Icon, value, label, color, to, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link to={to} className="block vantoris-glass-premium p-4 hover:shadow-float transition-all group">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <p className="text-foreground font-bold text-2xl tracking-tight">{value}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-gray text-[11px] font-medium">{label}</p>
          <ChevronRight size={12} className="text-gray/30 group-hover:text-navy transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}