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
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0E1A2B] border-t border-[#242D38]/80 backdrop-blur-xl"
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                isActive ? 'text-brass' : 'text-[#AAB4C3] hover:text-white'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}