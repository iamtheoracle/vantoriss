import React from 'react';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import PageTransition from './PageTransition';
import BottomNav from './BottomNav';

export default function MemberLayout() {
  return (
    <TabHistoryProvider>
      <div className="min-h-screen bg-[#0E1A2B] vantoris-scroll" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
        <div className="safe-top">
          <PageTransition />
        </div>
        <BottomNav />
      </div>
    </TabHistoryProvider>
  );
}