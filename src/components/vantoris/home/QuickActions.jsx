import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Download, CreditCard, Send,
} from 'lucide-react';

const actions = [
  { label: 'Transfer', icon: ArrowLeftRight, path: '/accounts' },
  { label: 'Deposit', icon: Download, path: '/services' },
  { label: 'Pay', icon: CreditCard, path: '/services' },
  { label: 'Zelle', icon: Send, path: '/services', comingSoon: true },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="mb-5">
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
              onClick={() => !action.comingSoon && navigate(action.path)}
              className="vantoris-glass-flat p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center">
                <Icon size={16} className="text-brass" />
              </div>
              <span className="text-gray text-[10px] font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}