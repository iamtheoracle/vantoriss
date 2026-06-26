import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { hasOperationsAccess } from '@/lib/operationsAccess';
import ShieldLogo from '@/components/vantoris/ShieldLogo';

export default function OperationsRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0E1A2B]">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !hasOperationsAccess(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}