import React from 'react';

const statusStyles = {
  approved: 'bg-mint/12 text-mint border-mint/20',
  active: 'bg-mint/12 text-mint border-mint/20',
  paid: 'bg-mint/12 text-mint border-mint/20',
  pending: 'bg-brass/12 text-brass border-brass/20',
  not_started: 'bg-slate-100 text-gray border-slate-200',
  rejected: 'bg-crimson/10 text-crimson border-crimson/20',
  frozen: 'bg-crimson/10 text-crimson border-crimson/20',
  closed: 'bg-slate-100 text-gray border-slate-200',
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