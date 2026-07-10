import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu, PanelLeftOpen } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import PageTransition from './PageTransition';
import FloatingAIDock from './FloatingAIDock';
import { base44 } from '@/api/base44Client';
import { getDefaultWorkspace } from '@/lib/operationsAccess';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(() => localStorage.getItem('vantoris_sidebar_hidden') === 'true');
  const [user, setUser] = useState(null);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const location = useLocation();

  function toggleSidebar() {
    const next = !sidebarHidden;
    setSidebarHidden(next);
    localStorage.setItem('vantoris_sidebar_hidden', String(next));
  }

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
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
      <div className="flex items-center justify-center min-h-screen vantoris-mesh-bg">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen vantoris-mesh-bg flex">
      {/* Desktop sidebar — fixed */}
      {!sidebarHidden && (
        <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40">
          <AdminSidebar
            user={user}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onHide={toggleSidebar}
          />
        </div>
      )}

      {/* Floating show button when sidebar is hidden */}
      {sidebarHidden && (
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex fixed left-3 top-3 z-40 items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-md text-foreground text-xs font-medium hover:bg-slate-50 transition-all"
          title="Show sidebar"
        >
          <PanelLeftOpen size={16} />
          Menu
        </button>
      )}

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="vantoris-glass-sidebar p-0 w-72" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <AdminSidebar
            user={user}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen ${sidebarHidden ? 'lg:ml-0' : 'lg:ml-64'}`}>
        <AdminTopBar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 vantoris-scroll">
          <PageTransition />
        </main>
      </div>

      {/* Floating AI Assistant — available on every Operations page */}
      <FloatingAIDock />
    </div>
  );
}