import React, { useMemo, useState } from 'react';
import { Search, Wallet, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

export default function AccountPicker({ accounts, value, onChange }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? accounts.filter((a) =>
          `${a.account_name || ''} ${a.account_number || ''} ${a.account_type || ''}`.toLowerCase().includes(q))
      : accounts;
    return list.slice(0, 6);
  }, [accounts, query]);

  return (
    <div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by account name or number"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy/15"
        />
      </div>

      {value ? (
        <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-navy/5 border border-navy/10">
          <Wallet size={16} className="text-navy flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium truncate">{value.account_name || 'Account'}</p>
            <p className="text-gray text-xs">
              {value.account_number || 'No number'} · {formatCurrency(value.balance || 0)}
            </p>
          </div>
          <Check size={16} className="text-mint flex-shrink-0" />
        </div>
      ) : (
        <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {matches.map((account) => (
            <button
              key={account.id}
              onClick={() => onChange(account)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
            >
              <Wallet size={15} className="text-gray flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm truncate">{account.account_name || 'Account'}</p>
                <p className="text-gray text-xs">{account.account_number || 'No number'} · {account.account_type}</p>
              </div>
              <span className="text-xs font-semibold text-foreground">{formatCurrency(account.balance || 0)}</span>
            </button>
          ))}
          {matches.length === 0 && <p className="p-3 text-xs text-gray">No accounts match that search.</p>}
        </div>
      )}
    </div>
  );
}