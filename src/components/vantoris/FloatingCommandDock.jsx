import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import { logAuditEntry } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';
import {
  Command, X, ChevronUp, Sparkles, Lock, Check, Shield,
} from 'lucide-react';

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

export default function FloatingCommandDock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isMember = user?.role === 'user';

  useEffect(() => {
    if (!user || !isMember) return;
    let cancelled = false;
    async function loadAccounts() {
      try {
        const accts = await base44.entities.Account.filter({ user_id: user.id });
        if (!cancelled) setAccounts(accts);
      } catch {}
    }
    loadAccounts();
    return () => { cancelled = true; };
  }, [user, isMember]);

  const actions = [
    { id: 'assistant', label: 'Assistant', icon: Sparkles, color: 'bg-navy/8 text-navy', onClick: () => navigate('/assistant') },
    { id: 'freeze', label: 'Freeze My Card', icon: Lock, color: 'bg-crimson/10 text-crimson', onClick: () => { setFreezeOpen(true); setExpanded(false); } },
  ];

  // Operations staff get Mission Control instead of Freeze Card
  if (hasOperationsAccess(user?.role)) {
    actions[1] = { id: 'mission-control', label: 'Mission Control', icon: Shield, color: 'bg-navy text-white', onClick: () => navigate('/operations') };
  }

  function handleAction(action) {
    haptic(8);
    setExpanded(false);
    action.onClick();
  }

  async function handleFreeze() {
    if (!selectedAccount) return;
    setSubmitting(true);
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      await base44.entities.Account.update(selectedAccount, { status: 'frozen' });
      await base44.entities.Transaction.create({
        account_id: selectedAccount,
        type: 'adjustment',
        amount: 0,
        description: 'Card frozen by member',
        balance_after: account.balance,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'Card Frozen',
        message: `Your card for ${account.account_name} has been frozen. No new transactions will be processed.`,
        type: 'warning',
      });
      await logAuditEntry({
        action_type: 'card_frozen',
        description: `Member froze card for account: ${account.account_name}`,
        account_id: selectedAccount,
        target_user_id: user.id,
      });
      toast({ title: 'Card Frozen', description: `${account.account_name} has been frozen. No new transactions will be processed.` });
      setFreezeOpen(false);
      setSelectedAccount(null);
    } catch (e) {
      toast({ title: 'Unable to Freeze Card', description: e.message || 'Please try again. If the problem continues, contact support.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  if (!user) return null;

  return (
    <>
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

                <div className="grid grid-cols-2 gap-2">
                  {actions.map(action => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleAction(action)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color}`}>
                          <Icon size={20} strokeWidth={2} />
                        </div>
                        <span className="text-foreground text-xs font-medium text-center">{action.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* Freeze Card Dialog */}
      <AnimatePresence>
        {freezeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-navy/20 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setFreezeOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="vantoris-glass-premium w-full sm:max-w-sm p-6 rounded-t-3xl sm:rounded-3xl safe-bottom"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-crimson/10 flex items-center justify-center">
                  <Lock size={20} className="text-crimson" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold text-base">Freeze My Card</h3>
                  <p className="text-gray text-xs">Select an account to freeze its card immediately.</p>
                </div>
              </div>

              {accounts.length === 0 ? (
                <p className="text-gray text-sm py-4 text-center">No accounts available to freeze.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {accounts.map(acct => (
                      <button
                        key={acct.id}
                        onClick={() => setSelectedAccount(acct.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedAccount === acct.id
                            ? 'border-crimson/30 bg-crimson/5'
                            : 'border-border bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-foreground font-medium text-sm">{acct.account_name}</p>
                          <p className="text-gray text-xs font-mono">••••{acct.account_number?.slice(-4) || '----'}</p>
                        </div>
                        {selectedAccount === acct.id && <Check size={16} className="text-crimson" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setFreezeOpen(false)}
                      className="px-6 py-3 bg-slate-100 text-gray rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFreeze}
                      disabled={!selectedAccount || submitting}
                      className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Freezing...</>
                      ) : (
                        <><Lock size={14} /> Freeze Card</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}