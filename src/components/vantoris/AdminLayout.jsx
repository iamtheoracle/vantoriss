import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import PageTransition from './PageTransition';
import { base44 } from '@/api/base44Client';
import { getDefaultWorkspace } from '@/lib/operationsAccess';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        // Restore workspace from localStorage or use default
        const saved = localStorage.getItem('vantoris_workspace');
        if (saved) {
          setActiveWorkspace(saved);
        } else {
          setActiveWorkspace(getDefaultWorkspace(u.role) || 'operations');
        }
      })
      .catch(() => setActiveWorkspace('operations'));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleWorkspaceChange(ws) {
    setActiveWorkspace(ws);
    localStorage.setItem('vantoris_workspace', ws);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E1A2B]">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex">
      {/* Desktop sidebar — fixed */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40">
        <AdminSidebar
          user={user}
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
        />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-[#111C2D] border-[#242D38] p-0 w-72" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <AdminSidebar
            user={user}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <AdminTopBar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 vantoris-scroll">
          <PageTransition />
        </main>
      </div>
    </div>
  );
}