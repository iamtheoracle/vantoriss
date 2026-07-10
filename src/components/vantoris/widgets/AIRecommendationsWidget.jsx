import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AIRecommendationsWidget() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [withdrawals, apps, accounts, transactions] = await Promise.all([
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }),
          base44.entities.Application.list('-created_date', 50),
          base44.entities.Account.list('-created_date', 200),
          base44.entities.Transaction.list('-created_date', 50),
        ]);
        const tips = [];
        const pendingWds = withdrawals.length;
        const largeWds = withdrawals.filter(w => Math.abs(w.amount) >= 10000).length;
        const pendingApps = apps.filter(a => a.application_status === 'pending').length;
        const frozenAccts = accounts.filter(a => a.status === 'frozen').length;
        const totalVolume = transactions.reduce((s, t) => s + Math.abs(t.amount || 0), 0);

        if (pendingWds > 0) tips.push({ text: `${pendingWds} withdrawal${pendingWds > 1 ? 's' : ''} awaiting approval`, priority: largeWds > 0 ? 'high' : 'medium', path: '/operations/withdrawals' });
        if (pendingApps > 0) tips.push({ text: `${pendingApps} application${pendingApps > 1 ? 's' : ''} pending review`, priority: 'medium', path: '/operations/applications' });
        if (frozenAccts > 0) tips.push({ text: `${frozenAccts} account${frozenAccts > 1 ? 's' : ''} currently frozen`, priority: 'high', path: '/operations/accounts' });
        if (totalVolume > 0) tips.push({ text: `${formatCurrency(totalVolume)} in recent transaction volume`, priority: 'low', path: '/operations/finance' });
        if (tips.length === 0) tips.push({ text: 'All operations running smoothly. No immediate actions required.', priority: 'low', path: '/operations' });

        setInsights(tips.slice(0, 5));
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="vantoris-glass-premium p-5 h-48 vantoris-shimmer rounded-2xl" />;

  const priorityConfig = {
    high: { color: 'text-crimson', bg: 'bg-crimson/10', border: 'border-crimson/20', icon: AlertTriangle },
    medium: { color: 'text-brass', bg: 'bg-brass/10', border: 'border-brass/20', icon: TrendingUp },
    low: { color: 'text-mint', bg: 'bg-mint/10', border: 'border-mint/20', icon: Sparkles },
  };

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-brass" />
        <h3 className="text-foreground font-semibold text-sm">AI Recommendations</h3>
      </div>
      <div className="space-y-2">
        {insights.map((tip, i) => {
          const cfg = priorityConfig[tip.priority];
          const Icon = cfg.icon;
          return (
            <Link key={i} to={tip.path} className="flex items-start gap-3 p-2.5 -mx-1 rounded-lg hover:bg-slate-50 transition-all group">
              <div className={`w-6 h-6 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={11} className={cfg.color} />
              </div>
              <p className="text-foreground text-xs flex-1 leading-relaxed">{tip.text}</p>
              <ArrowUpRight size={12} className="text-gray/30 group-hover:text-brass transition-colors flex-shrink-0 mt-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}