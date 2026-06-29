import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Building2, ShieldCheck,
  DollarSign, ArrowDownToLine, ArrowUpRight, ArrowLeftRight,
  Wallet, CreditCard, UserCheck, FolderOpen,
  BarChart3, TrendingUp, ScrollText, Activity,
  Bot, Settings, Code, Plug, Bell, Lock, Flag, Cog, HeartPulse,
  LogOut, ChevronRight, Wrench, Users2, MessageSquare
} from 'lucide-react';
import ShieldLogo from './ShieldLogo';
import { base44 } from '@/api/base44Client';

const sections = [
  {
    items: [
      { label: 'Dashboard', path: '/operations', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Members',
    items: [
      { label: 'Applications', path: '/operations/applications', icon: FileText },
      { label: 'Members', path: '/operations/members', icon: Users },
      { label: 'Organizations', path: '/operations/organizations', icon: Building2 },
      { label: 'KYC Review', path: '/operations/kyc', icon: ShieldCheck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance Overview', path: '/operations/finance', icon: DollarSign },
      { label: 'Deposits', path: '/operations/deposits', icon: ArrowDownToLine },
      { label: 'Withdrawals', path: '/operations/withdrawals', icon: ArrowUpRight },
      { label: 'Verification Requests', path: '/operations/verification-requests', icon: ShieldCheck },
      { label: 'Transfers', path: '/operations/transfers', icon: ArrowLeftRight },
      { label: 'Accounts', path: '/operations/accounts', icon: Wallet },
      { label: 'Cards', path: '/operations/cards', icon: CreditCard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Service Requests', path: '/operations/service-requests', icon: Wrench },
      { label: 'Member Messages', path: '/operations/member-messages', icon: MessageSquare },
      { label: 'Referrals', path: '/operations/referrals', icon: Users2 },
      { label: 'Wallet Assignment', path: '/operations/wallet-assignment', icon: Wallet },
      { label: 'Account Assignment', path: '/operations/account-assignment', icon: UserCheck },
      { label: 'Documents', path: '/operations/documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Reports', path: '/operations/reports', icon: BarChart3 },
      { label: 'Executive Reports', path: '/operations/executive-reports', icon: TrendingUp },
      { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
      { label: 'Activity Timeline', path: '/operations/activity', icon: Activity },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'AI Assistant', path: '/operations/assistant', icon: Bot },
      { label: 'Configuration Center', path: '/operations/configuration', icon: Settings },
      { label: 'API Management', path: '/operations/api-management', icon: Code },
      { label: 'Integrations', path: '/operations/integrations', icon: Plug },
      { label: 'Notifications', path: '/operations/notifications', icon: Bell },
      { label: 'Security', path: '/operations/security', icon: Lock },
      { label: 'Feature Flags', path: '/operations/feature-flags', icon: Flag },
      { label: 'Background Jobs', path: '/operations/background-jobs', icon: Cog },
      { label: 'System Health', path: '/operations/system-health', icon: HeartPulse },
    ],
  },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#111C2D] border-r border-[#242D38] flex flex-col z-40 lg:relative lg:z-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="p-6 flex items-center gap-3 flex-shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)' }}>
        <ShieldLogo size={36} />
        <div>
          <h1 className="text-white font-bold text-lg tracking-widest">VANTORIS</h1>
          <p className="text-[#AAB4C3] text-[9px] tracking-[0.2em] uppercase">Operations Center</p>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto overflow-x-hidden pb-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-4">
            {section.label && (
              <p className="text-[#AAB4C3]/50 text-[10px] font-semibold uppercase tracking-wider px-4 mb-1.5">
                {section.label}
              </p>
            )}
            {section.items.map(item => {
              const isActive = item.path === '/operations'
                ? location.pathname === '/operations'
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-0.5 transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-brass/15 text-brass'
                      : 'text-[#AAB4C3] hover:bg-[#242D38]/60 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#242D38] flex-shrink-0">
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#AAB4C3] hover:bg-[#242D38]/60 hover:text-white transition-all">
          <ArrowUpRight size={16} className="rotate-180" />
          <span>Member Portal</span>
        </Link>
        <button
          onClick={() => base44.auth.logout('/')}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#AAB4C3] hover:bg-crimson/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}