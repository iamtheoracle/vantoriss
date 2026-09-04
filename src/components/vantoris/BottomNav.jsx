import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Compass, Heart, LayoutGrid } from 'lucide-react';
import { TabHistoryContext } from '@/lib/TabHistoryContext';
import { useContext } from 'react';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Accounts', path: '/accounts', icon: Wallet },
  { label: 'Discovery', path: '/discovery', icon: Compass },
  { label: 'HeroBox', path: '/herobox', icon: Heart },
  { label: 'More', path: '/more', icon: LayoutGrid },
];

export default function BottomNav() {
  const location = useLocation();
  const { getTabPath } = useContext(TabHistoryContext);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 vantoris-glass-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 max-w-[430px] mx-auto px-1">
        {navItems.map(item => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} to={getTabPath(item.path)} aria-label={item.label} className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive ? 'text-brass' : 'text-gray hover:text-foreground'}`}>
              {isActive && <span className="absolute inset-0 rounded-2xl bg-brass/10" />}
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.5} className="relative z-10" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
