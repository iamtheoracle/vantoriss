import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

const CATEGORY_OPTIONS = [
  { value: 'opening_balance', label: 'Opening Balance' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'adjustment', label: 'Adjustment' },
];

export default function TransactionFilters({ onFilter }) {
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [category, setCategory] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  function getDateRange() {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return customStart && customEnd ? { start: new Date(customStart), end: new Date(customEnd) } : null;
      default:
        return null;
    }
  }

  function handleApply() {
    const range = getDateRange();
    const cat = category === 'all' ? null : category;
    onFilter({ dateRange: range, category: cat });
    setShowFilters(false);
  }

  const activeFilters = (dateRange !== 'all' || category !== 'all') ? 1 : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
          activeFilters > 0
            ? 'bg-brass/20 text-brass border border-brass/30'
            : 'bg-[#242D38] text-[#AAB4C3] hover:bg-[#2a3340]'
        }`}
      >
        <Filter size={14} />
        Filters
        {activeFilters > 0 && <span className="ml-1 text-xs font-bold">{activeFilters}</span>}
      </button>

      {showFilters && (
        <div className="absolute top-full right-0 mt-2 bg-[#1a2535] border border-[#242D38] rounded-lg p-4 w-64 shadow-lg z-50">
          <h3 className="text-white font-semibold text-sm mb-3">Filter Transactions</h3>

          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="space-y-2">
                <div>
                  <label className="text-[#AAB4C3] text-xs mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#AAB4C3] text-xs mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Transaction Type</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
              >
                <option value="all">All Types</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              className="w-full py-2 bg-brass text-[#0E1A2B] rounded-lg text-xs font-semibold hover:bg-brass/90 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}