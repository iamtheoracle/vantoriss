import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Plus, Clock } from 'lucide-react';

// Primary dashboard actions open the matching workflow instead of sending
// every action to the same generic account screen.
export default function PrimaryActions({ accounts = [] }) {
  const navigate = useNavigate();

  const actions = [
    { label: 'Send', icon: ArrowUpRight, action: 'send', color: 'bg-navy text-white' },
    { label: 'Receive', icon: ArrowDownLeft, action: 'request', color: 'bg-white border border-border text-foreground' },
    { label: 'Add funds', icon: Plus, action: 'add', color: 'bg-white border border-border text-foreground' },
    { label: 'Activity', icon: Clock, action: 'activity', color: 'bg-white border border-border text-foreground' },
  ];

  function openAction(action) {
    if (action === 'activity') {
      const account = accounts.find(item => item.status === 'active') || accounts[0];
      navigate(account?.id ? `/accounts/${encodeURIComponent(account.id)}` : '/accounts');
      return;
    }

    navigate(`/accounts?action=${encodeURIComponent(action)}`);
  }

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={() => openAction(action.action)}
            aria-label={action.label}
            className="flex min-w-0 flex-col items-center gap-2 rounded-2xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5 ${action.color}`}>
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="text-center text-[11px] font-medium text-foreground">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
