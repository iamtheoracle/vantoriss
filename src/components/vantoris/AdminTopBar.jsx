import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, User as UserIcon, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getRoleLabel } from '@/lib/operationsAccess';

export default function AdminTopBar({ user, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch unread notifications count
    base44.entities.Notification.filter({ read: false }, '-created_date', 50)
      .then(items => setUnreadCount(items.length))
      .catch(() => {});
  }, []);

  // Derive page title from route
  const pathSegments = location.pathname.replace('/operations/', '').split('/');
  const pageTitle = pathSegments[0] === 'operations' || location.pathname === '/operations'
    ? 'Dashboard'
    : pathSegments[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  function handleSearch(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/operations/members?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  }

  function handleLogout() {
    base44.auth.logout('/login');
  }

  return (
    <header className="sticky top-0 z-30 bg-[#0E1A2B]/95 backdrop-blur-xl border-b border-[#242D38] safe-top">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left — mobile menu + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-[#AAB4C3] hover:text-white transition-colors"
              aria-label="Open navigation"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div className="hidden sm:block min-w-0">
            <p className="text-[#AAB4C3] text-[10px] uppercase tracking-wider">Operations Center</p>
            <h2 className="text-white font-semibold text-sm truncate">{pageTitle}</h2>
          </div>
        </div>

        {/* Center — global search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AAB4C3]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search members, accounts, transactions…"
              className="w-full bg-[#242D38]/60 border border-[#242D38] rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-[#AAB4C3]/40 focus:border-brass/40 focus:bg-[#242D38] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right — notifications + user menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/operations/notifications')}
            className="relative p-2 text-[#AAB4C3] hover:text-white hover:bg-[#242D38]/60 rounded-lg transition-all"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-brass rounded-full" />
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-2 hover:bg-[#242D38]/60 rounded-lg transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0">
                <span className="text-brass text-xs font-bold">
                  {(user?.full_name || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-white text-xs font-medium leading-tight max-w-[100px] truncate">
                  {user?.full_name || 'Administrator'}
                </p>
                <p className="text-[#AAB4C3] text-[10px] leading-tight">{getRoleLabel(user?.role)}</p>
              </div>
              <ChevronDown size={14} className="text-[#AAB4C3] hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#111C2D] border border-[#242D38] rounded-xl shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-[#242D38]">
                  <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-[#AAB4C3] text-xs">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-brass/15 text-brass rounded text-[10px] font-semibold">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#AAB4C3] hover:bg-[#242D38]/60 hover:text-white transition-all"
                >
                  <ArrowUpRight size={15} className="rotate-180" />
                  Member Portal
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#AAB4C3] hover:bg-crimson/10 hover:text-red-400 transition-all border-t border-[#242D38]"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}