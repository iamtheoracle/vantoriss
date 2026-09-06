import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowDownToLine, ArrowUpRight, Download, History, Lock, RefreshCw, Send, ShieldAlert, Unlock, X } from 'lucide-react';
import SecurityPinModal from './SecurityPinModal';

const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100);

export default function ProviderMoveMoney() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [holds, setHolds] = useState([]);
  const [panel, setPanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true); setMessage('');
    try {
      const me = await base44.auth.me();
      const rows = await base44.entities.Account.filter({ user_id: me.id, provider: 'unit' }, '-created_date', 20);
      setUser(me); setAccounts(rows || []);
      if (rows?.[0]?.provider_account_id) {
        const result = await base44.functions.invoke('unitFinancialLifecycle', { action: 'list_transactions', provider_account_id: rows[0].provider_account_id });
        setTransactions((result?.data || result)?.transactions || []);
        const h = await base44.functions.invoke('unitFinancialLifecycle', { action: 'list_account_holds', provider_account_id: rows[0].provider_account_id });
        setHolds((h?.data || h)?.holds || []);
      }
      setRequests(await base44.entities.PaymentRequest.filter({ requester_user_id: me.id }, '-created_date', 20).catch(() => []));
    } catch (e) { setMessage(e?.message || 'Provider banking data is unavailable.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const account = accounts[0];
  const available = Number(account?.available_balance ?? account?.balance ?? 0);

  function authorize(action) { setPendingAction(() => action); setPinOpen(true); }
  async function afterPin() {
    setPinOpen(false);
    const action = pendingAction; setPendingAction(null);
    if (!action) return;
    try { await action(); await load(); } catch (e) { setMessage(e?.message || 'The requested action failed.'); }
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray">Loading provider banking…</div>;
  if (!account) return <div className="rounded-3xl border border-dashed border-border p-7 text-center text-sm text-gray">No live provider-backed account is connected. Nothing is simulated.</div>;

  return <div className="space-y-6">
    <section className="rounded-[28px] bg-[#0B2342] text-white p-5 shadow-xl">
      <p className="text-white/55 text-xs uppercase tracking-[0.16em]">Available</p>
      <p className="text-4xl font-semibold mt-2">{new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency || 'USD' }).format(available)}</p>
      <p className="text-white/55 text-xs mt-2">Unit provider account · •••• {String(account.account_number || '').slice(-4)}</p>
    </section>

    {message && <div className="rounded-2xl border border-crimson/20 bg-crimson/5 p-3 text-xs text-red-400">{message}</div>}

    <section className="grid grid-cols-4 gap-2">
      <Action icon={Send} label="Send" onClick={() => setPanel('send')} />
      <Action icon={ArrowDownToLine} label="Request" onClick={() => setPanel('request')} />
      <Action icon={ArrowUpRight} label="Receive" onClick={() => setPanel('receive')} />
      <Action icon={History} label="History" onClick={() => setPanel('history')} />
    </section>

    <section className="rounded-3xl border border-border bg-white p-5">
      <div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold">Payment requests</h2><p className="text-xs text-gray mt-1">Requests do not move funds until the payer authorizes payment.</p></div><RefreshCw size={17} className="text-gray cursor-pointer" onClick={load}/></div>
      {requests.length === 0 ? <p className="text-sm text-gray">No payment requests.</p> : <div className="space-y-2">{requests.map(r => <div key={r.id} className="rounded-2xl bg-slate-50 p-3 flex justify-between gap-3"><div><p className="font-medium text-sm">{money(Number(r.amount || 0) * 100)}</p><p className="text-xs text-gray">{r.note || 'Payment request'} · {r.status}</p></div>{r.status === 'pending' && <button className="text-xs font-semibold text-brass" onClick={() => authorize(() => payRequest(r))}>Pay</button>}</div>)}</div>}
    </section>

    <section className="rounded-3xl border border-border bg-white p-5">
      <div className="flex justify-between items-center mb-4"><div><h2 className="font-semibold">Holds</h2><p className="text-xs text-gray mt-1">Provider-authoritative account holds.</p></div><Lock size={17} className="text-gray"/></div>
      {holds.length === 0 ? <p className="text-sm text-gray">No active or historical provider holds returned.</p> : <div className="space-y-2">{holds.slice(0, 10).map(h => <div key={h.id} className="rounded-2xl bg-slate-50 p-3 flex justify-between"><div><p className="font-medium text-sm">{money(h.attributes?.amount)}</p><p className="text-xs text-gray">{h.attributes?.description || 'Provider hold'} · {h.attributes?.status}</p></div>{h.attributes?.status === 'Active' && <button className="text-xs font-semibold text-brass" onClick={() => authorize(() => releaseHold(h.id))}><Unlock size={13} className="inline mr-1"/>Release</button>}</div>)}</div>}
    </section>

    {panel && <Panel panel={panel} account={account} user={user} transactions={transactions} close={() => setPanel(null)} onAuthorized={authorize} />}
    <SecurityPinModal open={pinOpen} onVerified={afterPin} onClose={() => { setPinOpen(false); setPendingAction(null); }} />
  </div>;

  async function releaseHold(holdId) {
    const result = await base44.functions.invoke('unitFinancialLifecycle', { action: 'release_account_hold', hold_id: holdId });
    const data = result?.data || result; if (!data?.success) throw new Error(data?.error || 'Hold release failed.');
  }

  async function payRequest(request) {
    const payer = account.provider_account_id;
    const recipientRows = await base44.entities.Account.filter({ id: request.account_id, provider: 'unit' });
    const recipient = recipientRows?.[0];
    if (!recipient?.provider_account_id) throw new Error('The requested recipient account is no longer available.');
    const result = await base44.functions.invoke('unitFinancialLifecycle', { action: 'book_transfer', provider_account_id: payer, counterparty_account_id: recipient.provider_account_id, amount_cents: Math.round(Number(request.amount) * 100), description: request.note || 'VANTORIS REQUEST' });
    const data = result?.data || result; if (!data?.success) throw new Error(data?.error || 'Payment failed.');
    await base44.entities.PaymentRequest.update(request.id, { status: data.status === 'Sent' ? 'paid' : 'accepted', provider_payment_id: data.payment_id, paid_at: new Date().toISOString() });
  }
}

