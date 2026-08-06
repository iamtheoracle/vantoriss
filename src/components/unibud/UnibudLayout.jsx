import React from 'react';
import { Outlet } from 'react-router-dom';
import UnibudBottomNav from './UnibudBottomNav';

export default function UnibudLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] text-white" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
        <Outlet />
      </div>
      <UnibudBottomNav />
    </div>
  );
}
