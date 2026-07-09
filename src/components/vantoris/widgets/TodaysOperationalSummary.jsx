import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Activity, TrendingUp, FileText, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TodaysOperationalSummary() {
  const [data, setData] = useState({ txnsToday: 0, volumeToday: 0, newAppsToday: 0, pendingItems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [txns, apps, withdrawals, verifications] = await Promise.all([
          base44.entities.Transaction.list('-created_date', 50),
          base44.entities.Application.list('-created_date', 20),
          base44.entities.WithdrawalRequest.filter({ status: 'pending' }),
          base44.entities.VerificationRequest.filter({ status: 'pending' }),
        ]);
        const today = new Date().toDateString();
        const todayTxns = txns.filter(t => new Date(t.created_date).toDateString() === today);
        const todayApps = apps.filter(a => new Date(a.created_date).toDateString() === today);
        setData({
          txnsToday: todayTxns.length,
          volumeToday: todayTxns.reduce((s, t) => s + Math.abs(t.amount || 0), 0),
          newAppsToday: todayApps.length,
          pendingItems: apps.filter(a => a.application_status === 'pending').length + withdrawals.length + verifications.length,
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="vantoris-glass p-5 h-32 vantoris-shimmer rounded-2xl" />;

  return (
    <div className="vantoris-glass p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brass" />
        <h3 className="text-white font-semibold text-sm">Today's Operational Summary</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-bold text-white">{data.txnsToday}</p>
          <p className="text-[#AAB4C3] text-xs">Transactions Today</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-mint">{formatCurrency(data.volumeToday)}</p>
          <p className="text-[#AAB4C3] text-xs">Volume Today</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brass">{data.newAppsToday}</p>
          <p className="text-[#AAB4C3] text-xs">New Applications</p>
        </div>
        <Link to="/operations/applications" className="group">
          <p className="text-2xl font-bold text-red-400 group-hover:underline">{data.pendingItems}</p>
          <p className="text-[#AAB4C3] text-xs">Pending Items</p>
        </Link>
      </div>
    </div>
  );
}