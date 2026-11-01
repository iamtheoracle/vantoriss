import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const Cell = ({ label, value, tone = 'text-foreground' }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
    <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
    <p className={`text-sm font-bold mt-0.5 ${tone}`}>{value}</p>
  </div>
);

export default function LedgerPreview({ fileName, summary, issues, records }) {
  const sample = records.slice(0, 6);
  const balanced = summary.breaks === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-foreground text-sm font-semibold">{fileName}</p>
        <span className="px-2 py-0.5 rounded-md bg-navy/8 text-navy text-[10px] font-bold uppercase tracking-wider">
          {summary.count} entries
        </span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${balanced ? 'bg-mint/10 text-mint' : 'bg-warning/10 text-warning'}`}>
          {balanced ? 'Running balance checks out' : `${summary.breaks} balance break${summary.breaks === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Cell label="Period" value={`${summary.firstDate} → ${summary.lastDate}`} />
        <Cell label="Opening" value={formatCurrency(summary.opening)} />
        <Cell label="Closing" value={formatCurrency(summary.closing)} tone="text-navy" />
        <Cell label="Credits / Debits" value={`${formatCurrency(summary.credits)} / ${formatCurrency(summary.debits)}`} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-2 px-3 text-gray font-semibold uppercase tracking-wider">Date</th>
              <th className="text-left py-2 px-3 text-gray font-semibold uppercase tracking-wider">Description</th>
              <th className="text-right py-2 px-3 text-gray font-semibold uppercase tracking-wider">Amount</th>
              <th className="text-right py-2 px-3 text-gray font-semibold uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody>
            {sample.map((record, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="py-2 px-3 text-gray whitespace-nowrap">{record.date}</td>
                <td className="py-2 px-3 text-foreground max-w-[320px] truncate">{record.description}</td>
                <td className={`py-2 px-3 text-right font-semibold ${record.amount < 0 ? 'text-crimson' : 'text-mint'}`}>
                  {formatCurrency(record.amount)}
                </td>
                <td className="py-2 px-3 text-right text-gray">
                  {record.balanceAfter === null ? '—' : formatCurrency(record.balanceAfter)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {issues.length > 0 && (
        <div className="p-3 rounded-xl bg-warning/8 border border-warning/20">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <AlertTriangle size={13} /> {issues.length} row{issues.length === 1 ? '' : 's'} will be skipped
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {issues.slice(0, 5).map((issue, i) => (
              <li key={i} className="text-xs text-gray">{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {issues.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-mint font-medium">
          <CheckCircle2 size={13} /> Every row can be read.
        </p>
      )}
    </div>
  );
}