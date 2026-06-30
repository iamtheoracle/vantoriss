import React, { useState } from 'react';
import { Menu, X, Bell, Settings, LogOut, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIWorkspaceHeader({ user, onMenuToggle, sidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="border-b border-[#242D38] bg-[#0E1A2B]/95 backdrop-blur sticky top-0 z-20 safe-top">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Left: Menu & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 hover:bg-[#242D38] rounded-lg transition-all"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">VANTORIS Guide</h1>
            <p className="text-[#AAB4C3] text-xs">AI Workspace</p>
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-3">
          {/* AI Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#242D38] rounded-lg">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-white text-xs font-medium">Online</span>
          </div>

          {/* User Info */}
          <div className="hidden md:block text-right">
            <p className="text-white text-xs font-medium">{user?.full_name || 'User'}</p>
            <p className="text-[#AAB4C3] text-[10px] capitalize">{user?.role || 'member'}</p>
          </div>

          {/* Actions */}
          <button className="p-2 hover:bg-[#242D38] rounded-lg transition-all">
            <Bell size={18} className="text-[#AAB4C3]" />
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-[#242D38] rounded-lg transition-all"
            >
              <Settings size={18} className="text-[#AAB4C3]" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#242D38] border border-[#3a4450] rounded-lg py-2 shadow-lg">
                <button className="w-full text-left px-4 py-2 text-[#AAB4C3] hover:bg-[#3a4450] text-sm transition-all">
                  <Zap size={14} className="inline mr-2" />
                  Preferences
                </button>
                <button className="w-full text-left px-4 py-2 text-[#AAB4C3] hover:bg-[#3a4450] text-sm transition-all">
                  <Zap size={14} className="inline mr-2" />
                  Keyboard Shortcuts
                </button>
                <hr className="border-[#3a4450] my-1" />
                <button
                  onClick={() => base44.auth.logout('/')}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#3a4450] text-sm transition-all"
                >
                  <LogOut size={14} className="inline mr-2" />
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