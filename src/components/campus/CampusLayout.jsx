import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Compass, Users, Link2, UserCog } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Discover', path: '/', icon: Compass },
  { label: 'Communities', path: '/communities', icon: Users },
  { label: 'Connections', path: '/connections', icon: Link2 },
  { label: 'Profile', path: '/profile/edit', icon: UserCog },
];

export default function CampusLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen campus-bg">
      <main className="pb-24 max-w-2xl mx-auto px-4 pt-4 safe-pt-top">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="campus-nav mx-auto max-w-2xl">
          {NAV_ITEMS.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`campus-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}