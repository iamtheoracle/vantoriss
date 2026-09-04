import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import MoveMoney from './MoveMoney';
import DemoAccounts from './DemoAccounts';
import { selectFinancialExperience } from '@/lib/demoFinancials';

export default function Accounts() {
  const [user, setUser] = useState(null);
  const [experience, setExperience] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const [accounts, cards, portfolios] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }, '-created_date').catch(() => []),
          base44.entities.PaymentCard.filter({ user_id: me.id, status: 'active' }, '-created_date').catch(() => []),
          base44.entities.InvestmentPortfolio.filter({ user_id: me.id }, '-created_date').catch(() => []),
        ]);
        if (!cancelled) {
          setUser(me);
          setExperience(selectFinancialExperience(accounts || [], cards || [], portfolios || [], me));
        }
      } catch {
        if (!cancelled) setExperience({ mode: 'demonstration' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="accounts-combined-page">
      <style>{`.accounts-combined-page .accounts-money-content header { display: none; }.accounts-combined-page .accounts-money-content > div { padding-top: 0; }`}</style>
      <header className="px-5 pt-6 pb-1 max-w-[430px] mx-auto">
        <p className="text-gray text-sm">Your banking relationship</p>
        <h1 className="text-3xl font-bold mt-1">Accounts</h1>
        <p className="text-gray text-sm mt-1">Accounts, cards, payments and transfers in one place.</p>
      </header>
      {experience?.mode === 'real' ? <div className="accounts-money-content"><MoveMoney /></div> : user ? <DemoAccounts user={user} /> : <div className="px-5 py-10 text-center text-sm text-gray">Loading Vantoris...</div>}
    </div>
  );
}
