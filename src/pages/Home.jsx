import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Bell, ChevronRight, CreditCard, Eye, EyeOff, Newspaper, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { selectFinancialExperience } from '@/lib/demoFinancials';
import { fetchLiveCryptoMarket, formatMarketPrice } from '@/lib/liveMarket';

const isProviderBackedAccount = (account = {}) => account.provider === 'unit' && Boolean(account.provider_account_id);
const isProviderBackedCard = (card = {}) => card.provider === 'unit' && Boolean(card.provider_card_id);
const isProviderBackedPortfolio = (portfolio = {}) => Boolean(portfolio.provider && portfolio.provider_portfolio_id);

function firstNameFrom(user) {
  return user?.full_name?.trim()?.split(/\s+/)?.[0] || 'Member';
}

function timeAgo(value) {
  if (!value) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [news, setNews] = useState([]);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await base44.auth.me();
        const [accounts, cards, portfolios, latestNews] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }, '-created_date').catch(() => []),
          base44.entities.PaymentCard.filter({ user_id: me.id, status: 'active' }, '-created_date').catch(() => []),
          base44.entities.InvestmentPortfolio.filter({ user_id: me.id }, '-created_date').catch(() => []),
          base44.entities.NewsRecord.filter({ status: 'active' }, '-publication_date', 6).catch(() => []),
        ]);
        if (cancelled) return;
        setUser(me);
        setFinancial(selectFinancialExperience(accounts.filter(isProviderBackedAccount), cards.filter(isProviderBackedCard), portfolios.filter(isProviderBackedPortfolio), me));
        setNews(latestNews || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refreshMarket() {
      try {
        const snapshot = await fetchLiveCryptoMarket({ force: true });
        if (!cancelled) setMarket(snapshot);
      } catch {
        if (!cancelled) setMarket(null);
      }
    }
    refreshMarket();
    const interval = window.setInterval(refreshMarket, 60000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const accounts = financial?.accounts || [];
  const cards = financial?.cards || [];
  const portfolios = financial?.portfolios || [];
  const balance = useMemo(() => accounts.reduce((sum, account) => sum + Number(account.available_balance ?? account.balance ?? 0), 0), [accounts]);
  const wealth = useMemo(() => portfolios.reduce((sum, portfolio) => sum + Number(portfolio.total_value || 0), 0), [portfolios]);
  const firstName = firstNameFrom(user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const leadCard = cards[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;

  return (
    <div className="px-5 pt-6 pb-28 max-w-[430px] mx-auto">
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-gray text-sm">{greeting}</p>
          <h1 className="text-[30px] leading-none font-bold tracking-tight mt-1">{firstName}</h1>
        </div>
        <button onClick={() => navigate('/messages')} aria-label="Notifications and messages" className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center shadow-sm"><Bell size={19} /></button>
      </header>

      <section className="rounded-[30px] overflow-hidden bg-[#061A33] text-white shadow-2xl mb-4 relative">
        <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full border border-brass/20" />
        <div className="absolute -left-20 bottom-[-90px] w-56 h-56 rounded-full bg-white/[0.035]" />
        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Vantoris balance</p>
              <p className="text-3xl font-semibold tracking-tight mt-1">{hidden ? '••••••' : formatCurrency(balance)}</p>
            </div>
            <button onClick={() => setHidden(value => !value)} aria-label={hidden ? 'Show balance' : 'Hide balance'} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">{hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
          </div>
          <div className="mt-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Account</p>
              <p className="text-sm mt-1">{accounts[0]?.account_name || 'Vantoris Everyday Account'}</p>
            </div>
            <button onClick={() => navigate('/accounts')} className="text-sm font-semibold text-brass inline-flex items-center gap-1">Open <ArrowUpRight size={15} /></button>
          </div>
          {financial?.mode === 'demonstration' && <div className="mt-4 rounded-2xl bg-white/8 border border-white/10 px-3 py-2"><p className="text-[10px] text-white/65">Demonstration experience · not real funds or spendable money.</p></div>}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto vantoris-scroll pb-1 mb-5">
        {(market?.quotes || []).map(quote => (
          <button key={quote.id} onClick={() => navigate('/investment')} className="min-w-[132px] rounded-2xl bg-white border border-border px-3.5 py-3 text-left shadow-sm">
            <div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[0.12em] text-gray">{quote.symbol}</span><TrendingUp size={13} className={quote.change24h >= 0 ? 'text-emerald-600' : 'text-crimson'} /></div>
            <p className="text-sm font-semibold mt-2">{formatMarketPrice(quote.price)}</p>
            <p className={`text-[10px] mt-0.5 ${quote.change24h >= 0 ? 'text-emerald-600' : 'text-crimson'}`}>{quote.change24h >= 0 ? '+' : ''}{quote.change24h.toFixed(2)}%</p>
          </button>
        ))}
        {!market?.quotes?.length && <div className="rounded-2xl bg-white border border-border px-4 py-3 text-xs text-gray">Live market data unavailable.</div>}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <QuickAction icon={<ArrowUpRight size={18} />} label="Send" onClick={() => navigate('/accounts')} />
        <QuickAction icon={<Wallet size={18} />} label="Request" onClick={() => navigate('/accounts')} />
        <QuickAction icon={<CreditCard size={18} />} label="Card" onClick={() => navigate('/accounts')} />
        <QuickAction icon={<Sparkles size={18} />} label="Discover" onClick={() => navigate('/discovery')} />
      </div>

      {leadCard && <button onClick={() => navigate('/accounts')} className="w-full rounded-[26px] p-5 text-left text-white bg-gradient-to-br from-[#0A2140] via-[#123A66] to-[#07172B] shadow-xl mb-5 relative overflow-hidden">
        <div className="absolute right-[-35px] top-[-35px] w-32 h-32 rounded-full border border-brass/20" />
        <div className="relative flex items-center justify-between"><div><span className="font-semibold tracking-[0.18em] text-xs">VANTORIS</span><p className="text-[9px] text-white/45 uppercase tracking-[0.16em] mt-1">{financial?.mode === 'real' ? 'Private Banking' : 'Demonstration Card'}</p></div><CreditCard size={22} className="text-white/65" /></div>
        <div className="relative mt-8 text-lg tracking-[0.2em]">•••• •••• •••• {leadCard.last4}</div>
        <div className="relative mt-5 flex justify-between"><p className="text-[10px] uppercase text-white/40">{leadCard.cardholder_name}</p><p className="text-[10px] uppercase text-white/40">{leadCard.card_type}</p></div>
      </button>}

      <section className="mb-5">
        <div className="flex items-center justify-between mb-2"><h2 className="text-base font-semibold">Your financial pulse</h2><button onClick={() => navigate('/accounts')} className="text-xs text-brass font-semibold">View all</button></div>
        <div className="rounded-[24px] bg-white border border-border shadow-sm overflow-hidden">
          <PulseRow icon={<Activity size={18} />} label="Available balance" value={hidden ? '••••••' : formatCurrency(balance)} detail={`${accounts.length} account${accounts.length === 1 ? '' : 's'}`} />
          <PulseRow icon={<TrendingUp size={18} />} label="Private wealth" value={hidden ? '••••••' : formatCurrency(wealth)} detail={portfolios.length ? 'Connected portfolio' : 'No live portfolio connected'} />
          <PulseRow icon={<Wallet size={18} />} label="Account mode" value={financial?.mode === 'real' ? 'Live' : 'Demo'} detail={financial?.mode === 'real' ? 'Provider-backed data' : 'Experience data only'} last />
        </div>
      </section>

      <section className="mb-5">
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Newspaper size={16} className="text-brass" /><h2 className="text-base font-semibold">Vantoris Brief</h2></div><button onClick={() => navigate('/discovery')} className="text-xs text-brass font-semibold">See all</button></div>
        <div className="space-y-2.5">
          {news.slice(0, 4).map(item => <button key={item.id} onClick={() => navigate('/discovery')} className="w-full rounded-[22px] bg-white border border-border p-4 text-left shadow-sm">
            <div className="flex items-center justify-between gap-2"><span className="text-[9px] uppercase tracking-[0.14em] text-gray">{item.source_name || 'Source'}</span><span className="text-[9px] text-gray">{timeAgo(item.publication_date)}</span></div>
            <p className="text-sm font-semibold leading-snug mt-2">{item.headline}</p>
            <div className="flex items-center gap-1 text-[10px] text-brass font-semibold mt-2">Open in Discovery <ChevronRight size={12} /></div>
          </button>)}
          {!news.length && <div className="rounded-[22px] bg-white border border-dashed border-border p-5 text-sm text-gray">Discovery is preparing the first intelligence brief.</div>}
        </div>
      </section>

      <section className="rounded-[24px] bg-[#0B2342] text-white p-5 mb-4">
        <div className="flex items-center gap-2"><Sparkles size={17} className="text-brass" /><h2 className="font-semibold">Built around your world</h2></div>
        <p className="text-xs text-white/55 mt-2">Banking, markets, intelligence and HeroBox in one private financial experience.</p>
        <div className="flex gap-2 mt-4"><button onClick={() => navigate('/discovery')} className="px-3.5 py-2 rounded-xl bg-white/10 text-xs font-semibold">Discovery</button><button onClick={() => navigate('/herobox')} className="px-3.5 py-2 rounded-xl bg-white/10 text-xs font-semibold">HeroBox</button><button onClick={() => navigate('/investment')} className="px-3.5 py-2 rounded-xl bg-brass text-navy text-xs font-semibold">Markets</button></div>
      </section>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return <button onClick={onClick} className="rounded-2xl bg-white border border-border p-3 shadow-sm flex flex-col items-center gap-2"><span className="w-9 h-9 rounded-xl bg-brass/10 text-brass flex items-center justify-center">{icon}</span><span className="text-[10px] font-semibold">{label}</span></button>;
}

function PulseRow({ icon, label, value, detail, last = false }) {
  return <div className={`px-4 py-3.5 flex items-center gap-3 ${last ? '' : 'border-b border-border/70'}`}><span className="w-9 h-9 rounded-xl bg-slate-100 text-navy flex items-center justify-center flex-shrink-0">{icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{label}</p><p className="text-[10px] text-gray mt-0.5">{detail}</p></div><div className="text-right"><p className="text-sm font-semibold">{value}</p></div></div>;
}
