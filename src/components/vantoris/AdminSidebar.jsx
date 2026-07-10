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
  Search, Eye, ShieldAlert, Network, Globe, Zap,
  PanelLeftClose,
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
    bg: 'bg-brass/10',
    sections: [
      {
        label: 'Command',
        items: [
          { label: 'Executive Dashboard', path: '/operations/executive', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Financial Intelligence',
        items: [
          { label: 'Enterprise Analytics', path: '/operations', icon: BarChart3 },
          { label: 'Financial Performance', path: '/operations/finance', icon: DollarSign },
          { label: 'Treasury Overview', path: '/operations/transfers', icon: Wallet },
          { label: 'Business Intelligence', path: '/operations/reports', icon: TrendingUp },
          { label: 'Strategic Reports', path: '/operations/executive-reports', icon: TrendingUp },
        ],
      },
      {
        label: 'Risk & Governance',
        items: [
          { label: 'Risk Overview', path: '/operations/security-dashboard', icon: ShieldAlert },
          { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
          { label: 'Activity Timeline', path: '/operations/activity', icon: Activity },
        ],
      },
      {
        label: 'AI & Administration',
        items: [
          { label: 'AI Executive Insights', path: '/operations/assistant', icon: Bot },
          { label: 'Configuration', path: '/operations/configuration', icon: Settings },
          { label: 'Feature Flags', path: '/operations/feature-flags', icon: Flag },
          { label: 'System Health', path: '/operations/system-health', icon: HeartPulse },
          { label: 'API Management', path: '/operations/api-management', icon: Code },
          { label: 'Integrations', path: '/operations/integrations', icon: Plug },
        ],
      },
    ],
  },
  operations: {
    icon: Briefcase,
    accent: 'text-champagne',
    bg: 'bg-champagne/10',
    sections: [
      {
        label: 'Dashboard',
        items: [
          { label: 'Daily Operations', path: '/operations', icon: LayoutDashboard },
        ],
      },
      {
        label: 'Onboarding & KYC',
        items: [
          { label: 'Pending Applications', path: '/operations/applications', icon: FileText },
          { label: 'KYC Queue', path: '/operations/kyc', icon: ShieldCheck },
          { label: 'Members', path: '/operations/members', icon: Users },
          { label: 'Organizations', path: '/operations/organizations', icon: Building2 },
        ],
      },
      {
        label: 'Payments & Transfers',
        items: [
          { label: 'Pending Deposits', path: '/operations/deposits', icon: ArrowDownToLine },
          { label: 'Pending Withdrawals', path: '/operations/withdrawals', icon: ArrowUpRight },
          { label: 'ACH Queue', path: '/operations/verification-requests', icon: ArrowLeftRight },
          { label: 'Domestic Wires', path: '/operations/transfers', icon: ArrowLeftRight },
          { label: 'International Wires', path: '/operations/transfers', icon: Globe },
          { label: 'Withdrawal Limits', path: '/operations/withdrawal-limits', icon: ShieldCheck },
        ],
      },
      {
        label: 'Banking Operations',
        items: [
          { label: 'Accounts', path: '/operations/accounts', icon: Wallet },
          { label: 'Cards', path: '/operations/cards', icon: CreditCard },
          { label: 'Support Queue', path: '/operations/service-requests', icon: Wrench },
          { label: 'Member Messages', path: '/operations/member-messages', icon: MessageSquare },
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
    accent: 'text-crimson',
    bg: 'bg-crimson/10',
    sections: [
      {
        label: 'Monitoring',
        items: [
          { label: 'Security Dashboard', path: '/operations/security-dashboard', icon: ShieldAlert },
          { label: 'Transaction Monitoring', path: '/operations/activity', icon: Activity },
          { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
        ],
      },
      {
        label: 'Risk & Compliance',
        items: [
          { label: 'Risk Management', path: '/operations/withdrawal-limits', icon: Scale },
          { label: 'Compliance Reviews', path: '/operations/kyc', icon: ShieldCheck },
          { label: 'Approval Queue', path: '/operations/verification-requests', icon: Eye },
          { label: 'Security Center', path: '/operations/security', icon: Lock },
        ],
      },
      {
        label: 'Finance Controls',
        items: [
          { label: 'Treasury', path: '/operations/finance', icon: DollarSign },
          { label: 'Withdrawals', path: '/operations/withdrawals', icon: ArrowUpRight },
          { label: 'Transfers', path: '/operations/transfers', icon: ArrowLeftRight },
        ],
      },
      {
        label: 'System Security',
        items: [
          { label: 'Security Alerts', path: '/operations/notifications', icon: Bell },
          { label: 'Documents', path: '/operations/documents', icon: FolderOpen },
          { label: 'Configuration', path: '/operations/configuration', icon: Settings },
          { label: 'API Management', path: '/operations/api-management', icon: Code },
          { label: 'System Health', path: '/operations/system-health', icon: HeartPulse },
        ],
      },
    ],
  },
};

export default function AdminSidebar({ user, activeWorkspace, onWorkspaceChange, onNavigate, onHide }) {
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
    <aside className="vantoris-glass-sidebar flex flex-col h-full w-64" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Brand header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0 border-b border-slate-200" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
        <ShieldLogo size={32} />
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground font-bold text-base tracking-[0.2em] leading-tight">VANTORIS</h1>
          <p className="text-gray/60 text-[9px] tracking-[0.18em] uppercase font-medium">Command Center</p>
        </div>
        {onHide && (
          <button
            onClick={onHide}
            className="p-1.5 rounded-lg text-gray hover:bg-slate-100 hover:text-foreground transition-all flex-shrink-0"
            title="Hide sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Workspace selector tabs */}
      {availableWorkspaces.length > 1 && (
        <div className="p-2 flex-shrink-0 border-b border-slate-200">
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
                      : 'text-gray hover:bg-slate-100 hover:text-foreground'
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
              <p className="text-gray/50 text-[10px] font-semibold uppercase tracking-[0.12em] px-3 mb-1.5">
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
                  key={item.path + item.label}
                  to={item.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-brass/10 text-brass shadow-sm border-l-2 border-brass'
                      : 'text-gray hover:bg-slate-50 hover:text-foreground'
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
      <div className="p-2.5 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-8 h-8 rounded-full bg-navy/10 border border-navy/15 flex items-center justify-center flex-shrink-0">
            <span className="text-navy text-xs font-bold">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-xs font-medium truncate">{user?.full_name || 'Administrator'}</p>
            <p className="text-gray/60 text-[10px]">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}