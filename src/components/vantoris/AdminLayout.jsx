import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import PageTransition from './PageTransition';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0E1A2B]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0E1A2B] border-b border-[#242D38] flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-[#AAB4C3] hover:text-white transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <span className="text-white font-bold text-sm tracking-widest">VANTORIS</span>
        <div className="w-8" />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-[#111C2D] border-[#242D38] p-0 w-72" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Main content — responsive: no fixed margin on mobile, ml-64 on desktop */}
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 vantoris-scroll min-h-screen">
        <PageTransition />
      </main>
    </div>
  );
}