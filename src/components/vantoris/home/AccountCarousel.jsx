import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';

export default function AccountCarousel({ accounts }) {
  const navigate = useNavigate();

  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-white font-semibold text-sm">My Accounts</h3>
        <button onClick={() => navigate('/accounts')} className="text-brass text-xs font-medium">View All</button>
      </div>
      <div className="overflow-x-auto vantoris-scroll -mx-5 px-5 pb-1">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {accounts.map((account, idx) => (
            <motion.button
              key={account.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="vantoris-glass-premium p-4 text-left hover:border-brass/25 transition-all"
              style={{ width: '240px', flexShrink: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-brass/12 flex items-center justify-center">
                  <span className="text-brass text-xs font-bold uppercase">{account.account_type?.[0] || 'A'}</span>
                </div>
                <StatusBadge status={account.status} />
              </div>
              <p className="text-white font-medium text-sm mb-0.5 truncate">{account.account_name}</p>
              <p className="text-[#AAB4C3]/60 text-[10px] font-mono mb-3">{account.account_number || '—'}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[#AAB4C3]/70 text-[10px] uppercase tracking-wider">Balance</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(account.balance || 0)}</p>
                </div>
                <ChevronRight size={16} className="text-[#AAB4C3] mb-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}