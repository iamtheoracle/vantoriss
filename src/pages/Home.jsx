import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, CreditCard, Eye, EyeOff, TrendingUp } from 'lucide-react';
import PrimaryActions from '@/components/vantoris/home/PrimaryActions';
import DashboardModules from '@/components/vantoris/home/DashboardModules';

// Home / Dashboard — Spec §4.
// Shows the user's real financial and service state.
// No fabricated activity in empty states.
export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const [a, c, p] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }, '-created_date').catch(() => []),
          base44.entities.PaymentCard.filter({ user_id: me.id, status: 'active' }, '-created_date').catch(() => []),
          base44.entities.InvestmentPortfolio.filter({ user_id: me.id }, '-created_date').catch(() => []),
        ]);
        if (!cancelled) {
          setUser(me);
          setAccounts(a);
          setCards(c);
          setPortfolios(p);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const balance = useMemo(() => accounts.reduce((s, a) => s + (a.balance || 0), 0), [accounts]);
  const wealth = useMemo(() => portfolios.reduce((s, p) => s + (p.total_value || 0), 0), [portfolios]);
  const firstName = user?.full_name?.trim()?.split(/\s+/)?.[0] || 'Member';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const hasAccounts = accounts.length > 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-5 pt-6 pb-28 max-w-[430px] mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between mb-6">
        <div>
          <p className="text-gray text-sm">{greeting}</p>
          <h1 className="text-3xl font-bold mt-1 tracking-tight">{firstName}</h1>
          <p className="text-gray text-sm mt-1">Your money. Your travel. Your next move.</p>
        </div>
        <button onClick={() => navigate('/messages')} aria-label="Notifications and messages" className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
          <Bell size={19} />
        </button>
      </header>

      {/* USD Account Card — real balance only */}
      <section className="rounded-[28px] bg-white border border-border p-5 shadow-sm mb-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gray">Available balance</p>
            <p className="text-3xl font-semibold mt-1">{hidden ? '••••••' : formatCurrency(balance)}</p>
          </div>
          <button onClick={() => setHidden(v => !v)} aria-label={hidden ? 'Show balances' : 'Hide balances'} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        {hasAccounts && (
          <div className="mt-4 pt-4 border-t border-border/70 flex items-center justify-between text-sm">
            <span className="text-gray">{accounts.length} account{accounts.length === 1 ? '' : 's'}</span>
            <button onClick={() => navigate('/accounts')} className="font-semibold text-brass inline-flex items-center gap-1">Account details <ChevronRight size={15} /></button>
          </div>
        )}
        {!hasAccounts && (
          <p className="text-xs text-gray mt-4 pt-4 border-t border-border/70">No accounts yet. Open an account to get started.</p>
        )}
      </section>

      {/* Primary Actions — Send, Receive, Add funds, Activity */}
      <div className="mb-6">
        <PrimaryActions />
      </div>

      {/* Private Wealth — only if portfolios exist */}
      {wealth > 0 && (
        <section className="rounded-[28px] bg-[#0B2342] text-white p-5 shadow-xl mb-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/50">Private wealth</p>
              <h2 className="text-xl font-semibold mt-1">Portfolio</h2>
            </div>
            <TrendingUp size={20} className="text-brass" />
          </div>
          <p className="text-3xl font-semibold mt-5">{hidden ? '••••••' : formatCurrency(wealth)}</p>
          <p className="text-xs text-white/55 mt-1">Investment value across your portfolios</p>
          <button onClick={() => navigate('/investment')} className="mt-5 text-sm font-semibold text-brass inline-flex items-center gap-1">View investments <ChevronRight size={15} /></button>
        </section>
      )}

      {/* Personalized Modules — real state or truthful unavailable */}
      <DashboardModules accounts={accounts} cards={cards} portfolios={portfolios} />
    </div>
  );
}