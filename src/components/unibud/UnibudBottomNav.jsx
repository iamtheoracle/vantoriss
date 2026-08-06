import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, MessageSquare, Newspaper, Radio, User, Users, Video } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/academics', label: 'Academics', icon: BookOpen },
  { to: '/communities', label: 'Communities', icon: Users },
  { to: '/podcasts', label: 'Podcasts', icon: Radio },
  { to: '/live', label: 'Live', icon: Video },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/connect', label: 'Connect', icon: MessageSquare },
  { to: '/me', label: 'Me', icon: User },
];

export default function UnibudBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/30 backdrop-blur-xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
      {/* grid columns match navItems.length — update both if adding/removing items */}
      <div className={`mx-auto grid max-w-3xl gap-2 px-3 pb-3 pt-3`} style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${isActive ? 'bg-white/12 text-white shadow-[0_0_24px_rgba(139,92,246,0.22)]' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}
            >
              <Icon size={18} className={isActive ? 'text-violet-300' : 'text-white/70'} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
