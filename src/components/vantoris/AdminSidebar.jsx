import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ShieldCheck, Users, Wallet, ArrowDownToLine, LogOut, Bot } from 'lucide-react';
import ShieldLogo from './ShieldLogo';
import { base44 } from '@/api/base44Client';

const navItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'Applications', path: '/admin/applications', icon: FileText },
  { label: 'KYC Review', path: '/admin/kyc', icon: ShieldCheck },
  { label: 'Members', path: '/admin/members', icon: Users },
  { label: 'Accounts', path: '/admin/accounts', icon: Wallet },
  { label: 'Withdrawals', path: '/admin/withdrawals', icon: ArrowDownToLine },
  { label: 'AI Assistant', path: '/admin/assistant', icon: Bot },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#111C2D] border-r border-[#242D38] flex flex-col z-40">
      <div className="p-6 flex items-center gap-3">
        <ShieldLogo size={36} />
        <div>
          <h1 className="text-white font-bold text-lg tracking-widest">VANTORIS</h1>
          <p className="text-[#AAB4C3] text-[9px] tracking-[0.2em] uppercase">Operations Center</p>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2">
        {navItems.map(item => {
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-brass/15 text-brass'
                  : 'text-[#AAB4C3] hover:bg-[#242D38]/60 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#242D38]">
        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#AAB4C3] hover:bg-[#242D38]/60 hover:text-white transition-all">
          <ArrowDownToLine size={18} className="rotate-90" />
          <span>Member View</span>
        </Link>
        <button
          onClick={() => base44.auth.logout('/')}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#AAB4C3] hover:bg-crimson/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}