import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function TreasuryPosition() {
  const [data, setData] = useState({ aum: 0, deposits: 0, withdrawals: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [accounts, transactions] = await Promise.all([
          base44.entities.Account.list('-created_date', 200),
          base44.entities.Transaction.list('-created_date', 200),
        ]);
        const aum = accounts.reduce((s, a) => s + (a.balance || 0), 0);
        const deposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
        const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
        setData({ aum, deposits, withdrawals, net: deposits - withdrawals });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="vantoris-glass-premium p-5 h-40 vantoris-shimmer rounded-2xl" />;

  return (
    <div className="vantoris-glass-premium p-5 xl:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={16} className="text-navy" />
        <h3 className="text-foreground font-semibold text-sm">Treasury Position</h3>
      </div>
      <div className="mb-4">
        <p className="text-gray text-[10px] uppercase tracking-wider mb-1">Assets Under Management</p>
        <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(data.aum)}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp size={12} className="text-mint" />
            <p className="text-gray text-[10px]">Inflows</p>
          </div>
          <p className="text-mint text-sm font-bold">{formatCurrency(data.deposits)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown size={12} className="text-crimson" />
            <p className="text-gray text-[10px]">Outflows</p>
          </div>
          <p className="text-crimson text-sm font-bold">{formatCurrency(data.withdrawals)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <DollarSign size={12} className="text-brass" />
            <p className="text-gray text-[10px]">Net Position</p>
          </div>
          <p className={`text-sm font-bold ${data.net >= 0 ? 'text-brass' : 'text-crimson'}`}>{formatCurrency(data.net)}</p>
        </div>
      </div>
    </div>
  );
}