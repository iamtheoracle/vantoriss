import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import {
  Command, X, ChevronUp, ArrowLeftRight, ArrowDownToLine, ArrowUpRight,
  Send, Heart, Target, Sparkles, MessageCircle,
  FileText, LifeBuoy, Plus, Shield,
} from 'lucide-react';

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

function getActionUsage() {
  try { return JSON.parse(localStorage.getItem('vantoris_action_usage') || '{}'); }
  catch { return {}; }
}

function trackActionUsage(id) {
  try {
    const usage = getActionUsage();
    usage[id] = (usage[id] || 0) + 1;
    localStorage.setItem('vantoris_action_usage', JSON.stringify(usage));
  } catch {}
}

export default function FloatingCommandDock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();
  const [expanded, setExpanded] = useState(false);
  const [products, setProducts] = useState({ accounts: false, herobox: false });
  const [badges, setBadges] = useState({});

  const isMember = user?.role === 'user';

  // Load product info + time-sensitive badges for members
  useEffect(() => {
    if (!user || user.role !== 'user') return;
    let cancelled = false;

    async function loadProducts() {
      try {
        const [accts, heroProfs] = await Promise.all([
          base44.entities.Account.filter({ user_id: user.id }, null, 1),
          base44.entities.HeroBoxProfile.filter({ user_id: user.id }, null, 1),
        ]);
        if (cancelled) return;
        setProducts({
          accounts: accts.length > 0,
          herobox: heroProfs.length > 0,
        });

        // Lazy-load time-sensitive badges
        if (accts.length > 0) {
          const pendingWd = await base44.entities.WithdrawalRequest.filter(
            { user_id: user.id, status: 'pending' }, null, 5
          ).catch(() => []);
          if (!cancelled && pendingWd.length > 0) {
            setBadges(b => ({ ...b, withdraw: pendingWd.length }));
          }
        }
        if (heroProfs.length > 0) {
          const heroReqs = await base44.entities.HeroBoxRequest.filter(
            { user_id: user.id }, '-created_date', 5
          ).catch(() => []);
          if (!cancelled) {
            const pending = heroReqs.filter(r => r.status === 'pending' || r.status === 'under_review').length;
            if (pending > 0) setBadges(b => ({ ...b, sponsor: pending }));
          }
        }
      } catch {}
    }

    loadProducts();
    return () => { cancelled = true; };
  }, [user]);

  // Build context-aware action list
  const actions = useMemo(() => {
    if (!user) return [];
    const list = [];

    // Operations access for staff
    if (hasOperationsAccess(user.role)) {
      list.push({
        id: 'mission-control', label: 'Mission Control', icon: Shield,
        to: '/operations', color: 'bg-navy text-white', highlight: true,
      });
    }

    // Banking actions
    if (products.accounts) {
      list.push({ id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, to: '/move-money', color: 'bg-navy/8 text-navy' });
      list.push({ id: 'send', label: 'Send', icon: Send, to: '/move-money?tab=zelle', color: 'bg-navy/8 text-navy' });
      list.push({ id: 'deposit', label: 'Deposit', icon: ArrowDownToLine, to: '/move-money?tab=deposit', color: 'bg-mint/10 text-mint' });
      list.push({ id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, to: '/move-money?tab=withdraw', color: 'bg-crimson/10 text-crimson', badge: badges.withdraw });
    }

    // HeroBox actions
    if (products.herobox) {
      list.push({ id: 'sponsor', label: 'Sponsor', icon: Heart, to: '/herobox', color: 'bg-brass/15 text-brass', badge: badges.sponsor });
      list.push({ id: 'impact', label: 'Impact', icon: Target, to: '/herobox', color: 'bg-brass/15 text-brass' });
    }

    // Onboarding for new members with no products
    if (isMember && !products.accounts && !products.herobox) {
      list.push({ id: 'open-account', label: 'Open Account', icon: Plus, to: '/apply', color: 'bg-navy text-white', highlight: true });
    }

    // Always available
    if (isMember) {
      list.push({ id: 'advisor', label: 'Advisor', icon: Sparkles, to: '/advisor', color: 'bg-navy/8 text-navy' });
    }
    list.push({ id: 'messages', label: 'Messages', icon: MessageCircle, to: '/messages', color: 'bg-navy/8 text-navy' });
    list.push({ id: 'statements', label: 'Statements', icon: FileText, to: '/documents', color: 'bg-navy/8 text-navy' });
    list.push({
      id: 'support', label: 'Support', icon: LifeBuoy, to: null, color: 'bg-mint/10 text-mint',
      isExternal: true,
    });

    // Sort by usage frequency (most used first), highlighted always first
    const usage = getActionUsage();
    return [...list].sort((a, b) => {
      if (a.highlight && !b.highlight) return -1;
      if (b.highlight && !a.highlight) return 1;
      return (usage[b.id] || 0) - (usage[a.id] || 0);
    });
  }, [user, products, badges, isMember]);

  function handleAction(action) {
    haptic(8);
    trackActionUsage(action.id);
    setExpanded(false);
    if (action.isExternal) {
      window.open(
        whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
        '_blank', 'noopener,noreferrer'
      );
    } else if (action.to) {
      navigate(action.to);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Backdrop — soft blur, never opaque */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { haptic(5); setExpanded(false); }}
            className="fixed inset-0 z-40 bg-navy/10 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Dock — floating glass command capsule */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
      >
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="mb-3 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md"
            >
              <div className="vantoris-glass-dropdown p-4">
                {/* Panel header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Command size={14} className="text-navy" strokeWidth={2.5} />
                    <span className="text-foreground font-bold text-sm">Quick Actions</span>
                  </div>
                  <button
                    onClick={() => { haptic(5); setExpanded(false); }}
                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X size={14} className="text-gray" />
                  </button>
                </div>

                {/* Adaptive action grid — 2 cols mobile, 3 cols tablet */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[50vh] overflow-y-auto vantoris-scroll">
                  {actions.map(action => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleAction(action)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors ${action.highlight ? 'ring-1 ring-brass/20 bg-brass/[0.03]' : ''}`}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${action.color}`}>
                          <Icon size={18} strokeWidth={2} />
                        </div>
                        <span className="text-gray text-[10px] font-medium text-center leading-tight">{action.label}</span>
                        {action.badge && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            className="absolute top-2 right-2 min-w-[16px] h-4 px-1 bg-crimson text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                          >
                            {action.badge}
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed capsule */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { haptic(8); setExpanded(!expanded); }}
          className="vantoris-glass-dropdown flex items-center gap-2 px-4 py-2.5 rounded-full shadow-float"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center">
            <Command size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-foreground font-semibold text-sm">Quick Actions</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <ChevronUp size={14} className="text-gray" />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}