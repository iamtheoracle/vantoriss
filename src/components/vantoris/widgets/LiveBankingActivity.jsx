import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Radio } from 'lucide-react';

export default function LiveBankingActivity() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const txns = await base44.entities.Transaction.list('-created_date', 8);
        setTransactions(txns);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type === 'create') {
        setTransactions(prev => [event.data, ...prev].slice(0, 8));
      }
    });
    return unsub;
  }, []);

  if (loading) return <div className="vantoris-glass-premium p-5 h-64 vantoris-shimmer rounded-2xl" />;

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-mint" />
          <h3 className="text-foreground font-semibold text-sm">Live Banking Activity</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-mint font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          LIVE
        </span>
      </div>
      {transactions.length === 0 ? (
        <div className="text-center py-6">
          <TrendingUp size={24} className="text-gray/30 mx-auto mb-2" />
          <p className="text-gray text-xs">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-0">
          {transactions.map(txn => (
            <div key={txn.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                txn.type === 'deposit' || txn.type === 'opening_balance' ? 'bg-mint/10' : 'bg-crimson/10'
              }`}>
                {txn.type === 'deposit' || txn.type === 'opening_balance'
                  ? <ArrowDownLeft size={13} className="text-mint" />
                  : <ArrowUpRight size={13} className="text-crimson" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-xs font-medium truncate">{txn.description || txn.type}</p>
                <p className="text-gray/60 text-[10px]">{new Date(txn.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className={`text-xs font-bold ${txn.type === 'withdrawal' ? 'text-crimson' : 'text-mint'}`}>
                {txn.type === 'withdrawal' ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}