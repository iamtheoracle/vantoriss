import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, ChevronRight, Landmark, Heart, Users, Package, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import OpportunityCard from './OpportunityCard';
import SectionTitle from './SectionTitle';

const ACCOUNT_ICONS = {
  Checking: Wallet,
  Savings: Landmark,
  'Money Market': TrendingUp,
  CD: Landmark,
  Joint: Wallet,
  Business: Landmark,
};

export default function RelationshipOverview({ accounts, tradingAccounts, heroProfile, heroRequests }) {
  const hasAccounts = accounts.length > 0;
  const hasTrading = tradingAccounts.length > 0;
  const hasHeroBox = !!heroProfile;
  const hasAny = hasAccounts || hasTrading || hasHeroBox;

  return (
    <div className="mb-4">
      <SectionTitle icon={Wallet} title="Your Relationship" />

      {!hasAny ? (
        <OpportunityCard
          icon={Wallet}
          title="Begin Your Banking Relationship"
          description="Open your first account with Vantoris to access premium financial services."
          actions={[
            { label: 'Open Account', to: '/apply', primary: true },
            { label: 'Learn More', to: '/services' },
            { label: 'Schedule Advisor', to: '/advisor' },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((acct, i) => {
            const Icon = ACCOUNT_ICONS[acct.account_type] || Wallet;
            return (
              <motion.div key={acct.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <AccountCard account={acct} Icon={Icon} />
              </motion.div>
            );
          })}
          {tradingAccounts.map((acct, i) => (
            <motion.div key={acct.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (accounts.length + i) * 0.05 }}>
              <TradingCard account={acct} />
            </motion.div>
          ))}
          {hasHeroBox && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (accounts.length + tradingAccounts.length) * 0.05 }}>
              <HeroBoxCard heroProfile={heroProfile} heroRequests={heroRequests} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, Icon }) {
  const isActive = account.status === 'active';
  return (
    <Link to={`/accounts/${account.id}`} className="block vantoris-glass-premium p-4 hover:shadow-float transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center">
          <Icon size={18} className="text-navy" />
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isActive ? 'bg-mint/10 text-mint' : 'bg-crimson/10 text-crimson'}`}>
          {account.status}
        </span>
      </div>
      <p className="text-gray text-[10px] uppercase tracking-wider font-medium mb-0.5">{account.account_type}</p>
      <p className="text-foreground font-bold text-2xl tracking-tight">{formatCurrency(account.balance || 0)}</p>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-gray text-[10px] font-mono tracking-wider">••••{account.account_number?.slice(-4) || '----'}</span>
        <span className="text-navy text-[10px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">View <ChevronRight size={11} /></span>
      </div>
    </Link>
  );
}

function TradingCard({ account }) {
  return (
    <Link to="/trading" className="block vantoris-glass-premium p-4 hover:shadow-float transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
          <TrendingUp size={18} className="text-brass" />
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${account.status === 'active' ? 'bg-mint/10 text-mint' : 'bg-crimson/10 text-crimson'}`}>
          {account.status}
        </span>
      </div>
      <p className="text-gray text-[10px] uppercase tracking-wider font-medium mb-0.5">{account.account_type} Trading</p>
      <p className="text-foreground font-bold text-2xl tracking-tight">{formatCurrency(account.balance || 0)}</p>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-gray text-[10px] font-mono">Equity: {formatCurrency(account.equity || 0)}</span>
        <span className="text-brass text-[10px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Trade <ChevronRight size={11} /></span>
      </div>
    </Link>
  );
}

function HeroBoxCard({ heroProfile, heroRequests }) {
  const pendingCount = heroRequests?.filter(r => r.status === 'pending' || r.status === 'under_review').length || 0;
  const metrics = [
    { icon: Users, label: 'Heroes', value: heroProfile.heroes_supported || 0 },
    { icon: Package, label: 'Delivered', value: heroProfile.packages_delivered || 0 },
    { icon: Gift, label: 'Contributed', value: formatCurrency(heroProfile.total_contribution || 0) },
  ];

  return (
    <Link to="/herobox" className="block vantoris-glass-premium p-4 hover:shadow-float transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brass/15 to-brass/5 flex items-center justify-center">
          <Heart size={18} className="text-brass" />
        </div>
        {pendingCount > 0 && <span className="px-1.5 py-0.5 bg-brass/15 text-brass rounded text-[9px] font-bold">{pendingCount} pending</span>}
      </div>
      <p className="text-gray text-[10px] uppercase tracking-wider font-medium mb-0.5">Community Support</p>
      <p className="text-foreground font-bold text-lg capitalize">{heroProfile.role}</p>
      <div className="flex items-center gap-3 mt-2.5">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center gap-1">
            <m.icon size={11} className="text-navy/50" />
            <span className="text-gray text-[10px] font-medium">{m.value}</span>
          </div>
        ))}
        <ChevronRight size={14} className="text-gray/40 group-hover:text-navy transition-colors ml-auto" />
      </div>
    </Link>
  );
}