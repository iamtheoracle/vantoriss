import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeftRight, Send, CreditCard, QrCode, FileCheck,
  DollarSign, Wallet, X, ArrowRight, CheckCircle2,
} from 'lucide-react';
import FeatureGate from '@/components/vantoris/FeatureGate';

const SECTIONS = [
  {
    title: 'Transfers',
    items: [
      { id: 'internal', label: 'Internal Transfer', desc: 'Move money between your Vantoris accounts', icon: ArrowLeftRight, route: '/accounts', color: 'bg-brass/10 text-brass' },
      { id: 'zelle', label: 'Zelle®', desc: 'Send money with Zelle', icon: Send, color: 'bg-purple-500/10 text-purple-600' },
      { id: 'add-money', label: 'Add Money', desc: 'Fund your account', icon: DollarSign, route: '/accounts', color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'withdraw', label: 'Withdraw Funds', desc: 'Withdraw from your account', icon: Wallet, route: '/accounts', color: 'bg-crimson/10 text-crimson' },
    ],
  },
  {
    title: 'Deposits & Payments',
    items: [
      { id: 'deposit-check', label: 'Deposit Check', desc: 'Deposit a check by photo', icon: FileCheck, color: 'bg-brass/10 text-brass' },
      { id: 'qr', label: 'QR Code Payment', desc: 'Pay or receive via QR code', icon: QrCode, color: 'bg-brass/10 text-brass' },
    ],
  },
];

