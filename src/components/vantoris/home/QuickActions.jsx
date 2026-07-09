import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QrCode, Send, MessageCircle, ArrowLeftRight } from 'lucide-react';

const actions = [
  { label: 'Scan QR', icon: QrCode, route: '/move-money?tab=qr' },
  { label: 'Zelle®', icon: Send, route: '/move-money?tab=zelle' },
  { label: 'Chat Support', icon: MessageCircle, route: '/advisor' },
  { label: 'Transfer', icon: ArrowLeftRight, route: '/move-money' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.route)}
              className="vantoris-balance-hero p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all min-h-[88px] justify-center"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Icon size={20} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-white text-xs font-semibold tracking-wide">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}