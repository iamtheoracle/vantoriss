import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function MemberLayout() {
  return (
    <div className="min-h-screen bg-[#0E1A2B] pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}