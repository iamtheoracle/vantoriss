import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Building2, ShieldCheck,
  DollarSign, ArrowDownToLine, ArrowUpRight, ArrowLeftRight,
  Wallet, CreditCard, UserCheck, FolderOpen,
  BarChart3, TrendingUp, ScrollText, Activity,
  Bot, Settings, Code, Plug, Bell, Lock, Flag, Cog, HeartPulse,
  ChevronRight, Wrench, Users2, MessageSquare, Crown, Briefcase,
  AlertTriangle, Scale, GitBranch, Database, ServerCog,
} from 'lucide-react';
import ShieldLogo from './ShieldLogo';
import {
  getWorkspacesForRole, hasWorkspaceAccess, getDefaultWorkspace,
  WORKSPACE_LABELS, getRoleLabel,
} from '@/lib/operationsAccess';

const WORKSPACE_CONFIG = {
  executive: {
    icon: Crown,
    accent: 'text-brass',
    bg: 'bg-brass/15',
    sections: [
      {
        label: 'Overview',
        items: [
          { label: 'Executive Dashboard', path: '/operations/executive', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Business Intelligence',
        items: [
          { label: 'Platform Analytics', path: '/operations', icon: BarChart3 },
          { label: 'Reports', path: '/operations/reports', icon: TrendingUp },
          { label: 'Executive Reports', path: '/operations/executive-reports', icon: TrendingUp },
        ],
      },
      {
        label: 'Governance',
        items: [
          { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
          { label: 'Activity Timeline', path: '/operations/activity', icon: Activity },
          { label: 'AI Assistant', path: '/operations/assistant', icon: Bot },
        ],
      },
      {
        label: 'Platform Administration',
        items: [
          { label: 'Configuration', path: '/operations/configuration', icon: Settings },
          { label: 'Feature Flags', path: '/operations/feature-flags', icon: Flag },
          { label: 'System Health', path: '/operations/system-health', icon: HeartPulse },
          { label: 'API Management', path: '/operations/api-management', icon: Code },
          { label: 'Integrations', path: '/operations/integrations', icon: Plug },
          { label: 'Background Jobs', path: '/operations/background-jobs', icon: Cog },
        ],
      },
    ],
  },
  operations: {
    icon: Briefcase,
    accent: 'text-blue-400',
    bg: 'bg-blue-500/15',
    sections: [
      {
        label: 'Overview',
        items: [
          { label: 'Operations Dashboard', path: '/operations', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Members',
        items: [
          { label: 'Applications', path: '/operations/applications', icon: FileText },
          { label: 'Members', path: '/operations/members', icon: Users },
          { label: 'Organizations', path: '/operations/organizations', icon: Building2 },
          { label: 'KYC Review', path: '/operations/kyc', icon: ShieldCheck },
          { label: 'Operational Profiles', path: '/operations/operational-profiles', icon: ShieldCheck },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Finance Overview', path: '/operations/finance', icon: DollarSign },
          { label: 'Deposits', path: '/operations/deposits', icon: ArrowDownToLine },
          { label: 'Withdrawals', path: '/operations/withdrawals', icon: ArrowUpRight },
          { label: 'Withdrawal Limits', path: '/operations/withdrawal-limits', icon: ShieldCheck },
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
          { label: 'Notifications', path: '/operations/notifications', icon: Bell },
        ],
      },
      {
        label: 'Reports',
        items: [
          { label: 'Reports', path: '/operations/reports', icon: BarChart3 },
          { label: 'Activity Timeline', path: '/operations/activity', icon: Activity },
        ],
      },
    ],
  },
  security: {
    icon: ShieldCheck,
    accent: 'text-red-400',
    bg: 'bg-crimson/15',
    sections: [
      {
        label: 'Overview',
        items: [
          { label: 'Security Dashboard', path: '/operations/security-dashboard', icon: ShieldCheck },
        ],
      },
      {
        label: 'Monitoring & Audit',
        items: [
          { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
          { label: 'Activity Timeline', path: '/operations/activity', icon: Activity },
          { label: 'Security Center', path: '/operations/security', icon: Lock },
        ],
      },
      {
        label: 'Finance & Treasury',
        items: [
          { label: 'Finance Overview', path: '/operations/finance', icon: DollarSign },
          { label: 'Withdrawals', path: '/operations/withdrawals', icon: ArrowUpRight },
          { label: 'Withdrawal Limits', path: '/operations/withdrawal-limits', icon: ShieldCheck },
          { label: 'Transfers', path: '/operations/transfers', icon: ArrowLeftRight },
        ],
      },
      {
        label: 'Compliance & Verification',
        items: [
          { label: 'KYC Review', path: '/operations/kyc', icon: ShieldCheck },
          { label: 'Verification Requests', path: '/operations/verification-requests', icon: ShieldCheck },
          { label: 'Documents', path: '/operations/documents', icon: FolderOpen },
        ],
      },
      {
        label: 'System Administration',
        items: [
          { label: 'Configuration', path: '/operations/configuration', icon: Settings },
          { label: 'API Management', path: '/operations/api-management', icon: Code },
          { label: 'Feature Flags', path: '/operations/feature-flags', icon: Flag },
          { label: 'System Health', path: '/operations/system-health', icon: HeartPulse },
          { label: 'Background Jobs', path: '/operations/background-jobs', icon: Cog },
        ],
      },
    ],
  },
};

export default function AdminSidebar({ user, activeWorkspace, onWorkspaceChange, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  const availableWorkspaces = user ? getWorkspacesForRole(user.role) : [];
  const currentWorkspace = activeWorkspace || getDefaultWorkspace(user?.role) || 'operations';
  const config = WORKSPACE_CONFIG[currentWorkspace] || WORKSPACE_CONFIG.operations;

  function handleWorkspaceSelect(ws) {
    onWorkspaceChange?.(ws);
    const wsConfig = WORKSPACE_CONFIG[ws];
    if (wsConfig?.sections[0]?.items[0]) {
      navigate(wsConfig.sections[0].items[0].path);
    }
  }

  return (
    <aside className="vantoris-glass-sidebar flex flex-col h-full w-64 border-r border-white/[0.06]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Brand header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0 border-b border-white/[0.06]" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
        <ShieldLogo size={32} />
        <div className="min-w-0">
          <h1 className="text-white font-bold text-base tracking-[0.2em] leading-tight">VANTORIS</h1>
          <p className="text-[#AAB4C3]/60 text-[9px] tracking-[0.18em] uppercase">Command Center</p>
        </div>
      </div>

      {/* Workspace selector tabs */}
      {availableWorkspaces.length > 1 && (
        <div className="p-2 flex-shrink-0 border-b border-white/[0.06]">
          <div className="grid grid-cols-3 gap-1">
            {availableWorkspaces.map(ws => {
              const wsConfig = WORKSPACE_CONFIG[ws];
              const WsIcon = wsConfig.icon;
              const isActive = currentWorkspace === ws;
              return (
                <button
                  key={ws}
                  onClick={() => handleWorkspaceSelect(ws)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all text-[10px] font-semibold ${
                    isActive
                      ? `${wsConfig.bg} ${wsConfig.accent} shadow-sm`
                      : 'text-[#AAB4C3] hover:bg-white/[0.06] hover:text-white'
                  }`}
                  title={WORKSPACE_LABELS[ws]}
                >
                  <WsIcon size={16} />
                  <span className="truncate max-w-full px-1">{WORKSPACE_LABELS[ws].split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation sections */}
      <nav className="flex-1 px-2.5 overflow-y-auto overflow-x-hidden py-3 vantoris-scroll">
        {config.sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-4">
            {section.label && (
              <p className="text-[#AAB4C3]/40 text-[10px] font-semibold uppercase tracking-[0.12em] px-3 mb-1.5">
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
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-brass/12 text-brass shadow-sm border-l-2 border-brass'
                      : 'text-[#AAB4C3] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto flex-shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-2.5 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.04]">
          <div className="w-8 h-8 rounded-full bg-brass/20 border border-brass/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brass text-xs font-bold">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">{user?.full_name || 'Administrator'}</p>
            <p className="text-[#AAB4C3]/60 text-[10px]">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}