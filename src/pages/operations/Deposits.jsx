import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ArrowDownToLine } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Deposits() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const txns = await base44.entities.Transaction.list('-created_date', 200);
        setTransactions(txns.filter(t => t.type === 'deposit' || t.type === 'opening_balance'));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const totalAmount = transactions.reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  // Chart data: deposits by type
  const typeData = {
    'Opening Balance': transactions.filter(t => t.type === 'opening_balance').length,
    'Deposit': transactions.filter(t => t.type === 'deposit').length,
  };
  const typeChartData = [
    { name: 'Opening Balance', value: typeData['Opening Balance'] },
    { name: 'Deposit', value: typeData['Deposit'] },
  ];

  // Time series: last 10 deposits
  const last10Deposits = transactions.slice(0, 10).reverse().map(t => ({
    date: new Date(t.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: Math.abs(t.amount || 0),
  }));

  return (
    <OperationsPageLayout title="Deposits" description="All incoming deposits and opening balances" icon={ArrowDownToLine}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="vantoris-card p-5">
              <p className="text-[#AAB4C3] text-xs uppercase tracking-widest mb-1">Total Deposits Processed</p>
              <p className="text-white font-bold text-2xl">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="vantoris-card p-5">
              <p className="text-[#AAB4C3] text-xs uppercase tracking-widest mb-1">Total Transactions</p>
              <p className="text-white font-bold text-2xl">{transactions.length}</p>
            </div>
            <div className="vantoris-card p-5">
              <p className="text-[#AAB4C3] text-xs uppercase tracking-widest mb-1">Average Deposit</p>
              <p className="text-white font-bold text-2xl">{transactions.length > 0 ? formatCurrency(totalAmount / transactions.length) : '$0'}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Deposit Type Distribution */}
            <div className="vantoris-card p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Deposits by Type</h3>
              {typeChartData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
                    <XAxis dataKey="name" stroke="#AAB4C3" />
                    <YAxis stroke="#AAB4C3" />
                    <Tooltip contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#B08D57" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[#AAB4C3] text-center py-12">No deposits yet</p>
              )}
            </div>

            {/* Recent Deposits Trend */}
            <div className="vantoris-card p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Recent Deposits (Last 10)</h3>
              {last10Deposits.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={last10Deposits}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#242D38" />
                    <XAxis dataKey="date" stroke="#AAB4C3" />
                    <YAxis stroke="#AAB4C3" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0E1A2B', border: '1px solid #242D38', borderRadius: '8px' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#B08D57" strokeWidth={2} dot={{ fill: '#B08D57' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[#AAB4C3] text-center py-12">No deposits yet</p>
              )}
            </div>
          </div>

          <div className="vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Description</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Reference</th>
                  <th className="text-right text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-3 text-[#AAB4C3] text-xs">{(t.transaction_date || t.created_date).split('T')[0]}</td>
                    <td className="px-5 py-3 text-white text-xs">{t.type.replace('_', ' ')}</td>
                    <td className="px-5 py-3 text-white text-xs">{t.description || '—'}</td>
                    <td className="px-5 py-3 text-[#AAB4C3] text-xs font-mono">{t.reference || '—'}</td>
                    <td className="px-5 py-3 text-right text-emerald-400 font-semibold text-xs">{formatCurrency(Math.abs(t.amount))}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-[#AAB4C3]">No deposits found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OperationsPageLayout>
  );
}