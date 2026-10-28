import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, Search, AlertTriangle, ShieldAlert, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

const ACCOUNT = {
  name: 'RCC — Road Construction Company',
  type: 'Corporate Investment Account',
  associatedPerson: 'Kessler Lazaroski',
  location: 'Atlanta, Georgia, USA',
  currency: 'USD',
  start: '2018-03-25',
  end: '2026-10-28',
};

const ANNUAL_SNAPSHOTS = [
  { year: 2018, date: '2018-12-31', closing: 26275675 },
  { year: 2019, date: '2019-12-31', closing: 29045025 },
  { year: 2020, date: '2020-12-31', closing: 31313875 },
  { year: 2021, date: '2021-12-31', closing: 33839755 },
  { year: 2022, date: '2022-12-31', closing: 30426985 },
  { year: 2023, date: '2023-12-31', closing: 31571985 },
  { year: 2024, date: '2024-12-31', closing: 33748485 },
  { year: 2025, date: '2025-12-31', closing: 36968735 },
];

const SCENARIO_RETURNS = [
  { period: '2026-01', label: 'January 2026', rate: 0.006 },
  { period: '2026-02', label: 'February 2026', rate: 0.003 },
  { period: '2026-03', label: 'March 2026', rate: -0.012 },
  { period: '2026-04', label: 'April 2026', rate: 0.015 },
  { period: '2026-05', label: 'May 2026', rate: 0.008 },
  { period: '2026-06', label: 'June 2026', rate: 0.004 },
  { period: '2026-07', label: 'July 2026', rate: 0.011 },
  { period: '2026-08', label: 'August 2026', rate: 0.002 },
  { period: '2026-09', label: 'September 2026', rate: 0.007 },
  { period: '2026-10', label: 'October 1–28, 2026', rate: 0.005 },
];

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const DATE = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' });
const money = (value) => value == null ? 'Pending source records' : USD.format(value);
const dateLabel = (value) => DATE.format(new Date(value + 'T12:00:00Z'));
const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
};

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildWordHtml() {
  const rows = ANNUAL_SNAPSHOTS.map((item) =>
    '<tr><td>' + item.year + '</td><td>' + dateLabel(item.date) + '</td><td>' + money(item.closing) + '</td><td>Unreconciled snapshot — source statement required</td></tr>'
  ).join('');
  return '<!doctype html><html><head><meta charset="utf-8"><title>RCC Corporate Investment Account History</title><style>body{font-family:Arial,sans-serif;color:#17212f}h1{font-size:22px}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:10pt}th{background:#eef2f7}.notice{padding:12px;border:1px solid #b45309;background:#fff7ed}</style></head><body><h1>' + ACCOUNT.name + '</h1><p>' + ACCOUNT.type + ' · Associated person: ' + ACCOUNT.associatedPerson + '</p><p>' + ACCOUNT.location + ' · Reporting period: ' + ACCOUNT.start + ' to ' + ACCOUNT.end + ' · USD</p><p class="notice"><b>UNRECONCILED HISTORICAL INPUTS — NOT AN OFFICIAL FINANCIAL STATEMENT.</b> No source statements or transaction-level records have been connected. Annual figures below are supplied snapshots only. Do not treat them as verified balances.</p><h2>Annual closing snapshots</h2><table><thead><tr><th>Year</th><th>As of</th><th>Supplied closing snapshot</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table><h2>Reconciliation</h2><p>2025 closing snapshot: ' + money(36968735) + '.</p><p>Separately supplied illustrative 2026 opening value: ' + money(42260300) + '.</p><p>Unresolved difference: ' + money(5291565) + '. Supporting source records are required; no balancing entry has been invented.</p><p>Opening balance at 25 March 2018, transaction history, fees, taxes, holdings, and verified performance: Pending source records.</p><h2>Data limitations</h2><p>The monthly 2026 return assumptions and the illustrative 2026 ending value are a separate scenario and are not included as actual ledger transactions.</p></body></html>';
}


function xmlEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function excelCell(value, type) {
  if (value === null || value === undefined || value === '') return '<Cell><Data ss:Type="String"></Data></Cell>';
  const actualType = type || (typeof value === 'number' ? 'Number' : 'String');
  return '<Cell><Data ss:Type="' + actualType + '">' + xmlEscape(value) + '</Data></Cell>';
}
function excelRow(values) {
  return '<Row>' + values.map((value) => Array.isArray(value) ? excelCell(value[0], value[1]) : excelCell(value)).join('') + '</Row>';
}
function excelSheet(name, rows) {
  return '<Worksheet ss:Name="' + xmlEscape(name) + '"><Table>' + rows.map(excelRow).join('') + '</Table></Worksheet>';
}
function exportExcelWorkbook() {
  const annualRows = [
    ['Year','Period end','Opening balance USD','Contributions USD','Withdrawals USD','Investment income USD','Realized gain/loss USD','Unrealized change USD','Fees USD','Taxes USD','Other adjustment USD','Closing snapshot USD','Reconciliation status'],
    ...ANNUAL_SNAPSHOTS.map((row) => [row.year,row.date,'','','','','','','','','',[row.closing,'Number'],'Unreconciled — source records required'])
  ];
  const scenarioRows = [['Period','Assumption','Return %','Opening scenario value USD','Scenario change USD','Closing scenario value USD','Status']];
  let previous = 42260300;
  SCENARIO_RETURNS.forEach((row, index) => {
    const change = Math.round(previous * row.rate * 100) / 100;
    const closing = Math.round((previous + change) * 100) / 100;
    scenarioRows.push([
      row.label, 'User-supplied assumption only', [row.rate * 100,'Number'],
      [previous,'Number'], [change,'Number'], [closing,'Number'], 'Scenario only — not verified history'
    ]);
    previous = closing;
  });
  const ledgerRows = [['Transaction date','Posting date','Description','Category','Source reference','Opening balance USD','Credit USD','Debit USD','Investment income USD','Realized gain/loss USD','Unrealized change USD','Fee USD','Tax/withholding USD','Other adjustment USD','Net effect USD','Running balance USD','Closing snapshot USD','Source document','Verification status','Record type'],
    ...ANNUAL_SNAPSHOTS.map((row) => [row.date,'','Supplied year-end closing snapshot for '+row.year+'; not a transaction entry.','Historical balance snapshot','','','','','','','','','','','','',[row.closing,'Number'],'','Unreconciled — source records required','supplied_snapshot'])
  ];
  const overviewRows = [['Field','Value'],['Account entity',ACCOUNT.name],['Account type',ACCOUNT.type],['Associated person',ACCOUNT.associatedPerson],['Location',ACCOUNT.location],['Reporting currency',ACCOUNT.currency],['Reporting start',ACCOUNT.start],['Reporting end',ACCOUNT.end],['Record status','Unreconciled supplied snapshots; source records pending'],['Opening balance at start','Pending source records'],['Fees and taxes','Pending source records']];
  const feeRows = [['Fee / tax category','Supported amount USD','Status'],...['Account maintenance','Custody and administration','Investment management / advisory','Trading commissions','Settlement / processing','Wire / transfer','FX conversion','Other expenses','Taxes / withholding (separate)'].map((name) => [name,'','Fee reconciliation pending — source records required'])];
  const performanceRows = [['Measure','Value','Method / limitation'],['Gross return','','Pending dated valuations and cash flows'],['Net return after fees','','Pending supported fee entries and valuation data'],['Time-weighted return','','Cannot calculate without valuation points and external cash flows'],['Money-weighted return','','Cannot calculate without dated cash flows'],['Account-value change','','Annual snapshots alone are insufficient to attribute performance']];
  const reconciliationRows = [['Check','Value','Status'],['2025 closing snapshot USD',[36968735,'Number'],'Supplied input; unreconciled'],['Illustrative 2026 opening USD',[42260300,'Number'],'Scenario input only'],['Unresolved difference USD',[5291565,'Number'],'Pending source records; no balancing entry invented'],['Opening balance 2018-03-25','','Pending source records'],['Statement completeness','','Source records not provided']];
  const sourceRows = [['Record group','Provenance','Validation status'],['Annual snapshots 2018–2025','User-supplied historical inputs','Unreconciled; source statements required'],['2026 monthly return assumptions','User-supplied scenario assumptions','Scenario only; not actual returns'],['Transaction-level ledger','No transaction records supplied','Unavailable'],['Fees and taxes','No fee invoices/statements supplied','Unavailable'],['Account identifiers','No verified identifiers supplied','Not created']];
  const xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">' +
    excelSheet('Account overview',overviewRows) + excelSheet('Annual history',annualRows) +
    excelSheet('Monthly scenario',scenarioRows) + excelSheet('Detailed ledger',ledgerRows) +
    excelSheet('Fees and expenses',feeRows) + excelSheet('Investment performance',performanceRows) +
    excelSheet('Reconciliation',reconciliationRows) + excelSheet('Source records and checks',sourceRows) + '</Workbook>';
  downloadFile('rcc_corporate_investment_account_history_review.xml','application/vnd.ms-excel;charset=utf-8',xml);
}