export default function MoveMoney() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const activeTab = searchParams.get('tab');

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const accts = await base44.entities.Account.filter({ user_id: me.id }, '-created_date');
        setAccounts(accts);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (activeTab) {
      setSelectedFeature(activeTab);
    }
  }, [activeTab]);

  function handleItemClick(item) {
    if (item.route) {
      navigate(item.route);
      return;
    }
    setSelectedFeature(item.id);
    setSearchParams({ tab: item.id });
  }

  function handleClosePanel() {
    setSelectedFeature(null);
    setSearchParams({});
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <FeatureGate featureName="Move Money">
      <div className="px-5 pt-6 pb-4">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">Move Money</h1>
          <p className="text-gray text-sm mt-0.5">Transfers, payments & deposits</p>
        </div>

        {!loading && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="vantoris-balance-hero p-5 mb-5"
          >
            <p className="text-white/60 text-xs uppercase tracking-wider">Available Balance</p>
            <p className="text-white text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
            <p className="text-white/50 text-xs mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </motion.div>
        )}

        {SECTIONS.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
            className="mb-5"
          >
            <h2 className="text-foreground font-semibold text-sm mb-3 px-1">{section.title}</h2>
            <div className="vantoris-glass-premium overflow-hidden">
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                const isActive = selectedFeature === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors ${
                      idx > 0 ? 'border-t border-border/50' : ''
                    } ${isActive ? 'bg-brass/5' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-foreground font-medium text-sm">{item.label}</p>
                      <p className="text-gray text-xs truncate">{item.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray/40 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {selectedFeature && !SECTIONS.flatMap(s => s.items).find(i => i.id === selectedFeature && i.route) && (
          <FeaturePanel
            featureId={selectedFeature}
            accounts={accounts}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </FeatureGate>
  );
}

function FeaturePanel({ featureId, accounts, onClose }) {
  const feature = SECTIONS.flatMap(s => s.items).find(i => i.id === featureId);
  if (!feature) return null;
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="vantoris-glass-premium w-full sm:max-w-md p-5 rounded-t-3xl sm:rounded-3xl safe-bottom"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-base">{feature.label}</h3>
              <p className="text-gray text-xs">{feature.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-gray" />
          </button>
        </div>

        {featureId === 'zelle' ? (
          <ZellePanel accounts={accounts} onClose={onClose} />
        ) : featureId === 'qr' ? (
          <QrPanel accounts={accounts} />
        ) : featureId === 'deposit-check' ? (
          <DepositCheckPanel accounts={accounts} onClose={onClose} />
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function ZellePanel({ accounts, onClose }) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  async function handleSend() {
    if (!amount || !recipient || !selectedAccountId) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    if (amt > (account.balance || 0)) {
      toast({ title: 'Insufficient Funds', description: 'The selected account does not have enough balance for this transfer.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const newBalance = (account.balance || 0) - amt;

      await base44.entities.Transaction.create({
        account_id: selectedAccountId,
        type: 'withdrawal',
        amount: amt,
        description: `Zelle transfer to ${recipient}`,
        reference: `ZELLE-${Date.now()}`,
        balance_after: newBalance,
      });

      await base44.entities.Account.update(selectedAccountId, { balance: newBalance });

      await base44.entities.Notification.create({
        user_id: account.user_id,
        title: 'Transfer Initiated',
        message: `Your Zelle transfer of $${amt.toFixed(2)} to ${recipient} has been initiated and is processing.`,
        type: 'info',
      });

      setResult({ success: true, amount: amt, recipient, newBalance });
      toast({ title: 'Transfer Initiated', description: `$${amt.toFixed(2)} transfer to ${recipient} is processing.` });
    } catch (e) {
      toast({ title: 'Transfer Failed', description: e.message || 'Unable to complete this transfer. Please try again.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto bg-mint/10 rounded-2xl flex items-center justify-center mb-3">
          <CheckCircle2 size={28} className="text-mint" />
        </div>
        <p className="text-foreground font-semibold text-sm">Transfer Initiated</p>
        <p className="text-gray text-xs mt-1">{formatCurrency(result.amount)} to {result.recipient}</p>
        <p className="text-gray text-[10px] mt-2">New balance: {formatCurrency(result.newBalance)}</p>
        <button onClick={onClose} className="mt-4 px-6 py-2.5 bg-navy text-white font-semibold rounded-xl text-sm">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-3">
        <p className="text-purple-700 text-xs leading-relaxed">
          Zelle® is a fast way to send and receive money with people you trust. Enter the recipient's email or phone number and the amount to send.
        </p>
      </div>
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">From Account</label>
        <select
          value={selectedAccountId}
          onChange={e => setSelectedAccountId(e.target.value)}
          className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
        >
          <option value="">Select an account...</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.account_name} · {formatCurrency(a.balance || 0)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Recipient Email or Phone</label>
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="name@email.com or +1 (555) 555-5555"
          className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white border border-border rounded-xl pl-7 pr-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={!amount || !recipient || !selectedAccountId || submitting}
        className="w-full py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-brass/90 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
        ) : (
          <>Review & Send</>
        )}
      </button>
      <p className="text-gray text-[10px] text-center leading-relaxed">
        By sending money with Zelle®, you agree to the terms. Only send money to those you trust.
      </p>
    </div>
  );
}

function QrPanel({ accounts }) {
  const [mode, setMode] = useState('receive');

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setMode('receive')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'receive' ? 'bg-white text-brass shadow-sm' : 'text-gray'}`}
        >Receive</button>
        <button
          onClick={() => setMode('pay')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'pay' ? 'bg-white text-brass shadow-sm' : 'text-gray'}`}
        >Pay</button>
      </div>
      {mode === 'receive' ? (
        <div className="text-center py-4">
          <div className="w-48 h-48 mx-auto bg-white border-2 border-border rounded-2xl flex items-center justify-center">
            <QrCode size={160} className="text-foreground" />
          </div>
          <p className="text-foreground font-medium text-sm mt-3">Your Payment QR Code</p>
          <p className="text-gray text-xs">Show this to receive payments</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto bg-brass/10 rounded-2xl flex items-center justify-center mb-3">
            <QrCode size={36} className="text-brass" />
          </div>
          <button className="px-6 py-2.5 bg-brass text-white font-semibold rounded-xl text-sm hover:bg-brass/90 transition-all">
            Open Scanner
          </button>
          <p className="text-gray text-xs mt-3">Scan a QR code to pay instantly</p>
        </div>
      )}
    </div>
  );
}

function DepositCheckPanel({ accounts, onClose }) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  async function handleDeposit() {
    if (!selectedAccountId || !amount || !frontPhoto || !backPhoto) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    setSubmitting(true);
    try {
      const account = accounts.find(a => a.id === selectedAccountId);
      const { file_url: frontUrl } = await base44.integrations.Core.UploadFile({ file: frontPhoto });
      const { file_url: backUrl } = await base44.integrations.Core.UploadFile({ file: backPhoto });

      await base44.entities.VerificationRequest.create({
        user_id: account.user_id,
        account_id: selectedAccountId,
        amount: amt,
        method: 'Mobile Check Deposit',
        reference: `CHK-${Date.now()}`,
        deposit_account_details: JSON.stringify({ front: frontUrl, back: backUrl }),
      });

      await base44.entities.Notification.create({
        user_id: account.user_id,
        title: 'Check Deposit Submitted',
        message: `Your check deposit of ${formatCurrency(amt)} has been submitted for review. You will be notified once processed.`,
        type: 'info',
      });

      setResult({ success: true, amount: amt });
      toast({ title: 'Deposit Submitted', description: 'Your check deposit is under review.' });
    } catch (e) {
      toast({ title: 'Deposit Failed', description: e.message || 'Unable to submit your deposit. Please try again.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto bg-mint/10 rounded-2xl flex items-center justify-center mb-3">
          <CheckCircle2 size={28} className="text-mint" />
        </div>
        <p className="text-foreground font-semibold text-sm">Deposit Submitted</p>
        <p className="text-gray text-xs mt-1">{formatCurrency(result.amount)} check deposit</p>
        <p className="text-gray text-[10px] mt-2">Your deposit is under review. Funds will be available once approved.</p>
        <button onClick={onClose} className="mt-4 px-6 py-2.5 bg-navy text-white font-semibold rounded-xl text-sm">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">To Account</label>
        <select
          value={selectedAccountId}
          onChange={e => setSelectedAccountId(e.target.value)}
          className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
        >
          <option value="">Select an account...</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.account_name} · {formatCurrency(a.balance || 0)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Check Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white border border-border rounded-xl pl-7 pr-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="cursor-pointer">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFrontPhoto(e.target.files?.[0])} />
          <div className={`py-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${frontPhoto ? 'bg-mint/10 text-mint border border-mint/20' : 'bg-slate-100 text-gray hover:bg-slate-200'}`}>
            <FileCheck size={20} /> {frontPhoto ? 'Front ✓' : 'Front'}
          </div>
        </label>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setBackPhoto(e.target.files?.[0])} />
          <div className={`py-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${backPhoto ? 'bg-mint/10 text-mint border border-mint/20' : 'bg-slate-100 text-gray hover:bg-slate-200'}`}>
            <FileCheck size={20} /> {backPhoto ? 'Back ✓' : 'Back'}
          </div>
        </label>
      </div>
      <button
        onClick={handleDeposit}
        disabled={!selectedAccountId || !amount || !frontPhoto || !backPhoto || submitting}
        className="w-full py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-brass/90 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
        ) : (
          <>Submit Deposit</>
        )}
      </button>
    </div>
  );
}