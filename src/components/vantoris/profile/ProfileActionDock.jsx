import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight, Download, Upload, FileText, MessageCircle, LifeBuoy, Heart, Sparkles, ChevronDown,
} from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import SectionTitle from './SectionTitle';

export default function ProfileActionDock({ hasAccounts, hasHeroBox, isMember }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();

  const allActions = [];
  if (hasAccounts) {
    allActions.push({ id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, onClick: () => navigate('/move-money'), color: 'bg-navy text-white' });
    allActions.push({ id: 'deposit', label: 'Deposit', icon: Download, onClick: () => navigate('/move-money?tab=deposit'), color: 'bg-mint text-white' });
    allActions.push({ id: 'withdraw', label: 'Withdraw', icon: Upload, onClick: () => navigate('/move-money?tab=withdraw'), color: 'bg-crimson text-white' });
  }
  if (hasHeroBox) {
    allActions.push({ id: 'sponsor', label: 'Sponsor', icon: Heart, onClick: () => navigate('/herobox'), color: 'bg-brass/15 text-brass' });
  }
  if (isMember) {
    allActions.push({ id: 'advisor', label: 'Advisor', icon: Sparkles, onClick: () => navigate('/advisor'), color: 'bg-navy/8 text-navy' });
  }
  allActions.push({ id: 'statements', label: 'Statements', icon: FileText, onClick: () => navigate('/documents'), color: 'bg-navy/8 text-navy' });
  allActions.push({ id: 'messages', label: 'Messages', icon: MessageCircle, onClick: () => navigate('/messages'), color: 'bg-navy/8 text-navy' });
  allActions.push({ id: 'support', label: 'Help', icon: LifeBuoy, onClick: () => window.open(whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'), '_blank', 'noopener,noreferrer'), color: 'bg-mint/10 text-mint' });

  if (allActions.length === 0) return null;

  const visibleActions = expanded ? allActions : allActions.slice(0, 4);
  const hasMore = allActions.length > 4;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="vantoris-glass-premium p-3">
        <SectionTitle
          title="Quick Actions"
          right={hasMore ? (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-navy text-[10px] font-semibold hover:underline">
              {expanded ? 'Show Less' : 'Show More'}
              <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          ) : null}
        />
        <div className="grid grid-cols-4 gap-1">
          <AnimatePresence mode="popLayout">
            {visibleActions.map(action => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <span className="text-gray text-[10px] font-medium">{action.label}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}