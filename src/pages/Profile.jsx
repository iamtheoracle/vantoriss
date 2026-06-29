import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import { hasOperationsAccess, getRoleLabel } from '@/lib/operationsAccess';
import { formatCurrency } from '@/lib/formatCurrency';
import { User, Mail, Shield, LogOut, FileText, Trash2, Copy, Check, Gift, Sparkles, Wallet, Briefcase, Bell, Users, Building2, Globe, ChevronRight, MessageCircle } from 'lucide-react';
import { whatsappLink, BUSINESS_WHATSAPP_DISPLAY } from '@/lib/businessConfig';

const ACCOUNT_ICONS = { Personal: User, Joint: Users, Business: Building2, Organization: Globe };

export default function Profile() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
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
      if (me.role === 'user') {
        try {
          const accts = await base44.entities.Account.filter({ user_id: me.id }, '-created_date');
          setAccounts(accts);
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

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {/* Avatar & Name */}
      <div className="vantoris-card p-6 flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-brass/15 flex items-center justify-center">
          <span className="text-brass text-xl font-bold">
            {(user.full_name || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{user.full_name || 'Member'}</p>
          <p className="text-[#AAB4C3] text-sm">{user.email}</p>
          <p className="text-brass text-xs mt-0.5">{getRoleLabel(user.role)}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-2 mb-6">
        <div className="vantoris-card p-4 flex items-center gap-3">
          <User size={18} className="text-[#AAB4C3]" />
          <div className="flex-1">
            <p className="text-[#AAB4C3] text-xs">Full Name</p>
            <p className="text-white text-sm">{user.full_name || '—'}</p>
          </div>
        </div>
        <div className="vantoris-card p-4 flex items-center gap-3">
          <Mail size={18} className="text-[#AAB4C3]" />
          <div className="flex-1">
            <p className="text-[#AAB4C3] text-xs">Email</p>
            <p className="text-white text-sm">{user.email}</p>
          </div>
        </div>
        <div className="vantoris-card p-4 flex items-center gap-3">
          <Shield size={18} className="text-[#AAB4C3]" />
          <div className="flex-1">
            <p className="text-[#AAB4C3] text-xs">Account Role</p>
            <p className="text-white text-sm">{getRoleLabel(user.role)}</p>
          </div>
        </div>
      </div>

      {/* My Accounts — members only */}
      {user.role === 'user' && (
        <div className="mb-6">
          <h3 className="text-white font-semibold text-sm mb-3">My Accounts</h3>
          {accounts.length === 0 ? (
            <button
              onClick={() => navigate('/accounts')}
              className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all"
            >
              <Wallet size={18} className="text-[#AAB4C3]" />
              <span className="text-[#AAB4C3] text-sm">No accounts yet — View Accounts</span>
            </button>
          ) : (
            <div className="space-y-2">
              {accounts.map(acct => {
                const Icon = ACCOUNT_ICONS[acct.account_type] || Wallet;
                return (
                  <button
                    key={acct.id}
                    onClick={() => navigate(`/accounts/${acct.id}`)}
                    className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acct.status === 'frozen' ? 'bg-crimson/15' : 'bg-brass/15'}`}>
                      <Icon size={18} className={acct.status === 'frozen' ? 'text-red-400' : 'text-brass'} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-medium">{acct.account_name || acct.account_type}</p>
                      <p className="text-[#AAB4C3] text-xs">{acct.account_type} · {acct.account_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">{formatCurrency(acct.balance || 0)}</p>
                      {acct.status !== 'active' && <p className="text-red-400 text-xs capitalize">{acct.status}</p>}
                    </div>
                    <ChevronRight size={16} className="text-[#AAB4C3]" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Member Quick Links — members only */}
      {user.role === 'user' && (
        <>
          <button
            onClick={() => navigate('/advisor')}
            className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
          >
            <Sparkles size={18} className="text-brass" />
            <span className="text-white text-sm font-medium">Vantoris Advisor</span>
          </button>
          <button
            onClick={() => navigate('/services')}
            className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
          >
            <Briefcase size={18} className="text-[#AAB4C3]" />
            <span className="text-white text-sm font-medium">Services</span>
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
          >
            <Bell size={18} className="text-[#AAB4C3]" />
            <span className="text-white text-sm font-medium">Messages</span>
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
          >
            <FileText size={18} className="text-[#AAB4C3]" />
            <span className="text-white text-sm font-medium">My Documents</span>
          </button>
        </>
      )}

      {/* Referral Program — members only */}
      {user.role === 'user' && (
        <div className="vantoris-card p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center">
              <Gift size={18} className="text-brass" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Refer a Friend</p>
              <p className="text-[#AAB4C3] text-xs">Share your invite link</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#0E1A2B] rounded-xl px-3 py-2.5 border border-[#242D38]">
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
      )}

      {/* Contact Support — WhatsApp */}
      <a
        href={whatsappLink(`Hello Vantoris Support, I have a question regarding my account.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-emerald-500/30 transition-all mb-3"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <MessageCircle size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-white text-sm font-medium">WhatsApp Support</span>
          <p className="text-[#AAB4C3] text-xs">Chat with us · {BUSINESS_WHATSAPP_DISPLAY}</p>
        </div>
        <ChevronRight size={16} className="text-[#AAB4C3]" />
      </a>

      {/* Operations Center access — discreet, role-gated */}
      {hasOperationsAccess(user.role) && (
        <button
          onClick={() => navigate('/operations')}
          className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
        >
          <Shield size={18} className="text-brass" />
          <div className="text-left">
            <span className="text-white text-sm font-medium">Operations Center</span>
            <p className="text-[#AAB4C3] text-xs">Staff access</p>
          </div>
        </button>
      )}

      {/* Logout */}
      <button
        onClick={() => base44.auth.logout('/')}
        className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-crimson/30 transition-all mb-2"
      >
        <LogOut size={18} className="text-red-400" />
        <span className="text-red-400 text-sm font-medium">Sign Out</span>
      </button>

      {/* Delete Account */}
      <button
        onClick={() => setShowDelete(true)}
        className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-crimson/30 transition-all"
      >
        <Trash2 size={18} className="text-red-400/70" />
        <span className="text-red-400/70 text-sm font-medium">Delete Account</span>
      </button>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center">
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