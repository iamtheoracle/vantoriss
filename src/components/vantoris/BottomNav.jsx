import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, ArrowLeftRight, TrendingUp, LayoutGrid } from 'lucide-react';
import { TabHistoryContext } from '@/lib/TabHistoryContext';
import { useContext } from 'react';
import { useMemberEntitlements } from '@/hooks/useMemberEntitlements';

const BASE_NAV_ITEMS = [
  { label: 'Home', path: '/', icon: Home, product: null },
  { label: 'Accounts', path: '/accounts', icon: Wallet, product: null },
  { label: 'Move Money', path: '/move-money', icon: ArrowLeftRight, product: 'moveMoney' },
  { label: 'Investments', path: '/investments', icon: TrendingUp, product: 'investments' },
  { label: 'More', path: '/more', icon: LayoutGrid, product: null },
];

export default function BottomNav() {
  const location = useLocation();
  const { getTabPath } = useContext(TabHistoryContext);
  const { loading, entitlements } = useMemberEntitlements();

  // While loading, show only items with no product gate to avoid flash of
  // unentitled content. Once entitlements resolve, show/hide gated items.
  const navItems = BASE_NAV_ITEMS.filter(item => {
    if (!item.product) return true;
    if (loading) return false; // hide gated items until data is ready
    return entitlements?.products?.[item.product] ?? false;
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 vantoris-glass-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(item => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={getTabPath(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-brass' : 'text-gray hover:text-foreground'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-2xl bg-brass/10" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.5} className="relative z-10" />
              <span className="relative z-10 text-[10px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}