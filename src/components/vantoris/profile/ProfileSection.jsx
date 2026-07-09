import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function ProfileSection({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="mb-4"
    >
      {title && (
        <div className="flex items-center gap-2 mb-2.5 px-1">
          {Icon && <Icon size={14} className="text-brass" />}
          <h3 className="text-white font-semibold text-xs uppercase tracking-[0.12em]">{title}</h3>
        </div>
      )}
      <div className="vantoris-glass-flat rounded-2xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}

export function ProfileRow({ icon: Icon, iconColor = 'text-[#AAB4C3]', iconBg = 'bg-white/[0.04]', label, value, onClick, rightElement, danger }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 text-left transition-all ${onClick ? 'hover:bg-white/[0.03]' : ''} ${danger ? 'hover:bg-crimson/5' : ''}`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={16} className={danger ? 'text-red-400' : iconColor} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[#AAB4C3] text-[10px] uppercase tracking-wider font-medium">{label}</p>
        {value && <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'} truncate`}>{value}</p>}
      </div>
      {rightElement}
      {onClick && <ChevronRight size={16} className={danger ? 'text-red-400/50' : 'text-[#AAB4C3]/50'} />}
    </Tag>
  );
}

export function ProfileDivider() {
  return <div className="vantoris-divider mx-3.5" />;
}