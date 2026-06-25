import React from 'react';

const statusStyles = {
  approved: 'bg-olive/20 text-emerald-400 border-olive/30',
  active: 'bg-olive/20 text-emerald-400 border-olive/30',
  paid: 'bg-olive/20 text-emerald-400 border-olive/30',
  pending: 'bg-brass/15 text-brass border-brass/30',
  not_started: 'bg-slate/50 text-gray border-gray/20',
  rejected: 'bg-crimson/20 text-red-400 border-crimson/30',
  frozen: 'bg-crimson/20 text-red-400 border-crimson/30',
  closed: 'bg-slate/50 text-gray border-gray/20',
};

const labels = {
  not_started: 'Not Started',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  paid: 'Paid',
  frozen: 'Frozen',
  closed: 'Closed',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.pending}`}>
      {labels[status] || status}
    </span>
  );
}