function Action({ icon: Icon, label, onClick }) { return <button onClick={onClick} className="rounded-2xl border border-border bg-white p-3 flex flex-col items-center gap-2 shadow-sm"><span className="w-10 h-10 rounded-full bg-brass/10 text-brass flex items-center justify-center"><Icon size={18}/></span><span className="text-[11px] font-medium">{label}</span></button>; }

function Panel({ panel, account, user, transactions, close, onAuthorized }) {
  const [value, setValue] = useState(''); const [note, setNote] = useState(''); const [recipient, setRecipient] = useState(null); const [busy, setBusy] = useState(false); const [requestPayer, setRequestPayer] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [disputeReason, setDisputeReason] = useState('Unauthorized');

  async function findRecipient(v) {
    setTarget(null); setRecipient(null); setValue(v); if (!v.trim()) return;
    setBusy(true); try {
      const users = v.includes('@') ? await base44.entities.User.filter({ email: v.trim() }) : await base44.entities.User.filter({ phone: v.trim() });
      const found = users?.find(u => u.id !== user?.id); setRecipient(found || null);
      if (found) { const rows = await base44.entities.Account.filter({ user_id: found.id, provider: 'unit' }, '-created_date', 5); setTarget(rows?.[0] || null); }
    } catch (e) { setError(e?.message || 'Recipient lookup failed.'); } finally { setBusy(false); }
  }

  async function send() {
    if (!target?.provider_account_id || !value || Number(value) <= 0) return;
    onAuthorized(async () => {
      const result = await base44.functions.invoke('unitFinancialLifecycle', { action: 'book_transfer', provider_account_id: account.provider_account_id, counterparty_account_id: target.provider_account_id, amount_cents: Math.round(Number(value) * 100), description: note || 'VANTORIS TRANSFER' });
      const data = result?.data || result; if (!data?.success) throw new Error(data?.error || 'Transfer failed.'); close();
    });
  }

  async function request() {
    if (!target?.id || Number(requestAmount) <= 0) return;
    await base44.entities.PaymentRequest.create({ requester_user_id: user.id, payer_user_id: target.user_id, account_id: account.id, provider_account_id: account.provider_account_id, amount: Number(requestAmount), currency: 'USD', note, status: 'pending', created_at: new Date().toISOString() });
    close();
  }

  async function receive() {
    if (Number(value) <= 0) return;
    onAuthorized(async () => {
      const result = await base44.functions.invoke('unitFinancialLifecycle', { action: 'simulate_receive_ach', provider_account_id: account.provider_account_id, amount_cents: Math.round(Number(value) * 100), description: note || 'Sandbox receive' });
      const data = result?.data || result; if (!data?.success) throw new Error(data?.error || 'Sandbox receive failed.'); close();
    });
  }

  function downloadCsv() {
    const rows = [['Date','Direction','Amount','Balance','Summary']];
    for (const t of transactions) { const a = t.attributes || {}; rows.push([a.createdAt || '', a.direction || '', Number(a.amount || 0) / 100, Number(a.balance || 0) / 100, a.summary || '']); }
    const csv = rows.map(r => r.map(x => `"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `vantoris-transactions-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-3"><div className="w-full max-w-[430px] max-h-[88vh] overflow-auto rounded-[28px] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-semibold capitalize">{panel}</h2><p className="text-xs text-gray mt-1">Provider-backed financial workflow</p></div><button onClick={close}><X size={19}/></button></div>
    {error && <div className="mb-3 rounded-xl bg-crimson/5 border border-crimson/20 p-3 text-xs text-red-400">{error}</div>}
    {(panel === 'send' || panel === 'request') && <><input value={value} onChange={e=>findRecipient(e.target.value)} placeholder="Recipient email or phone" className="w-full p-3 rounded-2xl border border-border mb-3"/>{busy && <p className="text-xs text-gray mb-2">Checking Vantoris member…</p>}{recipient && <div className="rounded-2xl bg-slate-50 p-3 mb-3"><p className="font-medium text-sm">{recipient.full_name || recipient.name || recipient.email}</p><p className="text-xs text-gray mt-1">{target?.provider_account_id ? 'Provider account found' : 'No provider-backed account'}</p></div>}{panel === 'send' ? <><input type="number" min="0.01" value={target ? requestAmount : ''} onChange={e=>setRequestAmount(e.target.value)} placeholder="Amount" className="w-full p-3 rounded-2xl border border-border mb-3"/><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" className="w-full p-3 rounded-2xl border border-border mb-4"/><button disabled={!target?.provider_account_id || Number(requestAmount)<=0} onClick={send} className="w-full py-3 rounded-2xl bg-navy text-white font-semibold disabled:opacity-40">Send with security PIN</button></> : <><input type="number" min="0.01" value={requestAmount} onChange={e=>setRequestAmount(e.target.value)} placeholder="Amount" className="w-full p-3 rounded-2xl border border-border mb-3"/><input value={note} onChange={e=>setNote(e.target.value)} placeholder="What is this for?" className="w-full p-3 rounded-2xl border border-border mb-4"/><button disabled={!target?.id || Number(requestAmount)<=0} onClick={request} className="w-full py-3 rounded-2xl bg-navy text-white font-semibold disabled:opacity-40">Request payment</button></>}</>}
    {panel === 'receive' && <><div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 mb-4">Sandbox-only receive simulation. It is enabled only when the Unit API base URL is configured to Unit Sandbox. Live receiving uses the account routing/account details and never fabricates a credit.</div><input type="number" min="0.01" value={requestAmount} onChange={e=>setRequestAmount(e.target.value)} placeholder="Amount" className="w-full p-3 rounded-2xl border border-border mb-3"/><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Description" className="w-full p-3 rounded-2xl border border-border mb-4"/><button disabled={Number(requestAmount)<=0} onClick={receive} className="w-full py-3 rounded-2xl bg-navy text-white font-semibold disabled:opacity-40">Run sandbox receive</button></>}
    {panel === 'history' && <><button onClick={downloadCsv} className="w-full py-3 rounded-2xl border border-border font-semibold flex items-center justify-center gap-2 mb-4"><Download size={17}/>Download provider transaction CSV</button><div className="space-y-2">{transactions.length === 0 ? <p className="text-sm text-gray">No provider transactions returned.</p> : transactions.slice(0,20).map(t => { const a=t.attributes||{}; return <div key={t.id} className="rounded-2xl bg-slate-50 p-3 flex justify-between"><div><p className="text-sm font-medium">{a.summary || 'Provider transaction'}</p><p className="text-[11px] text-gray">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''} · {a.direction}</p></div><p className="font-semibold">{a.direction === 'Credit' ? '+' : '-'}{money(a.amount)}</p></div>; })}</div></>}
    {panel === 'history' && transactions.some(t => ['purchase','cardPurchase'].includes(String(t.type))) && <div className="mt-4 rounded-2xl border border-crimson/20 p-3"><div className="flex gap-2"><ShieldAlert size={17} className="text-red-500"/><p className="text-xs text-gray">Card dispute testing is available only for eligible provider purchase transactions in Unit Sandbox.</p></div><select value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} className="w-full mt-3 p-2 rounded-xl border border-border"><option>Unauthorized</option><option>Fraud</option><option>GoodsNotReceived</option><option>Other</option></select></div>}
  </div></div>;
}