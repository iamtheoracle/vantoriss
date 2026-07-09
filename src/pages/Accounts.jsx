import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { Wallet, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Accounts</h1>
      <p className="text-gray text-sm mb-6">Total Balance: <span className="text-white font-semibold">{formatCurrency(totalBalance)}</span></p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['All', 'Personal', 'Joint', 'Business', 'Organization'].map(tab => (
          <span key={tab} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate/50 text-gray whitespace-nowrap">
            {tab}
          </span>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="vantoris-card p-8 text-center">
          <Wallet size={32} className="text-gray mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No Accounts Yet</p>
          <p className="text-gray text-sm">Your accounts will appear here once approved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => (
            <button
              key={account.id}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="vantoris-card p-5 w-full text-left hover:border-brass/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
                    <Wallet size={18} className="text-brass" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{account.account_name}</p>
                    <p className="text-gray text-xs font-mono">{account.account_number}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#AAB4C3]" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#AAB4C3] text-[11px] uppercase tracking-wider">Available Balance</p>
                  <p className="text-white text-xl font-bold">{formatCurrency(account.balance)}</p>
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