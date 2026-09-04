import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, CreditCard, Eye, EyeOff, TrendingUp, Wallet } from 'lucide-react';
import { isProviderBackedAccount } from '@/lib/unitBanking';

const isProviderBackedCard = (card = {}) => card.provider === 'unit' && Boolean(card.provider_card_id);
const isProviderBackedPortfolio = (portfolio = {}) => Boolean(portfolio.provider && portfolio.provider_portfolio_id);

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
          setAccounts((a || []).filter(isProviderBackedAccount));
          setCards((c || []).filter(isProviderBackedCard));
          setPortfolios((p || []).filter(isProviderBackedPortfolio));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const balance = useMemo(() => accounts.reduce((s, a) => s + Number(a.available_balance ?? a.balance ?? 0), 0), [accounts]);
  const wealth = useMemo(() => portfolios.reduce((s, p) => s + Number(p.total_value || 0), 0), [portfolios]);
  const firstName = user?.full_name?.trim()?.split(/\s+/)?.[0] || 'Member';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;

  return (
    <div className="px-5 pt-6 pb-28 max-w-[430px] mx-auto">
      <header className="flex items-start justify-between mb-7">
        <div>
          <p className="text-gray text-sm">{greeting}</p>
          <h1 className="text-3xl font-bold mt-1 tracking-tight">{firstName}</h1>
          <p className="text-gray text-sm mt-1">Your Vantoris relationship at a glance.</p>
        </div>
        <button onClick={() => navigate('/messages')} aria-label="Notifications and messages" className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center shadow-sm"><Bell size={19} /></button>
      </header>

      {cards.length > 0 ? (
        <section className="space-y-3 mb-7">
          {cards.map(card => (
            <button key={card.id} onClick={() => navigate('/accounts')} className="relative overflow-hidden rounded-[30px] p-6 min-h-[205px] w-full text-left text-white shadow-2xl bg-gradient-to-br from-[#0A2140] via-[#12355D] to-[#07162A]">
              <div className="absolute -right-14 -top-14 w-44 h-44 rounded-full border border-brass/20" />
              <div className="absolute -left-16 -bottom-20 w-44 h-44 rounded-full bg-white/[0.03]" />
              <div className="relative z-10 flex justify-between items-start"><div><span className="font-semibold tracking-[0.2em] text-sm">VANTORIS</span><p className="text-[9px] text-white/45 uppercase tracking-[0.14em] mt-1">Private Banking</p></div><CreditCard size={23} className="text-white/70" /></div>
              <div className="relative z-10 mt-12 text-xl tracking-[0.23em]">•••• •••• •••• {card.last4}</div>
              <div className="relative z-10 mt-7 flex justify-between"><div><p className="text-[9px] text-white/45 uppercase">Cardholder</p><p className="text-xs mt-1 uppercase">{card.cardholder_name}</p></div><div><p className="text-[9px] text-white/45 uppercase">Type</p><p className="text-xs mt-1 capitalize">{card.card_type}</p></div></div>
            </button>
          ))}
        </section>
      ) : (
        <button onClick={() => navigate('/services')} className="w-full text-left rounded-[30px] bg-gradient-to-br from-[#0A2140] to-[#193D68] text-white p-6 mb-7 shadow-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Vantoris Card</p>
          <h2 className="text-2xl font-semibold mt-2">No live card connected</h2>
          <p className="text-sm text-white/65 mt-2">A card will appear here only after a real provider-backed card is issued.</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brass mt-5">View card services <ChevronRight size={16} /></span>
        </button>
      )}

      <section className="rounded-[28px] bg-white border border-border p-5 shadow-sm mb-5">
        <div className="flex justify-between items-center"><div><p className="text-xs uppercase tracking-[0.16em] text-gray">Available balance</p><p className="text-3xl font-semibold mt-1">{hidden ? '••••••' : formatCurrency(balance)}</p></div><button onClick={() => setHidden(v => !v)} aria-label={hidden ? 'Show balances' : 'Hide balances'} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">{hidden ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
        <div className="mt-5 pt-4 border-t border-border/70 flex items-center justify-between text-sm"><span className="text-gray">{accounts.length} live account{accounts.length === 1 ? '' : 's'}</span><button onClick={() => navigate('/accounts')} className="font-semibold text-brass inline-flex items-center gap-1">Open Accounts <ChevronRight size={15} /></button></div>
      </section>

      {wealth > 0 && <section className="rounded-[28px] bg-[#0B2342] text-white p-5 shadow-xl mb-5"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-white/50">Private wealth</p><h2 className="text-xl font-semibold mt-1">Portfolio</h2></div><TrendingUp size={20} className="text-brass" /></div><p className="text-3xl font-semibold mt-5">{hidden ? '••••••' : formatCurrency(wealth)}</p><p className="text-xs text-white/55 mt-1">Investment value across connected provider portfolios</p><button onClick={() => navigate('/accounts')} className="mt-5 text-sm font-semibold text-brass inline-flex items-center gap-1">View in Accounts <ChevronRight size={15} /></button></section>}

      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/accounts')} className="rounded-[24px] bg-white border border-border p-5 text-left shadow-sm"><Wallet size={21} className="text-brass" /><p className="font-semibold mt-4">Accounts</p><p className="text-xs text-gray mt-1">Balances, cards, payments and transfers.</p></button>
        <button onClick={() => navigate('/discovery')} className="rounded-[24px] bg-white border border-border p-5 text-left shadow-sm"><TrendingUp size={21} className="text-brass" /><p className="font-semibold mt-4">Discovery</p><p className="text-xs text-gray mt-1">Verified opportunities, needs and intelligence.</p></button>
      </section>
    </div>
  );
}
