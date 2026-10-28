import React, { useMemo, useState } from 'react';
import {
  BarChart3, CalendarDays, ChevronDown, Download, FileClock, FileText,
  Info, Landmark, ShieldAlert, Wallet
} from 'lucide-react';

const annualSnapshots = [
  { year: 2018, date: '2018-12-31', closing: 26275675, status: 'Needs source verification' },
  { year: 2019, date: '2019-12-31', closing: 29045025, status: 'Needs source verification' },
  { year: 2020, date: '2020-12-31', closing: 31313875, status: 'Needs source verification' },
  { year: 2021, date: '2021-12-31', closing: 33839755, status: 'Needs source verification' },
  { year: 2022, date: '2022-12-31', closing: 30426985, status: 'Needs source verification' },
  { year: 2023, date: '2023-12-31', closing: 31571985, status: 'Needs source verification' },
  { year: 2024, date: '2024-12-31', closing: 33748485, status: 'Needs source verification' },
  { year: 2025, date: '2025-12-31', closing: 36968735, status: 'Needs source verification' },
];

const monthlyScenario = [
  ['Jan', 0.6], ['Feb', 0.3], ['Mar', -1.2], ['Apr', 1.5], ['May', 0.8],
  ['Jun', 0.4], ['Jul', 1.1], ['Aug', 0.2], ['Sep', 0.7], ['Oct 1–28', 0.5],
];

const currency = value => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 2,
}).format(value);

const shortCurrency = value => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2,
}).format(value);

const dateLabel = value => new Date(value + 'T12:00:00').toLocaleDateString('en-US', {
  month: 'short', day: '2-digit', year: 'numeric',
});

function StatCard({ label, value, detail, icon: Icon, tone = 'navy' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
          <Icon size={19} />
        </span>
      </div>
    </div>
  );
}

