import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, ChevronRight, Landmark } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import SmartEmptyState from './SmartEmptyState';
import SectionTitle from './SectionTitle';

const ACCOUNT_ICONS = {
  Checking: Wallet,
  Savings: Landmark,
  'Money Market': TrendingUp,
  CD: Landmark,
  Joint: Wallet,
  Business: Landmark,
};

export default function FinancialOverview({ accounts, tradingAccounts }) {
  const hasAccounts = accounts.length > 0;
  const hasTrading = tradingAccounts.length > 0;

  if (!hasAccounts && !hasTrading) {
    return (
      <div className="mb-4">
        <SectionTitle icon={Wallet} title="Financial Overview" />
        <SmartEmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Open your first account to start your financial journey with Vantoris."
          actionLabel="Open Account"
          actionTo="/apply"
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <SectionTitle icon={Wallet} title="Financial Overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acct, i) => {
          const Icon = ACCOUNT_ICONS[acct.account_type] || Wallet;
          return (
            <motion.div
              key={acct.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AccountCard account={acct} Icon={Icon} />
            </motion.div>
          );
        })}
        {tradingAccounts.map((acct, i) => (
          <motion.div
            key={acct.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (accounts.length + i) * 0.05 }}
          >
            <TradingCard account={acct} />
          </motion.div>
        ))}
      </div>
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
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          isActive ? 'bg-mint/10 text-mint' : 'bg-crimson/10 text-crimson'
        }`}>
          {account.status}
        </span>
      </div>
      <p className="text-gray text-[10px] uppercase tracking-wider font-medium">{account.account_type}</p>
      <p className="text-foreground font-bold text-xl">{formatCurrency(account.balance || 0)}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-gray text-[10px] font-mono">••••{account.account_number?.slice(-4) || '----'}</span>
        <span className="text-navy text-[10px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          View <ChevronRight size={11} />
        </span>
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
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          account.status === 'active' ? 'bg-mint/10 text-mint' : 'bg-crimson/10 text-crimson'
        }`}>
          {account.status}
        </span>
      </div>
      <p className="text-gray text-[10px] uppercase tracking-wider font-medium">{account.account_type} Trading</p>
      <p className="text-foreground font-bold text-xl">{formatCurrency(account.balance || 0)}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-gray text-[10px] font-mono">Equity: {formatCurrency(account.equity || 0)}</span>
        <span className="text-brass text-[10px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          Trade <ChevronRight size={11} />
        </span>
      </div>
    </Link>
  );
}