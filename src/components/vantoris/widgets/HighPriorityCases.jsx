import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Snowflake, ShieldX } from 'lucide-react';

const HIGH_VALUE_THRESHOLD = 10000;

export default function HighPriorityCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [withdrawals, accounts, apps] = await Promise.all([
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }),
          base44.entities.Account.list('-created_date', 200),
          base44.entities.Application.list('-created_date', 50),
        ]);
        const highValue = withdrawals
          .filter(w => Math.abs(w.amount) >= HIGH_VALUE_THRESHOLD)
          .slice(0, 5)
          .map(w => ({ id: w.id, type: 'High-Value Withdrawal', detail: formatCurrency(Math.abs(w.amount)), icon: ArrowUpRight, accent: 'text-crimson', path: '/operations/withdrawals' }));
        const frozen = accounts
          .filter(a => a.status === 'frozen')
          .slice(0, 3)
          .map(a => ({ id: a.id, type: 'Frozen Account', detail: a.account_name, icon: Snowflake, accent: 'text-crimson', path: '/operations/accounts' }));
        const rejectedKyc = apps
          .filter(a => a.kyc_status === 'rejected')
          .slice(0, 3)
          .map(a => ({ id: a.id, type: 'Rejected KYC', detail: a.full_name, icon: ShieldX, accent: 'text-crimson', path: '/operations/kyc' }));
        setCases([...highValue, ...frozen, ...rejectedKyc].slice(0, 8));
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="vantoris-glass-premium p-5 h-48 vantoris-shimmer rounded-2xl" />;

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-crimson" />
        <h3 className="text-foreground font-semibold text-sm">High Priority Cases</h3>
        {cases.length > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-crimson/10 text-crimson text-[10px] font-bold border border-crimson/20">{cases.length}</span>}
      </div>
      {cases.length === 0 ? (
        <div className="text-center py-6">
          <ShieldX size={24} className="text-mint/30 mx-auto mb-2" />
          <p className="text-gray text-xs">No high-priority cases</p>
        </div>
      ) : (
        <div className="space-y-0">
          {cases.map(c => {
            const Icon = c.icon;
            return (
              <Link key={`${c.id}-${c.type}`} to={c.path} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-all">
                <Icon size={14} className={c.accent} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-xs font-medium">{c.type}</p>
                  <p className="text-gray text-[11px] truncate">{c.detail}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}