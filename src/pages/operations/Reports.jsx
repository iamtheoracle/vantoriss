import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { BarChart3, Users, Wallet, FileText, ArrowDownToLine, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [users, apps, accounts, withdrawals, transactions] = await Promise.all([
          base44.entities.User.list('-created_date', 100),
          base44.entities.Application.list('-created_date', 100),
          base44.entities.Account.list('-created_date', 100),
          base44.entities.WithdrawalRequest.list('-created_date', 100),
          base44.entities.Transaction.list('-created_date', 200),
        ]);
        setData({ users, apps, accounts, withdrawals, transactions });
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return (
      <OperationsPageLayout title="Reports" description="Platform analytics and operational metrics" icon={BarChart3}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const { users, apps, accounts, withdrawals, transactions } = data;
  const totalAUM = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const memberCount = users.filter(u => u.role === 'user').length;
  const pendingApps = apps.filter(a => a.application_status === 'pending').length;
  const pendingWd = withdrawals.filter(w => w.status === 'pending').length;
  const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'opening_balance').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  const stats = [
    { label: 'Total Members', value: memberCount, icon: Users },
    { label: 'Total Accounts', value: accounts.length, icon: Wallet },
    { label: 'Applications', value: apps.length, icon: FileText },
    { label: 'AUM', value: formatCurrency(totalAUM), icon: BarChart3 },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits), icon: ArrowDownToLine },
    { label: 'Total Withdrawals', value: formatCurrency(totalWithdrawals), icon: ArrowDownToLine },
    { label: 'Pending Applications', value: pendingApps, icon: FileText },
    { label: 'Pending Withdrawals', value: pendingWd, icon: ArrowDownToLine },
  ];

  function handleExport() {
    const rows = stats.map(s => ({ Metric: s.label, Value: s.value }));
    exportToCsv('vantoris_operations_report', ['Metric', 'Value'], rows);
  }

  return (
    <OperationsPageLayout
      title="Reports"
      description="Platform analytics and operational metrics"
      icon={BarChart3}
      actions={
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-olive/15 text-emerald-400 rounded-xl text-xs font-medium hover:bg-olive/25 transition-all">
          <Download size={14} /> Export CSV
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="vantoris-card p-5">
              <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center mb-3">
                <Icon size={20} className="text-brass" />
              </div>
              <p className="text-white font-bold text-xl">{s.value}</p>
              <p className="text-[#AAB4C3] text-xs mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>
    </OperationsPageLayout>
  );
}