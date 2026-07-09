import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import { hasOperationsAccess, getRoleLabel } from '@/lib/operationsAccess';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  User, Shield, LogOut, FileText, Trash2, Copy, Check,
  Gift, Sparkles, Wallet, Bell, MessageCircle, ShieldCheck,
  ChevronRight, Briefcase,
} from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';
import ProfileSection, { ProfileRow, ProfileDivider } from '@/components/vantoris/profile/ProfileSection';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

export default function Profile() {
  const whatsappNumber = useWhatsAppConfig();
  const [user, setUser] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      if (me && me.role === 'user' && !me.referral_code) {
        const code = generateReferralCode(me.id);
        await base44.auth.updateMe({ referral_code: code });
        me.referral_code = code;
      }
      setUser(me);
      setReferralLink(`${window.location.origin}/register?ref=${me.referral_code || ''}`);
    }
    load();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = user.role === 'user';

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-glass-premium p-6 mb-4 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-brass/[0.06] blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brass/15 to-brass/5 border border-brass/15 flex items-center justify-center">
            <span className="text-brass text-xl font-bold">
              {(user.full_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-lg truncate">{user.full_name || 'Member'}</p>
            <p className="text-gray text-sm truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-brass text-xs font-medium">{getRoleLabel(user.role)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact & Security */}
      <ProfileSection title="Account Settings" icon={ShieldCheck} delay={0.1}>
        <ProfileRow
          icon={User}
          iconColor="text-brass"
          iconBg="bg-brass/10"
          label="Personal Information"
          value={user.email}
          onClick={() => {}}
        />
        <ProfileDivider />
        <ProfileRow
          icon={Shield}
          iconColor="text-brass"
          iconBg="bg-brass/10"
          label="Security & Access"
          value="Manage your credentials"
          onClick={() => {}}
        />
      </ProfileSection>

      {/* Documents */}
      <ProfileSection title="Documents" icon={FileText} delay={0.15}>
        <ProfileRow icon={FileText} iconColor="text-brass" iconBg="bg-brass/10" label="Statements & Documents" value="Statements, tax docs & agreements" onClick={() => navigate('/documents')} />
      </ProfileSection>

      {/* Communication */}
      <ProfileSection title="Communication" icon={Bell} delay={0.2}>
        <ProfileRow icon={Bell} iconColor="text-brass" iconBg="bg-brass/10" label="Messages" value="Secure messages" onClick={() => navigate('/messages')} />
        <ProfileDivider />
        <ProfileRow
          icon={MessageCircle}
          iconColor="text-mint"
          iconBg="bg-mint/10"
          label="WhatsApp Support"
          value="Chat with us directly"
          rightElement={<ChevronRight size={16} className="text-gray/40" />}
          onClick={() => window.open(
            whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
            '_blank', 'noopener,noreferrer'
          )}
        />
      </ProfileSection>

      {/* Advisory */}
      {isMember && (
        <ProfileSection title="Advisory & Services" icon={Sparkles} delay={0.25}>
          <ProfileRow icon={Sparkles} iconColor="text-brass" iconBg="bg-brass/10" label="Vantoris Advisor" value="Your personal AI financial assistant" onClick={() => navigate('/advisor')} />
          <ProfileDivider />
          <ProfileRow icon={Briefcase} iconColor="text-brass" iconBg="bg-brass/10" label="Services" value="Manage banking services" onClick={() => navigate('/services')} />
        </ProfileSection>
      )}

      {/* Referral Program — members only */}
      {isMember && (
        <ProfileSection title="Referral Program" icon={Gift} delay={0.3}>
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center">
                <Gift size={16} className="text-brass" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Refer a Friend</p>
                <p className="text-gray text-xs">Share your invite link</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
              <span className="text-gray text-xs flex-1 truncate selectable-content">{referralLink}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all flex-shrink-0"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </ProfileSection>
      )}

      {/* Operations Center access — role-gated */}
      {hasOperationsAccess(user.role) && (
        <ProfileSection title="Staff Access" icon={Shield} delay={0.35}>
          <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Operations Center" value="Staff access" onClick={() => navigate('/operations')} />
        </ProfileSection>
      )}

      {/* Account Management */}
      <ProfileSection title="Account Management" icon={LogOut} delay={0.4}>
        <ProfileRow icon={LogOut} label="Sign Out" onClick={() => base44.auth.logout('/')} danger />
        <ProfileDivider />
        <ProfileRow icon={Trash2} label="Delete Account" onClick={() => setShowDelete(true)} danger />
      </ProfileSection>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      {/* Footer */}
      <div className="mt-8 mb-2 flex flex-col items-center">
        <ShieldLogo size={28} className="mb-2 opacity-40" />
        <p className="text-gray/40 text-[10px] tracking-widest uppercase">Secure. Trusted. Tailored for you.</p>
      </div>
    </div>
  );
}

function generateReferralCode(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}