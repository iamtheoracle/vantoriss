import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import { hasOperationsAccess, getRoleLabel } from '@/lib/operationsAccess';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  User, Mail, Shield, LogOut, FileText, Trash2, Copy, Check,
  Gift, Sparkles, Wallet, Bell, Users, Building2, Globe,
  ChevronRight, MessageCircle, ShieldCheck, Briefcase,
  Smartphone, CreditCard, Settings, Lock,
} from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';
import ProfileSection, { ProfileRow, ProfileDivider } from '@/components/vantoris/profile/ProfileSection';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

const ACCOUNT_ICONS = { Personal: User, Joint: Users, Business: Building2, Organization: Globe };

export default function Profile() {
  const whatsappNumber = useWhatsAppConfig();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [application, setApplication] = useState(null);
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
      if (me.role === 'user') {
        try {
          const accts = await base44.entities.Account.filter({ user_id: me.id }, '-created_date');
          setAccounts(accts);
        } catch (e) { console.error(e); }
        try {
          const apps = await base44.entities.Application.filter({ user_id: me.id });
          if (apps[0]) setApplication(apps[0]);
        } catch (e) { console.error(e); }
      }
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
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="px-5 pt-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vantoris-glass-premium p-6 mb-4 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-brass/[0.06] blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brass/20 to-brass/5 border border-brass/15 flex items-center justify-center">
            <span className="text-brass text-xl font-bold">
              {(user.full_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg truncate">{user.full_name || 'Member'}</p>
            <p className="text-[#AAB4C3] text-sm truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-brass text-xs font-medium">{getRoleLabel(user.role)}</span>
              {application?.kyc_status === 'approved' && (
                <span className="flex items-center gap-1 text-mint text-xs">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
        {isMember && accounts.length > 0 && (
          <div className="relative z-10 mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#AAB4C3]/70 text-[10px] uppercase tracking-wider">Aggregate Balance</p>
                <p className="text-white font-bold text-xl">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-[#AAB4C3]/70 text-[10px] uppercase tracking-wider">Accounts</p>
                <p className="text-white font-bold text-xl">{accounts.length}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Identity & Personal Information */}
      <ProfileSection title="Personal Information" icon={User} delay={0.05}>
        <ProfileRow icon={User} iconColor="text-brass" iconBg="bg-brass/10" label="Full Name" value={user.full_name || '—'} />
        <ProfileDivider />
        <ProfileRow icon={Mail} iconColor="text-blue-400" iconBg="bg-blue-500/10" label="Email Address" value={user.email} />
        <ProfileDivider />
        <ProfileRow icon={Shield} iconColor="text-champagne" iconBg="bg-champagne/10" label="Account Role" value={getRoleLabel(user.role)} />
      </ProfileSection>

      {/* Account Relationships — members only */}
      {isMember && (
        <ProfileSection title="Account Relationships" icon={Wallet} delay={0.1}>
          {accounts.length === 0 ? (
            <ProfileRow
              icon={Wallet}
              label="No accounts yet"
              value="Open your first account"
              onClick={() => navigate('/accounts')}
            />
          ) : (
            accounts.map((acct, idx) => {
              const Icon = ACCOUNT_ICONS[acct.account_type] || Wallet;
              return (
                <React.Fragment key={acct.id}>
                  {idx > 0 && <ProfileDivider />}
                  <ProfileRow
                    icon={Icon}
                    iconColor={acct.status === 'frozen' ? 'text-red-400' : 'text-brass'}
                    iconBg={acct.status === 'frozen' ? 'bg-crimson/10' : 'bg-brass/10'}
                    label={acct.account_type}
                    value={`${acct.account_name || acct.account_type} · ${formatCurrency(acct.balance || 0)}`}
                    rightElement={acct.status !== 'active' ? <StatusBadge status={acct.status} /> : null}
                    onClick={() => navigate(`/accounts/${acct.id}`)}
                  />
                </React.Fragment>
              );
            })
          )}
        </ProfileSection>
      )}

      {/* Identity Verification — members only */}
      {isMember && application && (
        <ProfileSection title="Identity Verification" icon={ShieldCheck} delay={0.15}>
          <ProfileRow
            icon={ShieldCheck}
            iconColor={application.kyc_status === 'approved' ? 'text-mint' : application.kyc_status === 'rejected' ? 'text-red-400' : 'text-brass'}
            iconBg={application.kyc_status === 'approved' ? 'bg-mint/10' : application.kyc_status === 'rejected' ? 'bg-crimson/10' : 'bg-brass/10'}
            label="KYC / KYB Status"
            rightElement={<StatusBadge status={application.kyc_status} />}
            onClick={application.kyc_status === 'not_started' || application.kyc_status === 'rejected' ? () => navigate('/apply/kyc') : null}
          />
        </ProfileSection>
      )}

      {/* Security & Privacy */}
      <ProfileSection title="Security & Privacy" icon={Lock} delay={0.2}>
        <ProfileRow icon={Shield} iconColor="text-red-400" iconBg="bg-red-500/10" label="Security Center" value="Manage your security settings" onClick={() => navigate('/profile')} />
        <ProfileDivider />
        <ProfileRow icon={Smartphone} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" label="Trusted Devices" value="Manage registered devices" onClick={() => navigate('/messages')} />
        <ProfileDivider />
        <ProfileRow icon={Lock} iconColor="text-brass" iconBg="bg-brass/10" label="Privacy Controls" value="Data and privacy preferences" onClick={() => navigate('/messages')} />
      </ProfileSection>

      {/* Documents & Statements */}
      <ProfileSection title="Documents & Statements" icon={FileText} delay={0.25}>
        <ProfileRow icon={FileText} iconColor="text-purple-400" iconBg="bg-purple-500/10" label="My Documents" value="Statements, tax docs & agreements" onClick={() => navigate('/documents')} />
        <ProfileDivider />
        <ProfileRow icon={CreditCard} iconColor="text-champagne" iconBg="bg-champagne/10" label="Statements" value="Account statements & history" onClick={() => navigate('/documents')} />
      </ProfileSection>

      {/* Communication & Notifications */}
      <ProfileSection title="Communication" icon={Bell} delay={0.3}>
        <ProfileRow icon={Bell} iconColor="text-brass" iconBg="bg-brass/10" label="Messages" value="Secure messages" onClick={() => navigate('/messages')} />
        <ProfileDivider />
        <ProfileRow
          icon={MessageCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          label="WhatsApp Support"
          value="Chat with us directly"
          rightElement={<ChevronRight size={16} className="text-[#AAB4C3]/50" />}
          onClick={() => window.open(
            whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
            '_blank', 'noopener,noreferrer'
          )}
        />
        <ProfileDivider />
        <ProfileRow icon={Settings} iconColor="text-[#AAB4C3]" iconBg="bg-white/[0.04]" label="Notification Preferences" value="Manage alert settings" onClick={() => navigate('/messages')} />
      </ProfileSection>

      {/* AI & Advisory */}
      {isMember && (
        <ProfileSection title="AI & Advisory" icon={Sparkles} delay={0.35}>
          <ProfileRow icon={Sparkles} iconColor="text-brass" iconBg="bg-brass/10" label="Vantoris Advisor" value="Your personal AI financial assistant" onClick={() => navigate('/advisor')} />
          <ProfileDivider />
          <ProfileRow icon={Briefcase} iconColor="text-champagne" iconBg="bg-champagne/10" label="Services" value="Manage banking services" onClick={() => navigate('/services')} />
        </ProfileSection>
      )}

      {/* Referral Program — members only */}
      {isMember && (
        <ProfileSection title="Referral Program" icon={Gift} delay={0.4}>
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center">
                <Gift size={16} className="text-brass" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Refer a Friend</p>
                <p className="text-[#AAB4C3] text-xs">Share your invite link</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#0B0F18]/60 rounded-xl px-3 py-2.5 border border-white/[0.05]">
              <span className="text-[#AAB4C3] text-xs flex-1 truncate selectable-content">{referralLink}</span>
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

      {/* Operations Center access — discreet, role-gated */}
      {hasOperationsAccess(user.role) && (
        <ProfileSection title="Staff Access" icon={Shield} delay={0.45}>
          <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Operations Center" value="Staff access" onClick={() => navigate('/operations')} />
        </ProfileSection>
      )}

      {/* Account Management */}
      <ProfileSection title="Account Management" icon={LogOut} delay={0.5}>
        <ProfileRow icon={LogOut} iconColor="text-red-400" iconBg="bg-red-500/10" label="Sign Out" onClick={() => base44.auth.logout('/')} danger />
        <ProfileDivider />
        <ProfileRow icon={Trash2} iconColor="text-red-400" iconBg="bg-red-500/10" label="Delete Account" onClick={() => setShowDelete(true)} danger />
      </ProfileSection>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      {/* Footer */}
      <div className="mt-8 mb-2 flex flex-col items-center">
        <ShieldLogo size={28} className="mb-2 opacity-40" />
        <p className="text-[#AAB4C3]/30 text-[10px] tracking-widest uppercase">Secure. Trusted. Tailored for you.</p>
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