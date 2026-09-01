import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useMemberAccess — Checks whether the current member is approved for
 * account-dependent features (Move Money, Statements, etc.).
 *
 * A member is "approved" when they have at least one active Account,
 * which is only created after application + KYC + opening contribution approval.
 */
export function useMemberAccess() {
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const me = await base44.auth.me();
        const [accts, apps] = await Promise.all([
          base44.entities.Account.filter({ user_id: me.id }),
          base44.entities.Application.filter({ user_id: me.id }),
        ]);
        if (cancelled) return;
        setAccounts(accts);
        setApplication(apps[0] || null);
        setIsApproved(accts.some(a => a.status === 'active'));
      } catch (e) {
        console.error('useMemberAccess error:', e);
      }
      if (!cancelled) setLoading(false);
    }
    check();
    return () => { cancelled = true; };
  }, []);

  return { loading, isApproved, accounts, application };
}