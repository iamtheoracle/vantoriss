import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import StatusBadge from '@/components/vantoris/StatusBadge';
import OnboardingSupport from '@/components/vantoris/OnboardingSupport';
import OpeningContribution from '@/components/vantoris/OpeningContribution';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Bell, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import FinancialHero from '@/components/vantoris/home/FinancialHero';
import AIConcierge from '@/components/vantoris/home/AIConcierge';
import YourServices, { getAvailableServices } from '@/components/vantoris/home/YourServices';
import DiscoverSection from '@/components/vantoris/home/DiscoverSection';
import AccountsSection from '@/components/vantoris/home/AccountsSection';
import ActivityTimeline from '@/components/vantoris/home/ActivityTimeline';

export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [heroBoxProfile, setHeroBoxProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hideBalance, setHideBalance] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [apps, accts, notifs, pendingWrs, hbProfiles] = await Promise.all([
      base44.entities.Application.filter({ user_id: me.id }),
      base44.entities.Account.filter({ user_id: me.id }),
      base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 5),
      base44.entities.WithdrawalRequest.filter({ user_id: me.id, status: 'pending' }).catch(() => []),
      base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []),
    ]);
    setApplication(apps[0] || null);
    setAccounts(accts);
    setNotifications(notifs);
    setPendingWithdrawals(pendingWrs);
    setHeroBoxProfile(hbProfiles[0] || null);
    if (accts.length > 0) {
      const [txns, hbActs] = await Promise.all([
        base44.entities.Transaction.filter(
          { account_id: accts.map(a => a.id) },
          '-created_date',
          20
        ),
        base44.entities.HeroBoxActivity.filter({ user_id: me.id }, '-created_date', 10).catch(() => []),
      ]);
      const hbItems = hbActs.map(a => ({
        id: `hb_${a.id}`,
        type: 'adjustment',
        amount: a.amount || 0,
        description: a.title,
        transaction_date: a.created_date,
        created_date: a.created_date,
        balance_after: null,
        reference: 'HeroBox',
      }));
      const merged = [...txns, ...hbItems].sort((a, b) =>
        new Date(b.transaction_date || b.created_date) - new Date(a.transaction_date || a.created_date)
      );
      setTransactions(merged);
    }
  }, []);

  useEffect(() => {
    loadData().catch(e => {
      console.error(e);
      setLoadError('Unable to load your dashboard. Please check your connection and try again.');
      toast({ title: 'Dashboard load failed', description: e.message || 'Unable to load your data.', variant: 'destructive' });
    }).finally(() => {
      setLoading(false);
    });
  }, [loadData]);

  function retryLoad() {
    setLoadError('');
    setLoading(true);
    loadData().catch(e => {
      console.error(e);
      setLoadError('Unable to load your dashboard. Please check your connection and try again.');
      toast({ title: 'Dashboard load failed', description: e.message || 'Unable to load your data.', variant: 'destructive' });
    }).finally(() => setLoading(false));
  }

  const { containerProps, PullIndicator } = usePullToRefresh(loadData);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-5 pt-6 min-h-screen flex flex-col items-center justify-center">
        <div className="vantoris-glass-premium p-8 text-center w-full max-w-sm">
          <AlertCircle size={32} className="text-crimson mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-gray text-sm mb-6">{loadError}</p>
          <button onClick={retryLoad} className="w-full py-3 bg-brass text-white font-semibold rounded-xl hover:bg-brass/90 transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const pendingAmount = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const availableBalance = totalBalance - pendingAmount;
  const firstName = user?.full_name?.split(' ')[0] || 'Member';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const unreadCount = notifications.filter(n => !n.read).length;

  // Onboarding: no application yet
  if (!application) {
    return (
      <div className="px-5 pt-6 vantoris-scroll" {...containerProps}>
        <PullIndicator />
        <div className="flex items-center justify-between mb-8">
          <ShieldLogo size={32} />
          <button onClick={() => navigate('/messages')} className="relative p-2">
            <Bell size={20} className="text-gray" />
          </button>
        </div>
        <div className="vantoris-glass-premium p-8 text-center">
          <ShieldLogo size={64} className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Vantoris</h2>
          <p className="text-gray text-sm mb-6 leading-relaxed">
            A secure platform for private institutions and approved members to manage capital with clarity and confidence.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3.5 bg-brass text-white font-semibold rounded-xl hover:bg-brass/90 transition-all"
          >
            Apply for Membership
          </button>
        </div>
        <OnboardingSupport />
      </div>
    );
  }

  // Application pending or KYC not approved
  if (application.application_status === 'pending') {
    return (
      <div className="px-5 pt-6 vantoris-scroll" {...containerProps}>
        <PullIndicator />
        <div className="flex items-center justify-between mb-8">
          <ShieldLogo size={32} />
          <button onClick={() => navigate('/messages')} className="relative p-2">
            <Bell size={20} className="text-gray" />
          </button>
        </div>
        <div className="vantoris-glass-premium p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-brass" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Application Under Review</h2>
          <p className="text-gray text-sm mb-4 leading-relaxed">
            Your {application.account_type} account application is being reviewed. You will be notified once approved.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-gray">KYC Status:</span>
            <StatusBadge status={application.kyc_status} />
          </div>
          {application.kyc_status === 'not_started' && (
            <button
              onClick={() => navigate('/apply/kyc')}
              className="mt-6 w-full py-3 bg-brass text-white font-semibold rounded-xl hover:bg-brass/90 transition-all"
            >
              Complete Identity Verification
            </button>
          )}
          {application.kyc_status === 'approved' && (
            <OpeningContribution application={application} onUpdate={() => loadData()} />
          )}
          <OnboardingSupport />
        </div>
      </div>
    );
  }

  if (application.application_status === 'rejected') {
    return (
      <div className="px-5 pt-6 vantoris-scroll" {...containerProps}>
        <PullIndicator />
        <div className="flex items-center justify-between mb-8">
          <ShieldLogo size={32} />
          <button onClick={() => navigate('/messages')} className="relative p-2">
            <Bell size={20} className="text-gray" />
          </button>
        </div>
        <div className="vantoris-glass-premium p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Application Not Approved</h2>
          <p className="text-gray text-sm mb-4">{application.admin_notes || 'Your application was not approved at this time.'}</p>
        </div>
        <OnboardingSupport />
      </div>
    );
  }

  // Compute financial metrics
  const netWorth = totalBalance;

  // Daily P&L from today's transactions
  const today = new Date().toLocaleDateString('en-US');
  const dailyChange = transactions
    .filter(t => new Date(t.transaction_date || t.created_date).toLocaleDateString('en-US') === today)
    .reduce((sum, t) => {
      if (t.type === 'deposit' || t.type === 'opening_balance' || t.type === 'interest') return sum + (t.amount || 0);
      if (t.type === 'withdrawal' || t.type === 'fee') return sum - (t.amount || 0);
      return sum;
    }, 0);

  // Services the user has — used to filter Discover section
  const availableServiceIds = getAvailableServices(accounts, heroBoxProfile).map(s => s.id);

  // Approved member dashboard — financial headquarters
  return (
    <div className="px-5 pt-6 vantoris-scroll" {...containerProps}>
      <PullIndicator />

      {/* === Hero: Financial Summary === */}
      <FinancialHero
        firstName={firstName}
        greeting={greeting}
        netWorth={netWorth}
        availableCash={availableBalance}
        dailyChange={dailyChange}
        hideBalance={hideBalance}
        onToggleBalance={() => setHideBalance(!hideBalance)}
        unreadCount={unreadCount}
      />

      {/* === AI Concierge === */}
      <AIConcierge firstName={firstName} />

      {/* === Your Services (only what the user has) === */}
      <YourServices
        accounts={accounts}
        transactions={transactions}
        heroboxProfile={heroBoxProfile}
      />

      {/* === Discover (services the user doesn't have yet) === */}
      <DiscoverSection hiddenServiceIds={availableServiceIds} />

      {/* === Accounts (only existing) === */}
      <AccountsSection accounts={accounts} hideBalance={hideBalance} />

      {/* === Recent Activity (unified timeline) === */}
      <ActivityTimeline transactions={transactions} />
    </div>
  );
}