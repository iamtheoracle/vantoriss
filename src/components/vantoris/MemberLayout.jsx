import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function MemberLayout() {
  return (
    <div className="min-h-screen bg-[#0E1A2B] vantoris-scroll" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
      <div className="safe-top">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}