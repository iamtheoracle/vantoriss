import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecentActivity({ transactions }) {
  const navigate = useNavigate();

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
        <button onClick={() => navigate('/accounts')} className="text-brass text-xs font-medium">View All</button>
      </div>
      <div className="vantoris-glass-flat p-2">
        {transactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[#AAB4C3] text-sm">No transactions yet</p>
          </div>
        ) : (
          transactions.slice(0, 6).map((txn, idx) => {
            const isCredit = txn.type === 'deposit' || txn.type === 'opening_balance';
            const isDebit = txn.type === 'withdrawal';
            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCredit ? 'bg-mint/15' : isDebit ? 'bg-crimson/12' : 'bg-brass/12'
                  }`}>
                    {isCredit
                      ? <ArrowDownLeft size={15} className="text-mint" />
                      : isDebit
                      ? <ArrowUpRight size={15} className="text-red-400" />
                      : <TrendingUp size={15} className="text-brass" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{txn.description || txn.type?.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[#AAB4C3] text-[11px]">
                        {new Date(txn.transaction_date || txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {txn.reference && (
                        <>
                          <span className="text-[#AAB4C3]/30 text-[10px]">·</span>
                          <p className="text-[#AAB4C3]/60 text-[10px] font-mono truncate">REF: {txn.reference}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold text-sm ${isDebit ? 'text-red-400' : 'text-mint'}`}>
                    {isDebit ? '−' : '+'}{formatCurrency(Math.abs(txn.amount))}
                  </p>
                  {txn.balance_after != null && (
                    <p className="text-[#AAB4C3]/50 text-[10px]">Bal: {formatCurrency(txn.balance_after)}</p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}