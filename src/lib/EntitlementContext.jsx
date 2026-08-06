import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const EntitlementContext = createContext(null);

/**
 * EntitlementProvider — Fetches member entitlements once per authenticated
 * session and makes them available to all consuming components via context.
 * This avoids duplicate API calls when multiple components use entitlements.
 */
export function EntitlementProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const me = await base44.auth.me();
        const [apps, accts, trading, heroProfs] = await Promise.all([
          base44.entities.Application.filter({ user_id: me.id }),
          base44.entities.Account.filter({ user_id: me.id }),
          base44.entities.TradingAccount.filter({ user_id: me.id }).catch(() => []),
          base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []),
        ]);

        if (cancelled) return;

        const application = apps[0] || null;
        const activeAccounts = accts.filter(a => a.status === 'active');
        const isApproved = activeAccounts.length > 0;

        const hasChecking = activeAccounts.some(a => a.account_type === 'checking');
        const hasSavings = activeAccounts.some(a => a.account_type === 'savings');
        const hasInvestments = trading.length > 0;
        const hasHeroBox = heroProfs.length > 0;

        const appStatus = application?.application_status;
        const kycStatus = application?.kyc_status;

        setEntitlements({
          user: me,
          accounts: accts,
          activeAccounts,
          application,
          tradingAccounts: trading,
          heroBoxProfile: heroProfs[0] || null,

          isApproved,
          hasApplication: !!application,
          appPending: appStatus === 'pending',
          appApproved: appStatus === 'approved',
          kycApproved: kycStatus === 'approved',

          products: {
            checking: isApproved && hasChecking,
            savings: isApproved && hasSavings,
            investments: hasInvestments,
            payments: isApproved,
            moveMoney: isApproved,
            cards: isApproved,
            heroBox: hasHeroBox,
            documents: !!application,
            advisor: true,
            messages: true,
            profile: true,
          },

          cta: {
            investments: hasInvestments
              ? null
              : {
                  label: 'Open Investment Account',
                  route: '/trading',
                  description: 'Unlock stocks, ETFs, crypto, and more.',
                },
            savings: hasSavings
              ? null
              : {
                  label: 'Open a Savings Account',
                  route: '/apply',
                  description: 'Earn competitive rates on your deposits.',
                },
          },
        });
      } catch (e) {
        console.error('EntitlementProvider error:', e);
        if (!cancelled) {
          setEntitlements({
            user: null,
            accounts: [],
            activeAccounts: [],
            application: null,
            tradingAccounts: [],
            heroBoxProfile: null,
            isApproved: false,
            hasApplication: false,
            appPending: false,
            appApproved: false,
            kycApproved: false,
            products: {
              checking: false,
              savings: false,
              investments: false,
              payments: false,
              moveMoney: false,
              cards: false,
              heroBox: false,
              documents: false,
              advisor: true,
              messages: true,
              profile: true,
            },
            cta: { investments: null, savings: null },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return (
    <EntitlementContext.Provider value={{ loading, entitlements }}>
      {children}
    </EntitlementContext.Provider>
  );
}

/**
 * useMemberEntitlements — Returns entitlements from the shared context.
 * Must be used inside EntitlementProvider.
 */
export function useMemberEntitlements() {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    // Fallback for components used outside provider (e.g. tests, Storybook)
    return { loading: true, entitlements: null };
  }
  return ctx;
}
