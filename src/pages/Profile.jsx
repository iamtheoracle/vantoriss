import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import {
  User, Shield, LogOut, FileText, Trash2, Copy, Check,
  Gift, Bell, MessageCircle, ShieldCheck, Settings,
} from 'lucide-react';
import ProfileSection, { ProfileRow, ProfileDivider } from '@/components/vantoris/profile/ProfileSection';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import ProfileHeader from '@/components/vantoris/profile/ProfileHeader';
import FinancialOverview from '@/components/vantoris/profile/FinancialOverview';
import CommunitySupport from '@/components/vantoris/profile/CommunitySupport';
import RecentActivity from '@/components/vantoris/profile/RecentActivity';
import ProfileActionDock from '@/components/vantoris/profile/ProfileActionDock';

export default function Profile() {
  const whatsappNumber = useWhatsAppConfig();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [tradingAccounts, setTradingAccounts] = useState([]);
  const [application, setApplication] = useState(null);
  const [heroProfile, setHeroProfile] = useState(null);
  const [heroActivities, setHeroActivities] = useState([]);
  const [heroRequests, setHeroRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const me = await base44.auth.me();
    if (me && me.role === 'user' && !me.referral_code) {
      const code = generateReferralCode(me.id);
      await base44.auth.updateMe({ referral_code: code });
      me.referral_code = code;
    }
    setUser(me);
    setReferralLink(`${window.location.origin}/register?ref=${me.referral_code || ''}`);

    const [accts, apps, trading, heroProfs, heroActs, heroReqs] = await Promise.all([
      base44.entities.Account.filter({ user_id: me.id }),
      base44.entities.Application.filter({ user_id: me.id }),
      base44.entities.TradingAccount.filter({ user_id: me.id }),
      base44.entities.HeroBoxProfile.filter({ user_id: me.id }),
      base44.entities.HeroBoxActivity.filter({ user_id: me.id }, '-created_date', 5),
      base44.entities.HeroBoxRequest.filter({ user_id: me.id }),
    ]);

    setAccounts(accts);
    setApplication(apps[0] || null);
    setTradingAccounts(trading);
    setHeroProfile(heroProfs[0] || null);
    setHeroActivities(heroActs);
    setHeroRequests(heroReqs);

    const accountIds = accts.slice(0, 3).map(a => a.id);
    if (accountIds.length > 0) {
      const txnResults = await Promise.all(
        accountIds.map(id => base44.entities.Transaction.filter({ account_id: id }, '-created_date', 5))
      );
      const allTxns = txnResults.flat().sort((a, b) =>
        new Date(b.created_date) - new Date(a.created_date)
      ).slice(0, 8);
      setTransactions(allTxns);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = user.role === 'user';
  const hasAccounts = accounts.length > 0;
  const hasHeroBox = !!heroProfile;

  const profileCompletion = [
    user.full_name ? 25 : 0,
    application?.kyc_status === 'approved' ? 25 : 0,
    hasAccounts ? 25 : 0,
    hasHeroBox ? 25 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="px-5 pt-6 pb-8">
      {/* 1. Profile Header */}
      <ProfileHeader user={user} application={application} profileCompletion={profileCompletion} />

      {/* 2. Quick Actions — context-aware expandable dock */}
      <ProfileActionDock hasAccounts={hasAccounts} hasHeroBox={hasHeroBox} isMember={isMember} />

      {/* 3. Financial Overview — only eligible products */}
      <FinancialOverview accounts={accounts} tradingAccounts={tradingAccounts} />

      {/* 4. Community Support — HeroBox data only if profile exists */}
      <CommunitySupport heroProfile={heroProfile} heroRequests={heroRequests} />

      {/* 5. Recent Activity — merged financial + community timeline */}
      {(transactions.length > 0 || heroActivities.length > 0) && (
        <RecentActivity transactions={transactions} heroActivities={heroActivities} />
      )}

      {/* 6. Documents */}
      <ProfileSection title="Documents" icon={FileText} delay={0.1}>
        <ProfileRow icon={FileText} iconColor="text-brass" iconBg="bg-brass/10" label="Statements & Documents" value="Statements, tax docs & agreements" onClick={() => navigate('/documents')} />
      </ProfileSection>

      {/* 7. Communication */}
      <ProfileSection title="Communication" icon={Bell} delay={0.15}>
        <ProfileRow icon={Bell} iconColor="text-brass" iconBg="bg-brass/10" label="Messages" value="Secure messages" onClick={() => navigate('/messages')} />
        <ProfileDivider />
        <ProfileRow
          icon={MessageCircle}
          iconColor="text-mint"
          iconBg="bg-mint/10"
          label="WhatsApp Support"
          value="Chat with us directly"
          onClick={() => window.open(
            whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
            '_blank', 'noopener,noreferrer'
          )}
        />
      </ProfileSection>

      {/* Advisory & Services — members only */}
      {isMember && (
        <ProfileSection title="Advisory & Services" icon={ShieldCheck} delay={0.2}>
          <ProfileRow icon={ShieldCheck} iconColor="text-brass" iconBg="bg-brass/10" label="Vantoris Advisor" value="Your personal AI financial assistant" onClick={() => navigate('/advisor')} />
          <ProfileDivider />
          <ProfileRow icon={Settings} iconColor="text-brass" iconBg="bg-brass/10" label="Services" value="Manage banking services" onClick={() => navigate('/services')} />
        </ProfileSection>
      )}

      {/* Referral Program — members only */}
      {isMember && (
        <ProfileSection title="Referral Program" icon={Gift} delay={0.25}>
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
        <ProfileSection title="Staff Access" icon={Shield} delay={0.3}>
          <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Operations Center" value="Staff access" onClick={() => navigate('/operations')} />
        </ProfileSection>
      )}

      {/* 8. Settings & Account Management */}
      <ProfileSection title="Account Management" icon={LogOut} delay={0.35}>
        <ProfileRow icon={User} iconColor="text-brass" iconBg="bg-brass/10" label="Personal Information" value={user.email} onClick={() => {}} />
        <ProfileDivider />
        <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Security & Access" value="Manage your credentials" onClick={() => {}} />
        <ProfileDivider />
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