export default function RCCAccountHistory() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [yearFilter, setYearFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showScenario, setShowScenario] = useState(false);

  const filteredSnapshots = useMemo(() => annualSnapshots.filter(item => {
    const yearMatch = yearFilter === 'all' || String(item.year) === yearFilter;
    const searchMatch = !query || `${item.year} ${item.date} year-end balance annual snapshot`.toLowerCase().includes(query.toLowerCase());
    return yearMatch && searchMatch;
  }), [yearFilter, query]);

  const latestBalance = annualSnapshots[annualSnapshots.length - 1].closing;
  const previousBalance = annualSnapshots[annualSnapshots.length - 2].closing;
  const difference = 42260300 - latestBalance;

  const downloadCsv = () => {
    const rows = [
      ['Record type', 'Date', 'Period', 'Closing balance USD', 'Record status'],
      ...annualSnapshots.map(item => ['Annual balance snapshot', item.date, item.year, item.closing.toFixed(2), item.status]),
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'RCC-corporate-investment-history.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = ['Overview', 'Annual history', 'Ledger', 'Fees & reconciliation'];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span>Operations</span><span>/</span><span>Investment accounts</span><span>/</span><span className="text-slate-800">RCC history</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071c38] text-white shadow-sm"><Landmark size={23} /></div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Corporate investment history</h1>
                <p className="mt-1 text-sm text-slate-600">RCC — Road Construction Company</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><Wallet size={15} /> Corporate Investment Account</span>
              <span className="inline-flex items-center gap-1.5"><Landmark size={15} /> Atlanta, Georgia, USA</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> Mar 25, 2018 – Oct 28, 2026</span>
            </div>
          </div>
          <button onClick={downloadCsv} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#071c38] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            <Download size={16} /> Export annual history
          </button>
        </div>

        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={19} />
          <div>
            <p className="text-sm font-semibold">Historical records require reconciliation</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">The annual figures below are loaded as supplied balance snapshots. Transaction-level statements and fee records must be attached before these figures can be marked verified. No unsupported transactions or fee deductions have been added.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Latest supplied close" value={currency(latestBalance)} detail="December 31, 2025 snapshot" icon={Wallet} />
          <StatCard label="Prior year close" value={currency(previousBalance)} detail="December 31, 2024 snapshot" icon={FileClock} />
          <StatCard label="Year-over-year change" value={currency(latestBalance - previousBalance)} detail="Snapshot difference, not verified return" icon={BarChart3} tone="green" />
          <StatCard label="Reconciliation status" value="Pending" detail="Source statements required" icon={ShieldAlert} tone="amber" />
        </div>

        <div className="border-b border-slate-200">
          <div className="-mb-px flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition ${activeTab === tab ? 'border-[#071c38] text-[#071c38]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-lg font-bold text-slate-900">Annual closing balances</h2><p className="mt-1 text-sm text-slate-500">Supplied year-end snapshots · USD</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">2018–2025</span>
              </div>
              <div className="mt-6 space-y-4">
                {annualSnapshots.map((item, index) => {
                  const max = Math.max(...annualSnapshots.map(row => row.closing));
                  const width = Math.max(5, (item.closing / max) * 100);
                  const change = index ? item.closing - annualSnapshots[index - 1].closing : null;
                  return (
                    <div key={item.year}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-700">{item.year}</span>
                        <div className="text-right"><span className="font-semibold tabular-nums text-slate-900">{currency(item.closing)}</span>{change !== null && <span className={`ml-2 hidden text-xs sm:inline ${change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{change >= 0 ? '+' : '−'}{shortCurrency(Math.abs(change))}</span>}</div>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#173e68]" style={{ width: `${width}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0" /> These bars compare reported snapshots only. They do not represent a verified performance series or account cash-flow history.</p>
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">Account profile</h2>
                <dl className="mt-4 divide-y divide-slate-100">
                  {[
                    ['Account entity', 'RCC — Road Construction Company'],
                    ['Associated person', 'Kessler Lazaroski'],
                    ['Account type', 'Corporate Investment Account'],
                    ['Reporting currency', 'USD'],
                    ['Reporting window', 'Mar 25, 2018 – Oct 28, 2026'],
                  ].map(([label, value]) => <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"><dt className="text-sm text-slate-500">{label}</dt><dd className="max-w-[65%] text-sm font-semibold text-slate-800 sm:text-right">{value}</dd></div>)}
                </dl>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">Reconciliation item</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Open</span></div>
                <p className="mt-2 text-sm leading-6 text-slate-600">The supplied 2026 opening figure differs from the supplied 2025 closing snapshot.</p>
                <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">2025 closing snapshot</span><strong className="tabular-nums">{currency(latestBalance)}</strong></div>
                  <div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">Separate 2026 opening input</span><strong className="tabular-nums">{currency(42260300)}</strong></div>
                  <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-sm"><span className="font-semibold text-slate-700">Unexplained difference</span><strong className="tabular-nums text-amber-800">{currency(difference)}</strong></div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Do not post this difference as a transaction until the source records explain it.</p>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'Annual history' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-bold text-slate-900">Annual history</h2><p className="mt-1 text-sm text-slate-500">Year-end balance snapshots supplied for review</p></div>
              <button onClick={downloadCsv} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download size={15} /> Download CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Period end</th><th className="px-5 py-3 font-semibold">Record type</th><th className="px-5 py-3 text-right font-semibold">Closing balance</th><th className="px-5 py-3 text-right font-semibold">Change vs prior snapshot</th><th className="px-5 py-3 font-semibold">Record status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {annualSnapshots.map((item, index) => <tr key={item.year} className="hover:bg-slate-50/80"><td className="px-5 py-4 font-medium text-slate-700">{dateLabel(item.date)}</td><td className="px-5 py-4 text-slate-600">Annual closing snapshot</td><td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">{currency(item.closing)}</td><td className="px-5 py-4 text-right tabular-nums">{index === 0 ? '—' : <span className={annualSnapshots[index].closing >= annualSnapshots[index - 1].closing ? 'text-emerald-700' : 'text-rose-700'}>{annualSnapshots[index].closing >= annualSnapshots[index - 1].closing ? '+' : '−'}{currency(Math.abs(item.closing - annualSnapshots[index - 1].closing))}</span>}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"><ShieldAlert size={13} /> Source review needed</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Ledger' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="text-lg font-bold text-slate-900">Historical ledger</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">The current data set contains annual balance snapshots, not source-level transactions. Import account statements to populate dated deposits, withdrawals, income, gains, fees, taxes, and running balances.</p></div>
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"><FileText size={14} /> Awaiting source transactions</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Contributions', 'Not yet reconciled'],
                ['Withdrawals', 'Not yet reconciled'],
                ['Investment income', 'Not yet reconciled'],
                ['Fees and taxes', 'Not yet reconciled'],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-slate-700">{value}</p></div>)}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4"><FileClock className="mt-0.5 shrink-0 text-slate-500" size={18} /><div><p className="text-sm font-semibold text-slate-800">Next step: import statement records</p><p className="mt-1 text-sm leading-6 text-slate-500">Once source transactions are available, the ledger can show each transaction date, description, credit or debit, fee and tax fields, source reference, and resulting balance on the same row.</p></div></div>
          </section>
        )}

        {activeTab === 'Fees & reconciliation' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Fee categories</h2>
              <p className="mt-1 text-sm text-slate-500">Amounts are not populated without supporting records.</p>
              <div className="mt-4 divide-y divide-slate-100">
                {['Account maintenance', 'Custody and administration', 'Investment management / advisory', 'Trading and settlement', 'Wire and transfer charges', 'Foreign-exchange charges', 'Taxes and withholding'].map(label => <div key={label} className="flex items-center justify-between gap-4 py-3"><span className="text-sm text-slate-700">{label}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Pending records</span></div>)}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Reconciliation checklist</h2>
              <div className="mt-4 space-y-3">
                {[
                  ['Opening balance as of Mar 25, 2018', 'Source statement required'],
                  ['Annual closing balances, 2018–2025', 'Supplied figures need verification'],
                  ['2026 opening balance difference', 'Investigate $5,291,565.00 variance'],
                  ['Transaction-level ledger', 'Import statements and trade records'],
                  ['Fee and tax totals', 'Reconcile against actual charges'],
                ].map(([label, status]) => <div key={label} className="flex gap-3 rounded-xl bg-slate-50 p-3"><span className="mt-0.5 text-amber-700"><ShieldAlert size={17} /></span><div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="mt-0.5 text-xs text-slate-500">{status}</p></div></div>)}
              </div>
            </section>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button onClick={() => setShowScenario(value => !value)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><BarChart3 size={18} /></span><div><p className="font-semibold text-slate-900">2026 return assumptions</p><p className="text-xs text-slate-500">Separate calculation scenario · not a verified ledger</p></div></div>
            <ChevronDown className={`text-slate-500 transition ${showScenario ? 'rotate-180' : ''}`} size={18} />
          </button>
          {showScenario && <div className="border-t border-slate-100 p-5">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{monthlyScenario.map(([month, value]) => <div key={month} className="rounded-xl border border-slate-100 p-3"><p className="text-xs text-slate-500">{month} 2026</p><p className={`mt-1 text-lg font-bold tabular-nums ${value >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</p></div>)}</div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Use these inputs only after confirming the starting value, cash flows, valuation dates, calculation method, and fee treatment. Do not merge this scenario into the verified ledger.</p>
          </div>}
        </section>

        <p className="pb-3 text-center text-xs text-slate-400">RCC account history · All financial values are traceable to supplied inputs or marked as pending verification.</p>
      </div>
    </div>
  );
}
