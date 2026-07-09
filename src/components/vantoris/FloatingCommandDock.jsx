import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, LifeBuoy, BookOpen, Send } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

const actions = [
  { label: 'Support', icon: LifeBuoy, color: 'text-emerald-400', bg: 'bg-emerald-500/15', glow: 'rgba(16,185,129,0.25)' },
  { label: 'Advisor', icon: Sparkles, color: 'text-brass', bg: 'bg-brass/15', glow: 'rgba(176,141,87,0.3)' },
  { label: 'Guide', icon: BookOpen, color: 'text-champagne', bg: 'bg-champagne/15', glow: 'rgba(212,185,150,0.25)' },
  { label: 'Zelle', icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/15', glow: 'rgba(59,130,246,0.25)', comingSoon: true },
];

export default function FloatingCommandDock() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();

  function handleAction(action) {
    setExpanded(false);
    if (action.comingSoon) return;
    if (action.label === 'Support') {
      window.open(
        whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    if (action.label === 'Advisor') { navigate('/advisor'); return; }
    if (action.label === 'Guide') { navigate('/advisor/home'); return; }
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2.5 safe-bottom">
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              style={{ bottom: '0px' }}
            />
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.5, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 24 }}
                  transition={{ delay: idx * 0.04, type: 'spring', stiffness: 400, damping: 22 }}
                  onClick={() => handleAction(action)}
                  className="relative flex items-center gap-3 group z-50"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 + 0.08 }}
                    className="vantoris-glass-dock px-3.5 py-2 rounded-xl"
                  >
                    <span className="text-white text-xs font-semibold whitespace-nowrap">{action.label}</span>
                    {action.comingSoon && (
                      <span className="ml-1.5 text-[9px] text-gray uppercase tracking-wider">Soon</span>
                    )}
                  </motion.div>
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.08 }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center vantoris-glass-dock ${action.bg} ${action.color}`}
                    style={{ boxShadow: `0 4px 16px ${action.glow}` }}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </motion.span>
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => setExpanded(!expanded)}
        className="relative w-14 h-14 rounded-2xl vantoris-glass-dock flex items-center justify-center z-50"
        style={{ boxShadow: expanded ? '0 8px 32px rgba(176,141,87,0.15)' : '0 8px 32px rgba(176,141,87,0.35)' }}
        aria-label="Command dock"
      >
        {!expanded && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: '0 0 0 2px rgba(176,141,87,0.2)' }}
          />
        )}
        <motion.div
          animate={{ rotate: expanded ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="text-brass"
        >
          {expanded ? <X size={22} strokeWidth={2.5} /> : <Sparkles size={22} strokeWidth={2.5} />}
        </motion.div>
      </motion.button>
    </div>
  );
}