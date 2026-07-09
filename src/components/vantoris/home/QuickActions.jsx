import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Download, FileText, Banknote,
  CreditCard, Briefcase, Sparkles, Shield,
} from 'lucide-react';

const actions = [
  { label: 'Transfer', icon: ArrowLeftRight, path: '/accounts', color: 'text-blue-400', bg: 'bg-blue-500/12' },
  { label: 'Deposit', icon: Download, path: '/services', color: 'text-emerald-400', bg: 'bg-emerald-500/12' },
  { label: 'Statements', icon: FileText, path: '/documents', color: 'text-purple-400', bg: 'bg-purple-500/12' },
  { label: 'Pay Bills', icon: Banknote, path: '/services', color: 'text-orange-400', bg: 'bg-orange-500/12' },
  { label: 'Cards', icon: CreditCard, path: '/services', color: 'text-cyan-400', bg: 'bg-cyan-500/12' },
  { label: 'Services', icon: Briefcase, path: '/services', color: 'text-brass', bg: 'bg-brass/12' },
  { label: 'Advisor', icon: Sparkles, path: '/advisor', color: 'text-pink-400', bg: 'bg-pink-500/12' },
  { label: 'Security', icon: Shield, path: '/profile', color: 'text-red-400', bg: 'bg-red-500/12' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="mb-5">
      <h3 className="text-white font-semibold text-sm mb-3 px-1">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(action.path)}
              className="vantoris-glass-flat p-2.5 flex flex-col items-center gap-1.5 hover:border-brass/20 transition-all"
            >
              <div className={`w-9 h-9 rounded-xl ${action.bg} flex items-center justify-center`}>
                <Icon size={16} className={action.color} />
              </div>
              <span className="text-[#AAB4C3] text-[10px] font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}