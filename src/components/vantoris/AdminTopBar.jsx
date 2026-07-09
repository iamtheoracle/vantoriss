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
    base44.entities.Notification.filter({ read: false }, '-created_date', 50)
      .then(items => setUnreadCount(items.length))
      .catch(() => {});
  }, []);

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
    <header className="vantoris-glass-header sticky top-0 z-30 safe-top">
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
            <p className="text-[#AAB4C3]/60 text-[10px] uppercase tracking-[0.15em]">Vantoris Command</p>
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
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-[#AAB4C3]/40 focus:border-brass/40 focus:bg-white/[0.06] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right — notifications + user menu */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/operations/notifications')}
            className="relative p-2 text-[#AAB4C3] hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-crimson text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-white/[0.08] mx-0.5" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-2 hover:bg-white/[0.06] rounded-lg transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-brass/20 border border-brass/30 flex items-center justify-center flex-shrink-0">
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
              <div className="vantoris-glass-dropdown absolute right-0 top-full mt-2 w-60 overflow-hidden p-1.5">
                <div className="p-3 border-b border-white/[0.08]">
                  <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-[#AAB4C3] text-xs truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-brass/15 text-brass rounded text-[10px] font-semibold">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#AAB4C3] hover:bg-white/[0.06] hover:text-white rounded-lg transition-all mt-1"
                >
                  <ArrowUpRight size={15} className="rotate-180" />
                  Member Portal
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#AAB4C3] hover:bg-crimson/10 hover:text-red-400 rounded-lg transition-all"
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