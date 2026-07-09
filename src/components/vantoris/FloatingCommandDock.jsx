import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, LifeBuoy, ArrowLeftRight, Send } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

const actions = [
  { label: 'Support', icon: LifeBuoy },
  { label: 'Advisor', icon: Sparkles },
  { label: 'Transfer', icon: ArrowLeftRight },
  { label: 'Zelle', icon: Send },
];

export default function FloatingCommandDock() {
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();
  const [pressed, setPressed] = useState(null);

  function handleAction(action) {
    if (action.label === 'Support') {
      window.open(
        whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
        '_blank', 'noopener,noreferrer'
      );
      return;
    }
    if (action.label === 'Advisor') { navigate('/advisor'); return; }
    if (action.label === 'Transfer') { navigate('/move-money'); return; }
    if (action.label === 'Zelle') { navigate('/move-money?tab=zelle'); return; }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.3 }}
        className="vantoris-glass-dock flex items-center gap-1 px-2 py-2 rounded-2xl"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          const isPressed = pressed === action.label;
          return (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.9 }}
              onMouseDown={() => setPressed(action.label)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              onClick={() => handleAction(action)}
              className="flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl transition-colors"
              style={{ background: isPressed ? 'rgba(255,255,255,0.12)' : 'transparent' }}
            >
              <Icon size={18} strokeWidth={2} className="text-white" />
              <span className="text-white text-[10px] font-semibold">{action.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}