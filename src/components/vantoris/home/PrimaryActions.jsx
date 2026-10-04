import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Plus, Clock } from 'lucide-react';

// Primary dashboard actions — Spec §4.
// Each action leads to a real supported workflow.
export default function PrimaryActions() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Send', icon: ArrowUpRight, route: '/accounts', color: 'bg-navy text-white' },
    { label: 'Receive', icon: ArrowDownLeft, route: '/accounts', color: 'bg-white border border-border text-foreground' },
    { label: 'Add funds', icon: Plus, route: '/accounts', color: 'bg-white border border-border text-foreground' },
    { label: 'Activity', icon: Clock, route: '/accounts', color: 'bg-white border border-border text-foreground' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className="flex flex-col items-center gap-2"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${action.color}`}>
              <Icon size={20} />
            </div>
            <span className="text-[11px] font-medium text-foreground">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}