export default function RCCAccountHistory() {
  const [section, setSection] = useState('overview');
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSnapshots = useMemo(() => ANNUAL_SNAPSHOTS.filter((row) => {
    const matchesYear = year === 'all' || String(row.year) === year;
    const matchesMonth = month === 'all' || row.date.slice(5, 7) === month;
    const matchesCategory = category === 'all' || category === 'snapshot';
    const matchesSearch = (ACCOUNT.name + ' annual closing snapshot ' + row.year + ' ' + row.date).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || statusFilter === 'unreconciled';
    return matchesYear && matchesMonth && matchesCategory && matchesSearch && matchesStatus;
  }), [year, search, statusFilter]);

  function exportLedgerCsv() {
    const header = ['transaction_date','posting_date','description','category','source_reference','opening_balance_usd','credit_usd','debit_usd','investment_income_usd','realized_gain_loss_usd','unrealized_valuation_change_usd','fee_usd','tax_withholding_usd','other_adjustment_usd','net_effect_usd','running_balance_usd','closing_snapshot_usd','source_document','verification_status','record_type'];
    const rows = ANNUAL_SNAPSHOTS.map((row) => [
      row.date, '', 'Supplied year-end corporate investment portfolio closing snapshot for ' + row.year + '; not a transaction entry.',
      'Historical balance snapshot', '', '', '', '', '', '', '', '', '', '', '', '', row.closing, '', 'Unreconciled — source records required', 'supplied_snapshot'
    ]);
    downloadFile('rcc_account_history_annual_snapshots.csv', 'text/csv;charset=utf-8', [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n'));
  }

  function exportWord() {
    downloadFile('rcc_corporate_investment_account_history_review.doc', 'application/msword;charset=utf-8', buildWordHtml());
  }

  function exportPdf() {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 44;
    let y = 48;
    const maxWidth = 505;
    const add = (text, size = 10, bold = false) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, maxWidth);
      if (y + lines.length * (size + 4) > 790) { pdf.addPage(); y = 48; }
      pdf.text(lines, left, y);
      y += lines.length * (size + 4) + 8;
    };
    add('RCC — ROAD CONSTRUCTION COMPANY', 16, true);
    add('Corporate Investment Account History Review', 12, true);
    add('Associated person: Kessler Lazaroski | Atlanta, Georgia, USA | Reporting currency: USD');
    add('Reporting period: 25 March 2018 – 28 October 2026');
    add('UNRECONCILED HISTORICAL INPUTS — NOT AN OFFICIAL FINANCIAL STATEMENT', 11, true);
    add('The annual figures below were supplied as historical inputs. Source statements and transaction-level records have not been verified or connected. Unknown amounts remain pending and no transactions or fees have been invented.');
    add('Annual closing snapshots', 12, true);
    ANNUAL_SNAPSHOTS.forEach((row) => add(row.year + ' | ' + dateLabel(row.date) + ' | ' + money(row.closing) + ' | Unreconciled snapshot', 9));
    add('Reconciliation exception', 12, true);
    add('2025 closing snapshot: ' + money(36968735));
    add('Separately supplied illustrative 2026 opening value: ' + money(42260300));
    add('Unresolved difference: ' + money(5291565) + '. Pending source records; no balancing transaction has been created.');
    add('Opening balance at 25 March 2018: Pending source records.');
    add('Detailed transaction ledger, contributions, withdrawals, investment income, gains/losses, fees, taxes, holdings, and verified performance: Pending source records.');
    add('2026 return assumptions and the illustrative 2026 scenario ending value are excluded from actual history and must be reviewed separately.');
    pdf.save('rcc_corporate_investment_account_history_review.pdf');
  }

  const tabs = [
    ['overview', 'Overview'], ['annual', 'Annual history'], ['monthly', 'Monthly history'], ['ledger', 'Transaction ledger'],
    ['performance', 'Investment performance'], ['fees', 'Fees & taxes'], ['reconciliation', 'Reconciliation'], ['documents', 'Documents & exports'],
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Corporate reporting workspace</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{ACCOUNT.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{ACCOUNT.type}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span>Associated person: <strong className="text-slate-800">{ACCOUNT.associatedPerson}</strong></span>
                <span>{ACCOUNT.location}</span><span>Currency: USD</span>
                <span>{dateLabel(ACCOUNT.start)} – {dateLabel(ACCOUNT.end)}</span>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              <AlertTriangle size={16} /> Reconciliation pending
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"><Printer size={16} /> Export PDF review</button>
            <button onClick={exportWord} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><FileText size={16} /> Word-compatible report</button>
            <button onClick={exportLedgerCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><FileSpreadsheet size={16} /> Export ledger CSV</button>
            <button onClick={exportExcelWorkbook} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><FileSpreadsheet size={16} /> Excel workbook</button>
          </div>
        </header>

        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 shrink-0" size={20} />
            <div><p className="font-semibold">Source records not connected — figures are not verified</p>
              <p className="mt-1 text-sm leading-6">The annual balances shown here are supplied historical snapshots, not a transaction ledger or certified statement. The opening balance, source documents, activity, fees, taxes, and investment holdings remain pending. The page deliberately does not fill missing amounts with zero or invent transaction references.</p>
            </div>
          </div>
        </section>

        <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2" aria-label="Account history sections">
          {tabs.map(([id, label]) => <button key={id} onClick={() => setSection(id)} className={'shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ' + (section === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>{label}</button>)}
        </nav>

        {section === 'overview' && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Opening balance · 25 Mar 2018', 'Pending source records', 'Actual initial balance has not been supplied.'],
            ['Latest supplied snapshot', money(36968735), 'As of 31 December 2025; unreconciled input.'],
            ['Contributions / withdrawals', 'Pending source records', 'No transaction-level source data is connected.'],
            ['Fees / taxes', 'Pending source records', 'No supported fee or tax entries are available.'],
          ].map(([label, value, note]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-xl font-bold">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{note}</p></div>)}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-4">
            <h2 className="font-semibold">Reporting coverage</h2>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <p className="rounded-lg bg-slate-50 p-3"><strong>Initial boundary</strong><br />25–31 March 2018 · Opening balance pending</p>
              <p className="rounded-lg bg-slate-50 p-3"><strong>Annual snapshots</strong><br />2018–2025 · Supplied values, unreconciled</p>
              <p className="rounded-lg bg-slate-50 p-3"><strong>2026 YTD</strong><br />1 January–28 October · Actual history pending</p>
            </div>
          </div>
        </div>}

        {section === 'annual' && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold">Annual closing snapshots</h2><p className="mt-1 text-sm text-slate-500">No opening balances, cash flows, fees, taxes, or performance figures are inferred from closing snapshots.</p></div>
          <div className="overflow-x-auto"><table className="min-w-[780px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Year','Period end','Opening balance','Contributions','Withdrawals','Income / gains','Fees / taxes','Closing snapshot','Status'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{ANNUAL_SNAPSHOTS.map(row => <tr key={row.year} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{row.year}</td><td className="px-4 py-3">{dateLabel(row.date)}</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 font-semibold">{money(row.closing)}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Unreconciled</span></td></tr>)}</tbody></table></div>
        </section>}


        {section === 'monthly' && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold">Monthly history · 2026 year to date</h2><p className="mt-1 text-sm leading-6 text-slate-500">Actual monthly statements and valuation records have not been supplied. Each month remains pending; the separate assumption scenario is not presented as verified history.</p></div>
          <div className="overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Period</th><th className="px-4 py-3">Opening value</th><th className="px-4 py-3">Cash flows</th><th className="px-4 py-3">Income / fees</th><th className="px-4 py-3">Closing value</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{['January','February','March','April','May','June','July','August','September','October 1–28'].map((label) => <tr key={label} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{label} 2026</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3 text-slate-500">Pending</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">Source records required</span></td></tr>)}</tbody></table></div>
        </section>}

        {section === 'ledger' && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-200 p-5"><div><h2 className="text-lg font-bold">Chronological ledger</h2><p className="mt-1 text-sm text-slate-500">The rows below are balance snapshots only—not transactions. Transaction-level history will appear when authorized source records are imported.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="relative block"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description or date" className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm" /></label>
              <label><span className="sr-only">Filter by year</span><select value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="all">All years</option>{ANNUAL_SNAPSHOTS.map(r => <option key={r.year} value={String(r.year)}>{r.year}</option>)}</select></label>
              <label><span className="sr-only">Filter by month</span><select value={month} onChange={e => setMonth(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="all">All months</option>{Array.from({length:12},(_,i)=>({value:String(i+1).padStart(2,'0'),label:new Date(Date.UTC(2020,i,1)).toLocaleString('en-US',{month:'long',timeZone:'UTC'})})).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
              <label><span className="sr-only">Filter by category</span><select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="all">All categories</option><option value="snapshot">Balance snapshots</option></select></label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="all">All statuses</option><option value="unreconciled">Unreconciled only</option></select>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Credit / debit</th><th className="px-4 py-3">Running balance</th><th className="px-4 py-3">Source / status</th></tr></thead><tbody>{filteredSnapshots.map(row => <tr key={row.year} className="border-t border-slate-100 align-top"><td className="whitespace-nowrap px-4 py-4">{dateLabel(row.date)}</td><td className="max-w-sm px-4 py-4"><p className="font-medium">Supplied year-end closing snapshot for {row.year}</p><p className="mt-1 text-xs leading-5 text-slate-500">A supplied historical valuation figure; not evidence of a deposit, withdrawal, or other transaction.</p></td><td className="px-4 py-4">Balance snapshot</td><td className="px-4 py-4 text-slate-500">Not applicable</td><td className="whitespace-nowrap px-4 py-4 font-semibold">{money(row.closing)}</td><td className="px-4 py-4"><p>Source document pending</p><span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">Unreconciled</span></td></tr>)}</tbody></table>{filteredSnapshots.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No snapshots match these filters.</p>}</div>
        </section>}

        {section === 'performance' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Investment performance</h2><p className="mt-2 text-sm leading-6 text-slate-600">Verified gross and net returns cannot be calculated from year-end snapshots alone. Time-weighted return requires dated valuations and cash flows; money-weighted return requires dated contributions and withdrawals. Income, realized gains, unrealized valuation changes, and expenses are not separately supported by the available inputs.</p><div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="font-semibold">Return status: Pending source records</p><p className="mt-1 text-sm text-slate-600">The supplied 2026 monthly percentages are scenario assumptions only. They are not included in verified account history.</p></div><h3 className="mt-6 font-semibold">Separate 2026 assumption scenario</h3><div className="mt-3 overflow-x-auto"><table className="min-w-[520px] w-full text-sm"><thead><tr className="border-b text-left text-slate-500"><th className="py-2">Period</th><th className="py-2">Assumed return</th><th className="py-2">Classification</th></tr></thead><tbody>{SCENARIO_RETURNS.map(row => <tr key={row.period} className="border-b border-slate-100"><td className="py-2">{row.label}</td><td className={'py-2 font-medium ' + (row.rate < 0 ? 'text-rose-700' : 'text-emerald-700')}>{row.rate > 0 ? '+' : ''}{(row.rate * 100).toFixed(2)}%</td><td className="py-2 text-slate-500">Scenario only</td></tr>)}</tbody></table></div><p className="mt-4 text-sm text-slate-600">Illustrative opening value: {money(42260300)}. Illustrative 28 October 2026 ending value: {money(44367313.33)}. Indicative change: {money(2107013.33)} before actual fee deductions. These values are not reconciled account balances.</p></section>}

        {section === 'fees' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Fees and tax reconciliation</h2><p className="mt-2 text-sm text-slate-600">Fee reconciliation pending — source records required.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['Account maintenance','Custody and administration','Investment management / advisory','Trading commissions','Settlement / processing','Wire / transfer','FX conversion','Other expenses','Taxes / withholding (separate)'].map(item => <div key={item} className="rounded-lg border border-slate-200 p-4"><p className="text-sm font-medium">{item}</p><p className="mt-2 text-sm text-slate-500">Pending source records</p></div>)}</div><p className="mt-4 text-sm text-slate-500">No fee schedule or deductions have been invented. Monthly, annual, and cumulative totals remain unavailable until supported entries are provided.</p></section>}

        {section === 'reconciliation' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Reconciliation exceptions</h2><div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="font-semibold text-rose-900">Unresolved opening-to-closing discrepancy</p><div className="mt-3 grid gap-3 md:grid-cols-3"><div><p className="text-xs uppercase text-rose-800">2025 closing snapshot</p><p className="mt-1 text-lg font-bold text-rose-950">{money(36968735)}</p></div><div><p className="text-xs uppercase text-rose-800">Illustrative 2026 opening</p><p className="mt-1 text-lg font-bold text-rose-950">{money(42260300)}</p></div><div><p className="text-xs uppercase text-rose-800">Difference</p><p className="mt-1 text-lg font-bold text-rose-950">{money(5291565)}</p></div></div><p className="mt-3 text-sm leading-6 text-rose-900">Pending reconciliation. Do not post a balancing entry without supporting records. Required evidence includes the official year-end statement, the 2026 opening valuation statement, any intervening cash-flow records, holdings/valuation detail, and valuation dates.</p></div><div className="mt-4 grid gap-3 md:grid-cols-2">{[['Opening balance at 25 March 2018','Pending source records'],['Annual snapshot source statements','Not provided'],['Transaction-level ledger','Not provided'],['Duplicate / completeness review','Cannot be performed without source records']].map(([k,v]) => <div key={k} className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">{k}</p><p className="mt-1 font-semibold">{v}</p></div>)}</div></section>}

        {section === 'documents' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Documents and exports</h2><p className="mt-2 text-sm leading-6 text-slate-600">Exports are review copies generated from the supplied snapshots and the explicit unresolved-data state. They are not official financial statements. The Excel-compatible XML workbook includes eight worksheets; a native DOCX and native XLSX binary export remain follow-up work. The exported figures are still review-only until source records are verified.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={exportPdf} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Generate PDF review</button><button onClick={exportWord} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Generate editable Word-compatible report</button><button onClick={exportLedgerCsv} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Generate CSV ledger</button><button onClick={exportExcelWorkbook} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Generate Excel workbook</button></div><div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">Still required for full acceptance</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>Connect authorized source statements and corporate account records.</li><li>Add server-side data models and access policies for snapshots, ledger events, fee records, and audit events.</li><li>Add native DOCX and multi-sheet XLSX generation and verify cross-export totals.</li><li>Add automated calculation, import, duplicate-detection, and reconciliation tests.</li></ul></div></section>}
        <footer className="pb-4 text-xs leading-5 text-slate-500">Internal review interface · Supplied snapshots remain unreconciled · No bank, brokerage, account identifier, approval, signature, or certification has been invented.</footer>
      </div>
    </main>
  );
}
