import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import AccountPicker from '@/components/vantoris/operations/AccountPicker';
import LedgerPreview from '@/components/vantoris/operations/LedgerPreview';
import { readLedgerFile, buildLedger } from '@/lib/ledgerFile';
import { importLedger } from '@/lib/ledgerImport';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, RotateCcw, History } from 'lucide-react';

export default function HistoryImport() {
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(null);
  const [file, setFile] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [institution, setInstitution] = useState('');
  const [notes, setNotes] = useState('');
  const [overlap, setOverlap] = useState(null);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const loadAccounts = () =>
    base44.entities.Account.list('-created_date', 300).then(setAccounts).catch(() => setAccounts([]));

  useEffect(() => { loadAccounts(); }, []);

  useEffect(() => {
    if (!account || !ledger) { setOverlap(null); return; }
    let cancelled = false;
    base44.entities.HistoricalStatement.filter({ account_id: account.id })
      .then((list) => {
        if (cancelled) return;
        const hit = (list || []).find((s) =>
          s.period_start && s.period_end &&
          s.period_start <= ledger.summary.lastDate && s.period_end >= ledger.summary.firstDate);
        setOverlap(hit || null);
      })
      .catch(() => setOverlap(null));
    return () => { cancelled = true; };
  }, [account, ledger]);

  async function handleFile(selected) {
    if (!selected) return;
    setFile(selected);
    setLedger(null);
    setResult(null);
    setError('');
    setOverlap(null);
    setAllowOverlap(false);
    setParsing(true);
    try {
      const built = buildLedger(await readLedgerFile(selected));
      if (!built.records.length) {
        setError(built.issues[0] || 'No readable rows were found in that file.');
      } else {
        setLedger(built);
      }
    } catch (e) {
      setError(e.message || 'That file could not be read.');
    }
    setParsing(false);
  }

  async function runImport() {
    setBusy(true);
    setError('');
    try {
      const me = await base44.auth.me();
      const res = await importLedger({
        account,
        records: ledger.records,
        summary: ledger.summary,
        file,
        institution,
        notes,
        importedByName: me?.display_name || me?.full_name || me?.email,
      });
      setResult({ ...res, account: account.account_name || account.account_number, summary: ledger.summary });
      setLedger(null);
      setFile(null);
      setOverlap(null);
      setInstitution('');
      setNotes('');
      if (fileRef.current) fileRef.current.value = '';
      loadAccounts();
    } catch (e) {
      setError(e.message || 'The import did not complete.');
    }
    setBusy(false);
  }

  const blockedByOverlap = overlap && !allowOverlap;
  const canImport = !!account && !!ledger && !blockedByOverlap && !busy;

  return (
    <OperationsPageLayout
      title="Account History Import"
      description="Upload a member's statement workbook and post it to their account"
      icon={History}
      breadcrumb="Operations Workspace"
    >
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-crimson/8 border border-crimson/20 flex items-start gap-3">
          <AlertTriangle size={17} className="text-crimson flex-shrink-0 mt-0.5" />
          <p className="text-sm text-crimson">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-5 vantoris-glass-premium p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-mint/10 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-mint" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold">History imported</h3>
              <p className="text-gray text-sm">
                {result.created} entries posted to {result.account} · closing balance{' '}
                {result.summary.closing.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-semibold rounded-xl hover:bg-navy/90"
          >
            <RotateCcw size={14} /> Import another file
          </button>
        </div>
      )}

      {!result && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="vantoris-card p-5">
            <h3 className="text-foreground font-semibold text-sm mb-1">1 · Target account</h3>
            <p className="text-gray text-xs mb-3">The entries and closing balance are written to this account.</p>
            <AccountPicker accounts={accounts} value={account} onChange={setAccount} />
            {account && (
              <button onClick={() => setAccount(null)} className="mt-2 text-xs text-gray hover:text-foreground">
                Choose a different account
              </button>
            )}
          </div>

          <div className="vantoris-card p-5">
            <h3 className="text-foreground font-semibold text-sm mb-1">2 · Statement file</h3>
            <p className="text-gray text-xs mb-3">Excel or CSV with date, description, amount and balance columns.</p>
            <div
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-7 text-center cursor-pointer hover:border-brass/40 hover:bg-brass/5 transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.txt"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-navy/8 flex items-center justify-center mx-auto mb-3">
                {parsing ? <Loader2 size={20} className="text-navy animate-spin" /> : file ? <FileSpreadsheet size={20} className="text-navy" /> : <UploadCloud size={20} className="text-gray" />}
              </div>
              <p className="text-foreground text-sm font-medium">{file ? file.name : 'Drop the workbook here'}</p>
              <p className="text-gray text-xs mt-1">{parsing ? 'Reading file…' : file ? 'Click to choose a different file' : 'or click to browse'}</p>
            </div>
          </div>

          {ledger && (
            <div className="vantoris-card p-5 xl:col-span-2">
              <h3 className="text-foreground font-semibold text-sm mb-3">3 · Review before posting</h3>
              <LedgerPreview
                fileName={file?.name || 'Statement'}
                summary={ledger.summary}
                issues={ledger.issues}
                records={ledger.records}
              />

              {overlap && (
                <div className="mt-4 p-3 rounded-xl bg-warning/8 border border-warning/20">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                    <AlertTriangle size={13} /> This period already has an imported statement
                  </p>
                  <p className="text-xs text-gray mt-1">
                    {overlap.period_start} → {overlap.period_end} ({overlap.transaction_count} entries). Importing again
                    will double-count those entries.
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-xs text-foreground">
                    <input type="checkbox" checked={allowOverlap} onChange={(e) => setAllowOverlap(e.target.checked)} />
                    Import anyway
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">Source institution</span>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. RCC — Road Construction Company"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy/15"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-gray font-semibold">Operator notes</span>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why this file is being posted"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy/15"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={runImport}
                  disabled={!canImport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-40"
                >
                  {busy ? <><Loader2 size={15} className="animate-spin" /> Posting…</> : <>Post {ledger.records.length} entries</>}
                </button>
                {!account && <p className="text-xs text-warning">Select a target account to continue.</p>}
                {blockedByOverlap && <p className="text-xs text-warning">Confirm the overlap to continue.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </OperationsPageLayout>
  );
}