import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  X,
  Send,
  ArrowLeftRight,
  Download,
  Banknote,
  FileText,
  ScanLine,
  Sparkles,
} from 'lucide-react';

const actions = [
  { label: 'Send Money', icon: Send, path: '/accounts', color: 'bg-blue-500/20 text-blue-400' },
  { label: 'Transfer', icon: ArrowLeftRight, path: '/accounts', color: 'bg-brass/20 text-brass' },
  { label: 'Deposit', icon: Download, path: '/services', color: 'bg-emerald-500/20 text-emerald-400' },
  { label: 'Statements', icon: FileText, path: '/documents', color: 'bg-purple-500/20 text-purple-400' },
  { label: 'Pay Bills', icon: Banknote, path: '/services', color: 'bg-orange-500/20 text-orange-400' },
  { label: 'Scan QR', icon: ScanLine, path: null, color: 'bg-cyan-500/20 text-cyan-400' },
  { label: 'AI Assistant', icon: Sparkles, path: '/advisor', color: 'bg-pink-500/20 text-pink-400' },
];

export default function FloatingActionButton() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  function handleAction(action) {
    setExpanded(false);
    if (action.path) {
      navigate(action.path);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <>
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: 20 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleAction(action)}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-[#0E1A2B]/95 border border-[#242D38] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap">
                    {action.label}
                  </span>
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${action.color} border border-white/5`}>
                    <Icon size={18} />
                  </span>
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full bg-brass text-[#0E1A2B] shadow-2xl flex items-center justify-center font-bold"
        style={{ boxShadow: '0 8px 32px rgba(176, 141, 87, 0.4)' }}
      >
        <motion.div
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {expanded ? <X size={24} /> : <Plus size={24} />}
        </motion.div>
      </motion.button>
    </div>
  );
}