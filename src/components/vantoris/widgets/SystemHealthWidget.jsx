import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { HeartPulse, ServerCog, Activity, Database } from 'lucide-react';

export default function SystemHealthWidget() {
  const [stats, setStats] = useState({ users: 0, accounts: 0, transactions: 0, auditLogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, accounts, transactions, auditLogs] = await Promise.all([
          base44.entities.User.list('-created_date', 1),
          base44.entities.Account.list('-created_date', 1),
          base44.entities.Transaction.list('-created_date', 1),
          base44.entities.AuditLog.list('-created_date', 1),
        ]);
        setStats({ users: users.length, accounts: accounts.length, transactions: transactions.length, auditLogs: auditLogs.length });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="vantoris-glass-premium p-5 h-32 vantoris-shimmer rounded-2xl" />;

  const services = [
    { label: 'Core Banking', status: 'operational', icon: ServerCog },
    { label: 'Database', status: 'operational', icon: Database },
    { label: 'Transaction Engine', status: 'operational', icon: Activity },
    { label: 'API Gateway', status: 'operational', icon: HeartPulse },
  ];

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartPulse size={16} className="text-mint" />
          <h3 className="text-foreground font-semibold text-sm">System Health</h3>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/10 text-mint text-[10px] font-bold border border-mint/20">
          <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          All Systems Operational
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {services.map(svc => {
          const Icon = svc.icon;
          return (
            <div key={svc.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
              <Icon size={14} className="text-mint" />
              <span className="text-foreground text-[11px] font-medium flex-1 truncate">{svc.label}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-mint" />
            </div>
          );
        })}
      </div>
    </div>
  );
}