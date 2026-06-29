import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ArrowUpRight, ArrowDownLeft, Bell, ChevronRight, TrendingUp, Clock, Briefcase, Sparkles, Mail, MessageCircle } from 'lucide-react';
import { whatsappLink, BUSINESS_WHATSAPP_NUMBER } from '@/lib/businessConfig';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

export default function Home() {
  const whatsappNumber = useWhatsAppConfig();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [application, setApplication] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [apps, accts, notifs] = await Promise.all([
      base44.entities.Application.filter({ user_id: me.id }),
      base44.entities.Account.filter({ user_id: me.id }),
      base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 5),
    ]);
    setApplication(apps[0] || null);
    setAccounts(accts);
    setNotifications(notifs);

    if (accts.length > 0) {
      const txns = await base44.entities.Transaction.filter(
        { account_id: accts.map(a => a.id) },
        '-created_date',
        10
      );
      setTransactions(txns);
    }
  }, []);

  useEffect(() => {
    loadData().catch(e => console.error(e)).finally(() => setLoading(false));
  }, [loadData]);

  const { containerProps, PullIndicator } = usePullToRefresh(loadData);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal').length;
  const firstName = user?.full_name?.split(' ')[0] || 'Member';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const unreadCount = notifications.filter(n => !n.read).length;

  // If no application yet, show onboarding prompt
  if (!application) {
    return (
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-8">
          <ShieldLogo size={32} />
          <button onClick={() => navigate('/messages')} className="relative p-2">
            <Bell size={20} className="text-[#AAB4C3]" />
          </button>
        </div>
        <div className="vantoris-card p-8 text-center">
          <ShieldLogo size={64} className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vantoris</h2>
          <p className="text-[#AAB4C3] text-sm mb-6 leading-relaxed">
            A secure platform for private institutions and approved members to manage capital with clarity and confidence.
          </p>
          <button
            onClick={() => navigate('/apply')}
            className="w-full py-3.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all"
          >
            Apply for Membership
          </button>
        </div>
      </div>
    );
  }

  // If application pending or KYC not approved
  if (application.application_status === 'pending') {
    return (
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-8">
          <ShieldLogo size={32} />
          <button onClick={() => navigate('/messages')} className="relative p-2">
            <Bell size={20} className="text-[#AAB4C3]" />
          </button>
        </div>
        <div className="vantoris-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-brass" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Application Under Review</h2>
          <p className="text-[#AAB4C3] text-sm mb-4 leading-relaxed">
            Your {application.account_type} account application is being reviewed. You will be notified once approved.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-[#AAB4C3]">KYC Status:</span>
            <StatusBadge status={application.kyc_status} />
          </div>
          {application.kyc_status === 'not_started' && (
            <button
              onClick={() => navigate('/apply/kyc')}
              className="mt-6 w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all"
            >
              Complete Identity Verification
            </button>
          )}
        </div>
      </div>
    );
  }

  if (application.application_status === 'rejected') {
    return (
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-8">
          <ShieldLogo size={32} />
          <button onClick={() => navigate('/messages')} className="relative p-2">
            <Bell size={20} className="text-[#AAB4C3]" />
          </button>
        </div>
        <div className="vantoris-card p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Application Not Approved</h2>
          <p className="text-[#AAB4C3] text-sm mb-4">{application.admin_notes || 'Your application was not approved at this time.'}</p>
        </div>
      </div>
    );
  }

  // Approved member dashboard
  return (
    <div className="px-5 pt-6 vantoris-scroll" {...containerProps}>
      <PullIndicator />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldLogo size={32} />
          <div>
            <p className="text-[#AAB4C3] text-xs">{greeting},</p>
            <h1 className="text-white font-bold text-lg">{firstName}</h1>
          </div>
        </div>
        <button onClick={() => navigate('/messages')} className="relative p-2">
          <Bell size={20} className="text-[#AAB4C3]" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-crimson text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="vantoris-card p-6 mb-5 relative overflow-hidden">
        <div className="vantoris-balance-glow absolute inset-0" />
        <div className="relative z-10">
          <p className="text-[#AAB4C3] text-xs uppercase tracking-widest mb-1">Total Balance</p>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-1">
            {formatCurrency(totalBalance)}
          </h2>
          <p className="text-[#AAB4C3] text-xs">{accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="vantoris-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-olive/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-white font-semibold text-lg">{accounts.filter(a => a.status === 'active').length}</p>
          <p className="text-[#AAB4C3] text-[11px]">Active Accounts</p>
        </div>
        <div className="vantoris-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-brass/15 flex items-center justify-center">
              <Clock size={14} className="text-brass" />
            </div>
          </div>
          <p className="text-white font-semibold text-lg">{unreadCount}</p>
          <p className="text-[#AAB4C3] text-[11px]">Unread Messages</p>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => navigate('/services')} className="vantoris-card p-4 text-left hover:border-brass/30 transition-all">
          <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center mb-2">
            <Briefcase size={20} className="text-brass" />
          </div>
          <p className="text-white font-medium text-sm">Services</p>
          <p className="text-[#AAB4C3] text-xs">Accounts & cards</p>
        </button>
        <button onClick={() => navigate('/advisor')} className="vantoris-card p-4 text-left hover:border-brass/30 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-2">
            <Sparkles size={20} className="text-purple-400" />
          </div>
          <p className="text-white font-medium text-sm">Advisor</p>
          <p className="text-[#AAB4C3] text-xs">AI guidance</p>
        </button>
      </div>

      {/* My Accounts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">My Accounts</h3>
          <button onClick={() => navigate('/accounts')} className="text-brass text-xs font-medium">View All</button>
        </div>
        {accounts.map(account => (
          <button
            key={account.id}
            onClick={() => navigate(`/accounts/${account.id}`)}
            className="vantoris-card p-4 mb-2 w-full text-left flex items-center justify-between hover:border-brass/30 transition-all"
          >
            <div>
              <p className="text-white font-medium text-sm">{account.account_name}</p>
              <p className="text-[#AAB4C3] text-xs">{account.account_number}</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <p className="text-white font-semibold">{formatCurrency(account.balance)}</p>
              <ChevronRight size={16} className="text-[#AAB4C3]" />
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="text-[#AAB4C3] text-sm text-center py-6">No transactions yet</p>
        ) : (
          transactions.slice(0, 5).map(txn => (
            <div key={txn.id} className="flex items-center justify-between py-3 border-b border-[#242D38]/60 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  txn.type === 'deposit' || txn.type === 'opening_balance'
                    ? 'bg-olive/20'
                    : txn.type === 'withdrawal'
                    ? 'bg-crimson/15'
                    : 'bg-brass/15'
                }`}>
                  {txn.type === 'deposit' || txn.type === 'opening_balance'
                    ? <ArrowDownLeft size={14} className="text-emerald-400" />
                    : txn.type === 'withdrawal'
                    ? <ArrowUpRight size={14} className="text-red-400" />
                    : <TrendingUp size={14} className="text-brass" />
                  }
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{txn.description || txn.type}</p>
                  <p className="text-[#AAB4C3] text-[11px]">
                    {new Date(txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className={`font-semibold text-sm ${
                txn.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {txn.type === 'withdrawal' ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Support */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Support</h3>
        <div className="grid grid-cols-2 gap-3">
          <a href="mailto:support@vantoris.com" className="vantoris-card p-4 text-left hover:border-brass/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-2">
              <Mail size={20} className="text-blue-400" />
            </div>
            <p className="text-white font-medium text-sm">Email</p>
            <p className="text-[#AAB4C3] text-xs">support@vantoris.com</p>
          </a>
          <a href={whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I need assistance.')} target="_blank" rel="noopener noreferrer" className="vantoris-card p-4 text-left hover:border-brass/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-2">
              <MessageCircle size={20} className="text-emerald-400" />
            </div>
            <p className="text-white font-medium text-sm">WhatsApp</p>
            <p className="text-[#AAB4C3] text-xs">Chat with us</p>
          </a>
        </div>
      </div>
    </div>
  );
}