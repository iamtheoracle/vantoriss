import React from 'react';
import { useLocation } from 'react-router-dom';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import { useAuth } from '@/lib/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import PageTransition from './PageTransition';
import BottomNav from './BottomNav';
import FloatingCommandDock from './FloatingCommandDock';
import SessionTimeoutModal from './SessionTimeoutModal';

export default function MemberLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const isAssistantRoute = ['/ava', '/assistant', '/advisor'].includes(location.pathname);

  const handleTimeout = () => {
    logout(true);
  };

  const { showWarning, extendSession, logoutNow } = useSessionTimeout(handleTimeout);

  return (
    <TabHistoryProvider>
      <div className="min-h-screen bg-background vantoris-scroll" style={{ paddingBottom: isAssistantRoute ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
        <div className="safe-top w-full max-w-6xl mx-auto">
          <PageTransition />
        </div>
        {!isAssistantRoute && <BottomNav />}
        {!isAssistantRoute && <FloatingCommandDock />}
        <SessionTimeoutModal
          show={showWarning}
          onExtend={extendSession}
          onLogout={logoutNow}
        />
      </div>
    </TabHistoryProvider>
  );
}
