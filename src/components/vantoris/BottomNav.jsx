import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Bell, User, MessageSquare } from 'lucide-react';
import { TabHistoryContext } from '@/lib/TabHistoryContext';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Accounts', path: '/accounts', icon: Wallet },
  { label: 'Guide', path: '/advisor/home', icon: MessageSquare },
  { label: 'Messages', path: '/messages', icon: Bell },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const { getTabPath } = useContext(TabHistoryContext);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 vantoris-glass-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(item => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={getTabPath(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-brass' : 'text-gray hover:text-white'
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