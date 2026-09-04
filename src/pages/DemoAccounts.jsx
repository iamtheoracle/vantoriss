import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Check, CreditCard, QrCode, Send, ShieldCheck, Wallet, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { buildDemoFinancialState } from '@/lib/demoFinancials';

export default function DemoAccounts({ user }) {
  const demo = buildDemoFinancialState(user);
  const [panel, setPanel] = useState(null);
  const account = demo.accounts[0];
  const card = demo.cards[0];
  const portfolio = demo.portfolios[0];

  return (
    <div className="px-5 pt-2 pb-28 max-w-[430px] mx-auto">
      <div className="rounded-2xl border border-brass/25 bg-brass/5 px-4 py-3 mb-5 flex gap-3">
        <ShieldCheck size={18} className="text-brass mt-0.5 shrink-0" />
        <div><p className="text-sm font-semibold">Vantoris demonstration</p><p className="text-xs text-gray mt-1">This is an interactive preview. The displayed funds, card and portfolio are not real and cannot move money.</p></div>
      </div>

      <section className="rounded-[28px] bg-[#0B2342] text-white p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-brass/10" />
        <p className="text-white/55 text-xs uppercase tracking-[0.18em]">Available</p>
        <p className="text-4xl font-semibold mt-2">{formatCurrency(account.available_balance)}</p>
        <p className="text-white/55 text-xs mt-2">{account.account_name}</p>
        <div className="mt-5 pt-4 border-t border-white/10 flex justify-between"><span className="text-white/60 text-xs">Portfolio</span><span className="font-semibold">{formatCurrency(portfolio.total_value)}</span></div>
      </section>

      <section className="grid grid-cols-4 gap-2 mt-5 mb-7">
        {[["send", "Send", Send], ["request", "Request", ArrowDownToLine], ["add", "Add money", ArrowUpRight], ["qr", "QR", QrCode]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setPanel(id)} className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white border border-border shadow-sm"><span className="w-11 h-11 rounded-full bg-brass/10 text-brass flex items-center justify-center"><Icon size={19} /></span><span className="text-[11px] font-medium">{label}</span></button>
        ))}
      </section>

      <section className="mb-6"><h2 className="font-semibold mb-3">Accounts</h2><button onClick={() => setPanel('account')} className="w-full text-left bg-white border border-border rounded-[24px] p-4 shadow-sm flex items-center gap-3"><span className="w-11 h-11 rounded-2xl bg-navy/5 text-navy flex items-center justify-center"><Wallet size={20} /></span><span className="flex-1"><span className="block font-semibold">{account.account_name}</span><span className="block text-xs text-gray mt-0.5">Checking · •••• {account.account_number.slice(-4)}</span></span><span className="text-right"><span className="block font-semibold">{formatCurrency(account.available_balance)}</span><span className="text-[11px] text-brass">Demonstration</span></span></button></section>

      <section className="mb-6"><h2 className="font-semibold mb-3">Cards</h2><button onClick={() => setPanel('card')} className="w-full text-left relative overflow-hidden rounded-[26px] p-5 min-h-[190px] text-white shadow-2xl bg-gradient-to-br from-[#0A2140] via-[#122F53] to-[#07162A]"><div className="absolute -right-10 -top-10 w-32 h-32 rounded-full border border-brass/25"/><div className="flex justify-between"><span className="text-sm font-semibold tracking-[0.18em]">VANTORIS</span><CreditCard size={22} className="text-white/70" /></div><div className="mt-10 text-lg tracking-[0.22em]">•••• •••• •••• {card.last4}</div><div className="mt-5 flex justify-between"><div><p className="text-[9px] uppercase text-white/45">Cardholder</p><p className="text-xs mt-1 uppercase">{card.cardholder_name}</p></div><div><p className="text-[9px] uppercase text-white/45">Type</p><p className="text-xs mt-1 capitalize">{card.card_type}</p></div></div></button></section>

      <section className="rounded-[26px] bg-white border border-border p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.16em] text-gray">Wealth</p><div className="flex justify-between items-center mt-1"><h2 className="text-xl font-semibold">Investment portfolio</h2><span className="text-xs text-brass font-semibold">Preview</span></div><p className="text-3xl font-semibold mt-5">{formatCurrency(portfolio.total_value)}</p><p className="text-xs text-gray mt-1">Shows how connected investment value will appear alongside banking.</p></section>

      {panel && <DemoPanel panel={panel} onClose={() => setPanel(null)} account={account} card={card} />}
    </div>
  );
}

function DemoPanel({ panel, onClose, account, card }) {
  const titles = { send: 'Send money', request: 'Request money', add: 'Add money', qr: 'QR payments', account: 'Account details', card: 'Card details' };
  return <div className="fixed inset-0 z-50 bg-black/45 flex items-end justify-center"><div className="w-full max-w-[430px] rounded-t-[30px] bg-white p-5 pb-8 shadow-2xl"><div className="flex items-center justify-between mb-5"><div><p className="text-xs text-brass uppercase tracking-[0.16em]">Demonstration</p><h2 className="text-xl font-semibold mt-1">{titles[panel]}</h2></div><button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><X size={18}/></button></div>
    {panel === 'send' && <DemoTransfer title="Send money" action="Review transfer" />}
    {panel === 'request' && <DemoTransfer title="Request money" action="Review request" />}
    {panel === 'add' && <div className="rounded-2xl bg-slate-50 p-5 text-sm text-gray">Choose a funding source here in the real product. In this demonstration, no bank connection or deposit is created.</div>}
    {panel === 'qr' && <div className="text-center"><div className="w-48 h-48 mx-auto rounded-2xl border-4 border-navy flex items-center justify-center"><QrCode size={120} className="text-navy"/></div><p className="font-semibold mt-4">Receive with Vantoris QR</p><p className="text-xs text-gray mt-1">The live version resolves an enrolled recipient and then starts the authorized payment flow.</p></div>}
    {panel === 'account' && <div className="rounded-2xl bg-slate-50 p-4 space-y-3 text-sm"><Detail label="Account" value={account.account_name}/><Detail label="Available" value={formatCurrency(account.available_balance)}/><Detail label="Account number" value={`•••• ${account.account_number.slice(-4)}`}/><Detail label="Routing" value="Available after live provider connection"/><Detail label="Status" value="Demonstration"/></div>}
    {panel === 'card' && <div className="rounded-2xl bg-slate-50 p-4 space-y-3 text-sm"><Detail label="Card" value="Vantoris debit card"/><Detail label="Number" value={`•••• ${card.last4}`}/><Detail label="Status" value="Demonstration"/><Detail label="Real authorization" value="Disabled"/></div>}
  </div></div>;
}

function DemoTransfer({ title, action }) { const [amount, setAmount] = useState(''); return <div className="space-y-4"><div><label className="text-xs text-gray uppercase tracking-[0.14em] block mb-2">Recipient</label><input className="w-full py-3 px-3 rounded-2xl border border-border" placeholder="Demo recipient" /></div><div><label className="text-xs text-gray uppercase tracking-[0.14em] block mb-2">Amount</label><input value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full py-3 px-3 rounded-2xl border border-border" placeholder="0.00" /></div><button onClick={() => window.alert(`${title} preview only — no money moved.`)} className="w-full py-3.5 rounded-2xl bg-[#0B2342] text-white font-semibold">{action}</button><p className="text-xs text-gray text-center">Preview only. No transaction is created.</p></div>; }
function Detail({ label, value }) { return <div className="flex justify-between gap-4"><span className="text-gray">{label}</span><span className="font-medium text-right">{value}</span></div>; }
