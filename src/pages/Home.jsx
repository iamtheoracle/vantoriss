import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, ChevronRight, Eye, EyeOff, RefreshCw, TrendingUp } from 'lucide-react';
import PrimaryActions from '@/components/vantoris/home/PrimaryActions';
import DashboardModules from '@/components/vantoris/home/DashboardModules';

// Home / Dashboard — Spec §4.
// Shows the user's real financial and service state.
// Failed requests must never be presented as a genuine empty account.
export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [partialWarning, setPartialWarning] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setLoadError(false);
      setPartialWarning(false);

      try {
        const me = await base44.auth.me();
        if (!me?.id) throw new Error('Authenticated member is unavailable.');

        const [accountsResult, cardsResult, portfoliosResult] = await Promise.allSettled([
          base44.entities.Account.filter({ user_id: me.id }, '-created_date'),
          base44.entities.PaymentCard.filter({ user_id: me.id, status: 'active' }, '-created_date'),
          base44.entities.InvestmentPortfolio.filter({ user_id: me.id }, '-created_date'),
        ]);

        if (accountsResult.status !== 'fulfilled' || !Array.isArray(accountsResult.value)) {
          throw new Error('Account data is unavailable.');
        }

        if (cancelled) return;

        setUser(me);
        setAccounts(accountsResult.value);
        setCards(cardsResult.status === 'fulfilled' && Array.isArray(cardsResult.value) ? cardsResult.value : []);
        setPortfolios(portfoliosResult.status === 'fulfilled' && Array.isArray(portfoliosResult.value) ? portfoliosResult.value : []);
        setPartialWarning(
          cardsResult.status !== 'fulfilled' ||
          !Array.isArray(cardsResult.value) ||
          portfoliosResult.status !== 'fulfilled' ||
          !Array.isArray(portfoliosResult.value)
        );
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setUser(null);
          setAccounts([]);
          setCards([]);
          setPortfolios([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const balance = useMemo(() => accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0), [accounts]);
  const wealth = useMemo(() => portfolios.reduce((sum, portfolio) => sum + (Number(portfolio.total_value) || 0), 0), [portfolios]);
  const firstName = user?.full_name?.trim()?.split(/\s+/)?.[0] || 'Member';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const hasAccounts = accounts.length > 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm text-gray">Loading your account securely…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-[60vh] px-5 py-12 max-w-[430px] mx-auto flex items-center">
        <section className="w-full rounded-[28px] border border-border bg-white p-6 text-center shadow-sm" role="alert">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <AlertCircle size={22} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Your account data is unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-gray">
            We couldn’t load your account information. Your balance has not been changed. Try again when your connection is available.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey(key => key + 1)}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="px-5 pt-6 pb-28 max-w-[430px] mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between mb-6">
        <div className="min-w-0 pr-3">
          <p className="text-gray text-sm">{greeting}</p>
          <h1 className="text-3xl font-bold mt-1 tracking-tight">{firstName}</h1>
          <p className="text-gray text-sm mt-1">Your money. Your travel. Your next move.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/messages')}
          aria-label="Notifications and messages"
          className="w-11 h-11 shrink-0 rounded-full bg-white border border-border flex items-center justify-center shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
        >
          <Bell size={19} aria-hidden="true" />
        </button>
      </header>

      {partialWarning && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950" role="status">
          <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Some information may be unavailable</p>
            <p className="mt-0.5 text-xs leading-5 text-amber-900">
              Your account balance loaded, but one or more optional dashboard sections could not be refreshed.
            </p>
            <button type="button" onClick={() => setReloadKey(key => key + 1)} className="mt-2 text-xs font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">
              Refresh dashboard
            </button>
          </div>
        </div>
      )}

      {/* USD Account Card — real balance only */}
      <section className="rounded-[28px] bg-white border border-border p-5 shadow-sm mb-5" aria-label="Account balance">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-gray">Available balance</p>
            <p className="text-3xl font-semibold mt-1 tracking-tight tabular-nums">{hidden ? '••••••' : formatCurrency(balance)}</p>
          </div>
          <button
            type="button"
            onClick={() => setHidden(value => !value)}
            aria-label={hidden ? 'Show balances' : 'Hide balances'}
            aria-pressed={hidden}
            className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
          >
            {hidden ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
          </button>
        </div>
        {hasAccounts ? (
          <div className="mt-4 pt-4 border-t border-border/70 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray">{accounts.length} account{accounts.length === 1 ? '' : 's'}</span>
            <button type="button" onClick={() => navigate('/accounts')} className="font-semibold text-brass inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-md">
              Account details <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray mt-4 pt-4 border-t border-border/70">No accounts are linked to your profile yet.</p>
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
            <TrendingUp size={20} className="text-brass" aria-hidden="true" />
          </div>
          <p className="text-3xl font-semibold mt-5 tabular-nums">{hidden ? '••••••' : formatCurrency(wealth)}</p>
          <p className="text-xs text-white/55 mt-1">Investment value across your portfolios</p>
          <button type="button" onClick={() => navigate('/investment')} className="mt-5 text-sm font-semibold text-brass inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-md">
            View investments <ChevronRight size={15} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Personalized Modules — real state or truthful unavailable */}
      <DashboardModules accounts={accounts} cards={cards} portfolios={portfolios} />
    </main>
  );
}
