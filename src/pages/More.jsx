import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import {
  User, Shield, Bell, Settings, Gift, Users, Calendar,
  FileText, CreditCard, MessageCircle, HelpCircle, Info,
  ShieldCheck, FileCheck, History, Lock, LogOut,
  ChevronRight, Sparkles, Award, ScrollText, Phone,
} from 'lucide-react';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import { getRoleLabel } from '@/lib/operationsAccess';

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'Profile', desc: 'Personal information & settings', icon: User, route: '/profile', color: 'bg-brass/10 text-brass' },
      { id: 'security', label: 'Security Center', desc: 'PIN, sessions & security settings', icon: Shield, route: '/profile', color: 'bg-crimson/10 text-crimson' },
      { id: 'notifications', label: 'Notifications', desc: 'Manage your notifications', icon: Bell, route: '/messages', color: 'bg-blue-500/10 text-blue-600' },
      { id: 'settings', label: 'Settings', desc: 'App preferences', icon: Settings, route: '/profile', color: 'bg-gray-100 text-gray' },
    ],
  },
  {
    title: 'Banking',
    items: [
      { id: 'cards', label: 'Cards', desc: 'Manage your debit & credit cards', icon: CreditCard, route: '/services', color: 'bg-brass/10 text-brass' },
      { id: 'statements', label: 'Statements', desc: 'Account statements', icon: FileText, route: '/documents', color: 'bg-blue-500/10 text-blue-600' },
      { id: 'documents', label: 'Documents', desc: 'All your documents', icon: FileCheck, route: '/documents', color: 'bg-purple-500/10 text-purple-600' },
      { id: 'tax', label: 'Tax Documents', desc: 'Tax forms & records', icon: ScrollText, route: '/documents', color: 'bg-emerald-500/10 text-emerald-600' },
    ],
  },
  {
    title: 'Advisory & Support',
    items: [
      { id: 'advisor', label: 'Member Advisor', desc: 'AI financial assistant with WhatsApp', icon: Sparkles, route: '/advisor', color: 'bg-brass/10 text-brass' },
      { id: 'help', label: 'Help Center', desc: 'FAQs & guides', icon: HelpCircle, route: '/advisor', color: 'bg-blue-500/10 text-blue-600' },
      { id: 'contact', label: 'Contact Support', desc: 'WhatsApp & email support', icon: Phone, external: true, color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'appointments', label: 'Appointments', desc: 'Schedule a call', icon: Calendar, route: '/services', color: 'bg-purple-500/10 text-purple-600' },
    ],
  },
  {
    title: 'Verification & History',
    items: [
      { id: 'kyc', label: 'Identity Verification', desc: 'KYC / KYB status', icon: ShieldCheck, route: '/apply/kyc', color: 'bg-brass/10 text-brass' },
      { id: 'activity', label: 'Activity History', desc: 'Recent account activity', icon: History, route: '/accounts', color: 'bg-gray-100 text-gray' },
      { id: 'rewards', label: 'Rewards', desc: 'Points & rewards', icon: Gift, color: 'bg-amber-500/10 text-amber-600' },
    ],
  },
  {
    title: 'Programs & Legal',
    items: [
      { id: 'referrals', label: 'Referral Program', desc: 'Invite friends & earn', icon: Users, route: '/profile', color: 'bg-brass/10 text-brass' },
      { id: 'privacy', label: 'Privacy', desc: 'Privacy preferences', icon: Lock, route: '/profile', color: 'bg-gray-100 text-gray' },
      { id: 'about', label: 'About VANTORIS', desc: 'Learn about us', icon: Info, color: 'bg-blue-500/10 text-blue-600' },
    ],
  },
];

export default function More() {
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();
  const [user, setUser] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(console.error);
  }, []);

  function handleItemClick(item) {
    if (item.external) {
      window.open(
        whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
        '_blank', 'noopener,noreferrer'
      );
      return;
    }
    if (item.id === 'about') {
      setShowAbout(true);
      return;
    }
    if (item.route) {
      navigate(item.route);
    }
  }

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-glass-premium p-5 mb-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brass/20 to-brass/5 border border-brass/15 flex items-center justify-center">
            <span className="text-brass text-lg font-bold">
              {(user?.full_name || 'M').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-base truncate">{user?.full_name || 'Member'}</p>
            <p className="text-gray text-xs truncate">{user?.email}</p>
            <span className="text-brass text-[10px] font-medium">{getRoleLabel(user?.role)}</span>
          </div>
          <ChevronRight size={18} className="text-gray/40" />
        </div>
      </motion.div>

      {/* Sections */}
      {SECTIONS.map((section, sIdx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sIdx * 0.05 }}
          className="mb-5"
        >
          <h2 className="text-foreground font-semibold text-sm mb-3 px-1">{section.title}</h2>
          <div className="vantoris-glass-premium overflow-hidden">
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors text-left ${
                    idx > 0 ? 'border-t border-border/50' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-sm">{item.label}</p>
                    <p className="text-gray text-xs truncate">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray/40 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="vantoris-glass-premium overflow-hidden mb-5"
      >
        <button
          onClick={() => base44.auth.logout('/')}
          className="w-full flex items-center gap-3 p-3.5 hover:bg-crimson/5 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-crimson/10">
            <LogOut size={16} className="text-crimson" />
          </div>
          <p className="text-crimson font-medium text-sm flex-1">Sign Out</p>
        </button>
      </motion.div>

      {/* Footer */}
      <div className="mt-6 mb-2 flex flex-col items-center">
        <ShieldLogo size={28} className="mb-2 opacity-40" />
        <p className="text-gray/40 text-[10px] tracking-widest uppercase">Secure. Trusted. Tailored for you.</p>
      </div>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      {/* About Modal */}
      {showAbout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowAbout(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="vantoris-glass-premium w-full sm:max-w-sm p-6 rounded-t-3xl sm:rounded-3xl safe-bottom"
          >
            <div className="text-center">
              <ShieldLogo size={48} className="mx-auto mb-3" />
              <h3 className="text-foreground font-bold text-lg">VANTORIS</h3>
              <p className="text-gray text-xs mt-1">Private Wealth Management</p>
              <p className="text-gray/60 text-[10px] mt-3 leading-relaxed">
                An elite, private-label wealth management sanctuary providing transparent investment stewardship and seamless capital movement for sophisticated investors.
              </p>
              <button
                onClick={() => setShowAbout(false)}
                className="mt-5 w-full py-2.5 bg-brass text-white font-semibold rounded-xl text-sm hover:bg-brass/90 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}