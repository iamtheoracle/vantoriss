import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { Wallet, ChevronRight, Plus } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';

const ACCOUNT_TYPES = ['All', 'Personal', 'Joint', 'Business', 'Organization'];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const accts = await base44.entities.Account.filter({ user_id: me.id });
      setAccounts(accts);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const filteredAccounts = activeFilter === 'All'
    ? accounts
    : accounts.filter(a => a.account_type === activeFilter);

  return (
    <div className="px-5 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Accounts</h1>
        <p className="text-gray text-sm">Total Balance: <span className="text-foreground font-semibold">{formatCurrency(totalBalance)}</span></p>
      </div>

      {/* Filter tabs — functional */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ACCOUNT_TYPES.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === tab
                ? 'bg-brass text-white border-brass'
                : 'bg-white text-gray border-slate-200 hover:border-brass/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <Wallet size={32} className="text-gray mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">{accounts.length === 0 ? 'No Accounts Yet' : 'No Matching Accounts'}</p>
          <p className="text-gray text-sm">{accounts.length === 0 ? 'Your accounts will appear here once approved.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAccounts.map(account => (
            <button
              key={account.id}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 w-full text-left hover:border-brass/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
                    <Wallet size={18} className="text-brass" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{account.account_name}</p>
                    <p className="text-gray text-xs font-mono">{account.account_number}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray/40" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray text-[11px] uppercase tracking-wider">Available Balance</p>
                  <p className="text-foreground text-xl font-bold">{formatCurrency(account.balance)}</p>
                </div>
                <StatusBadge status={account.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}