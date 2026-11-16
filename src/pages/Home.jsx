import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { getDisplayFirstName } from '@/lib/displayName';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye, EyeOff, ShieldCheck, Sparkles, TrendingUp, Wallet, ArrowUpRight, CreditCard, Landmark } from 'lucide-react';
import PrimaryActions from '@/components/vantoris/home/PrimaryActions';
import CardShowcase from '@/components/vantoris/home/CardShowcase';
import DashboardModules from '@/components/vantoris/home/DashboardModules';
import VantorisLogo from '@/components/vantoris/brand/VantorisLogo';
import { BRAND } from '@/lib/brand';

export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountLoadError, setAccountLoadError] = useState('');
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const [accountRows, cardRows, portfolioRows] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }, '-created_date', 500),
          base44.entities.PaymentCard.filter({ user_id: me.id }, '-created_date').catch(() => []),
          base44.entities.InvestmentPortfolio.filter({ user_id: me.id }, '-created_date').catch(() => []),
        ]);
        if (!cancelled) {
          setUser(me);
          setAccounts(Array.isArray(accountRows) ? accountRows : []);
          setCards(Array.isArray(cardRows) ? cardRows : []);
          setPortfolios(Array.isArray(portfolioRows) ? portfolioRows : []);
        }
      } catch (error) {
        console.error('Member home could not load', error);
        setAccountLoadError(error.message || 'Your account information could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const balance = useMemo(() => accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0), [accounts]);
  const wealth = useMemo(() => portfolios.reduce((sum, portfolio) => sum + Number(portfolio.total_value || 0), 0), [portfolios]);
  const firstName = getDisplayFirstName(user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F7F4EC]">
        <div className="w-8 h-8 border-2 border-[#C5A66A]/30 border-t-[#173D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-4 sm:pt-7 pb-28 space-y-6 sm:space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <VantorisLogo size={34} variant="flat" theme="light" />
          <p className="ml-1 mt-1 text-[9px] uppercase tracking-[.2em] font-bold text-[#8B7650]">Member banking</p>
        </div>
        <button onClick={() => navigate('/messages')} aria-label="Notifications and messages" className="relative w-11 h-11 shrink-0 rounded-full bg-white border border-[#E5DDCA] flex items-center justify-center shadow-sm hover:border-[#C5A66A] transition-colors">
          <Bell size={19} className="text-[#173D32]" />
        </button>
      </header>

      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-[#68766F]">{greeting},</p>
          <h1 className="text-[1.85rem] sm:text-4xl font-bold tracking-tight text-[#173D32] mt-1">Welcome home, {firstName}</h1>
          <p className="text-sm text-[#68766F] mt-2 max-w-xl">Your money, membership and everyday banking—together in one considered space.</p>
        </div>
        <button onClick={() => navigate('/ava')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173D32] text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-[#102C25] transition-colors shrink-0">
          <Sparkles size={16} className="text-[#E5D2A8]" /> Meet AVA
        </button>
      </section>

      <section className="rounded-[26px] sm:rounded-[30px] border border-[#E5DDCA] bg-white p-4 sm:p-6 shadow-[0_10px_34px_rgba(23,61,50,0.045)]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.18em] text-[#8B7650] font-bold">Designed for your membership</p>
            <h2 className="text-lg sm:text-xl font-bold text-[#173D32] mt-1">Your cards</h2>
            <p className="text-xs text-[#68766F] mt-1">Explore the Atchison Village card collection and view any card records linked to your membership.</p>
          </div>
          <button onClick={() => navigate('/cards')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#173D32] hover:text-[#8B7650]">
            Open card centre <ArrowUpRight size={14} />
          </button>
        </div>
        <CardShowcase cards={cards} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-7 space-y-5 min-w-0">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#204F40] via-[#173D32] to-[#102C25] text-white p-5 sm:p-7 shadow-[0_14px_36px_rgba(16,44,37,0.16)]">
            <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full border border-[#C5A66A]/20" />
            <div className="absolute -right-5 -top-9 w-44 h-44 rounded-full border border-[#C5A66A]/15" />
            <div className="absolute right-10 bottom-[-95px] w-56 h-56 rounded-full border border-white/10" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[.18em] text-white/65 font-semibold">Your money at a glance</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#E7D6B2] bg-white/10 rounded-full px-2.5 py-1.5"><ShieldCheck size={12} /> Private member space</span>
              </div>
              <p className="text-sm text-white/70 mt-5">Total account balance</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums">{hidden ? '••••••••' : formatCurrency(balance)}</p>
                <button onClick={() => setHidden(value => !value)} aria-label={hidden ? 'Show balance' : 'Hide balance'} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15">
                  {hidden ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
              <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white/65 text-xs">{accounts.length} account{accounts.length === 1 ? '' : 's'} linked</p>
                  <p className="font-semibold text-sm mt-1">{accounts.length ? 'Your accounts are ready to review' : 'Your account journey starts here'}</p>
                </div>
                <button onClick={() => navigate('/accounts')} className="shrink-0 rounded-full bg-[#E5D2A8] text-[#173D32] px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5">
                  View accounts <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </section>
          {accountLoadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">We could not load your account information. {accountLoadError} Please retry or contact member support.</div>}

          <section className="rounded-[24px] bg-white border border-[#E5DDCA] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[.16em] text-[#8B7650] font-bold">Everyday banking</p>
                <h2 className="font-bold text-[#173D32] mt-1">What would you like to do?</h2>
              </div>
              <Wallet size={19} className="text-[#C5A66A]" />
            </div>
            <PrimaryActions />
          </section>

          {wealth > 0 && (
            <section className="rounded-[24px] bg-[#FBF9F3] border border-[#E5DDCA] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[.16em] text-[#8B7650] font-bold">Investments</p>
                  <h2 className="text-lg font-bold text-[#173D32] mt-1">Your portfolio</h2>
                </div>
                <TrendingUp size={20} className="text-[#173D32]" />
              </div>
              <p className="text-3xl font-semibold text-[#173D32] mt-5 tabular-nums">{hidden ? '••••••••' : formatCurrency(wealth)}</p>
              <p className="text-xs text-[#68766F] mt-1">Total value across your recorded portfolios</p>
              <button onClick={() => navigate('/investment')} className="mt-4 text-sm font-semibold text-[#173D32] inline-flex items-center gap-1">View investments <ArrowUpRight size={15} /></button>
            </section>
          )}

          <section className="rounded-[24px] border border-[#E5DDCA] bg-white p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#173D32]/10 flex items-center justify-center"><Sparkles size={18} className="text-[#173D32]" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#173D32]">A little help from AVA</p>
                <p className="text-xs text-[#68766F] mt-1 leading-relaxed">{BRAND.assistant.description}</p>
                <button onClick={() => navigate('/ava')} className="text-xs font-bold text-[#173D32] mt-3">Start a conversation <ArrowUpRight size={13} className="inline ml-1" /></button>
              </div>
            </div>
          </section>
        </div>

        <aside className="xl:col-span-5 space-y-4 min-w-0">
          <section className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/accounts')} className="text-left rounded-2xl border border-[#E5DDCA] bg-white p-4 hover:border-[#C5A66A] transition-colors">
              <Landmark size={18} className="text-[#C5A66A]" />
              <p className="text-2xl font-bold text-[#173D32] mt-3 tabular-nums">{accounts.length}</p>
              <p className="text-xs text-[#68766F] mt-1">Linked accounts</p>
            </button>
            <button onClick={() => navigate('/cards')} className="text-left rounded-2xl border border-[#E5DDCA] bg-white p-4 hover:border-[#C5A66A] transition-colors">
              <CreditCard size={18} className="text-[#C5A66A]" />
              <p className="text-2xl font-bold text-[#173D32] mt-3 tabular-nums">{cards.length}</p>
              <p className="text-xs text-[#68766F] mt-1">Card records</p>
            </button>
          </section>
          <DashboardModules accounts={accounts} portfolios={portfolios} />
          <section className="rounded-[24px] bg-[#173D32] text-white p-5">
            <div className="flex items-center gap-2 text-[#E5D2A8] text-[10px] uppercase tracking-[.16em] font-bold"><ShieldCheck size={14} /> Your member space</div>
            <h2 className="text-lg font-bold mt-3">Banking with a clearer view.</h2>
            <p className="text-xs text-white/70 mt-2 leading-relaxed">Your member dashboard is separate from the institution’s protected operations workspace.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
