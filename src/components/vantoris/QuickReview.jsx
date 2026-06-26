import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { Clock, ArrowUpRight, FileText, ArrowDownToLine } from 'lucide-react';

export default function QuickReview({ oldestApps, recentWithdrawals }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Oldest Pending Applications */}
      <div className="vantoris-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brass/15 flex items-center justify-center">
              <Clock size={16} className="text-brass" />
            </div>
            <h3 className="text-white font-semibold text-sm">Oldest Pending Applications</h3>
          </div>
          <Link to="/operations/applications" className="text-brass text-xs hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="space-y-3">
          {oldestApps.length === 0 && (
            <div className="text-center py-6">
              <FileText size={24} className="text-[#AAB4C3]/30 mx-auto mb-2" />
              <p className="text-[#AAB4C3] text-xs">No pending applications</p>
            </div>
          )}
          {oldestApps.map((app, idx) => (
            <Link
              key={app.id}
              to="/operations/applications"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#242D38]/40 hover:bg-[#242D38] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center flex-shrink-0">
                <span className="text-brass text-xs font-bold">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{app.full_name}</p>
                <p className="text-[#AAB4C3] text-xs">{app.account_type}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#AAB4C3] text-[10px]">
                  {new Date(app.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-brass text-[10px] font-medium">
                  {Math.ceil((new Date() - new Date(app.created_date)) / (1000 * 60 * 60 * 24))}d ago
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Withdrawal Requests */}
      <div className="vantoris-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-crimson/15 flex items-center justify-center">
              <ArrowDownToLine size={16} className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Recent Withdrawal Requests</h3>
          </div>
          <Link to="/operations/withdrawals" className="text-brass text-xs hover:underline flex items-center gap-1">
            View all <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="space-y-3">
          {recentWithdrawals.length === 0 && (
            <div className="text-center py-6">
              <ArrowDownToLine size={24} className="text-[#AAB4C3]/30 mx-auto mb-2" />
              <p className="text-[#AAB4C3] text-xs">No pending withdrawals</p>
            </div>
          )}
          {recentWithdrawals.map((wd, idx) => (
            <Link
              key={wd.id}
              to="/operations/withdrawals"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#242D38]/40 hover:bg-[#242D38] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-crimson/10 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xs font-bold">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-400 text-sm font-bold">{formatCurrency(Math.abs(wd.amount))}</p>
                <p className="text-[#AAB4C3] text-xs truncate">{wd.method}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#AAB4C3] text-[10px]">
                  {new Date(wd.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-brass text-[10px] font-medium">
                  {Math.ceil((new Date() - new Date(wd.created_date)) / (1000 * 60 * 60 * 24))}d ago
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}