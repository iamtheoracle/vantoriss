import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { isOperatorAccount } from '@/lib/accountAccess';

export default function MemberRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    base44.auth
      .me()
      .then(currentUser => {
        if (mounted) setUser(currentUser);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brass" />
      </div>
    );
  }

  // Staff/operator credentials are never member credentials. If an operator
  // reaches a member route, send them directly to their operator workspace.
  if (user && isOperatorAccount(user)) {
    return <Navigate to="/operations" replace />;
  }

  return <Outlet />;
}
