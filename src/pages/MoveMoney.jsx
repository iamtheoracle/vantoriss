import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  ArrowLeftRight, Send, Download, CreditCard, Building2, Globe,
  QrCode, Bitcoin, RefreshCw, Calendar, Repeat, Users, FileCheck,
  DollarSign, Landmark, Wallet, X, ArrowRight,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Transfers',
    items: [
      { id: 'internal', label: 'Internal Transfer', desc: 'Move money between your Vantoris accounts', icon: ArrowLeftRight, route: '/accounts', color: 'bg-brass/10 text-brass' },
      { id: 'send', label: 'Send Money', desc: 'Send to another Vantoris member', icon: Send, color: 'bg-blue-500/10 text-blue-600' },
      { id: 'request', label: 'Request Money', desc: 'Request payment from someone', icon: Download, color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'external', label: 'External Bank Transfer', desc: 'Transfer to/from external banks', icon: Landmark, color: 'bg-purple-500/10 text-purple-600' },
    ],
  },
  {
    title: 'Wires & ACH',
    items: [
      { id: 'ach', label: 'ACH Transfer', desc: 'Standard bank-to-bank transfer', icon: CreditCard, color: 'bg-brass/10 text-brass' },
      { id: 'domestic', label: 'Domestic Wire', desc: 'Same-day wire within the US', icon: Building2, color: 'bg-blue-500/10 text-blue-600' },
      { id: 'international', label: 'International Wire', desc: 'SWIFT wire to any country', icon: Globe, color: 'bg-indigo-500/10 text-indigo-600' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { id: 'zelle', label: 'Zelle®', desc: 'Send money with Zelle', icon: Send, color: 'bg-purple-500/10 text-purple-600' },
      { id: 'qr', label: 'QR Code Payment', desc: 'Pay or receive via QR code', icon: QrCode, color: 'bg-brass/10 text-brass' },
      { id: 'bills', label: 'Pay Bills', desc: 'Manage and pay your bills', icon: FileCheck, color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'crypto', label: 'Crypto Transfer', desc: 'Send or receive cryptocurrency', icon: Bitcoin, color: 'bg-amber-500/10 text-amber-600' },
      { id: 'currency', label: 'Currency Exchange', desc: 'Convert between currencies', icon: RefreshCw, color: 'bg-teal-500/10 text-teal-600' },
    ],
  },
  {
    title: 'Deposits & Checks',
    items: [
      { id: 'deposit-check', label: 'Deposit Check', desc: 'Deposit a check by photo', icon: FileCheck, color: 'bg-brass/10 text-brass' },
      { id: 'add-money', label: 'Add Money', desc: 'Fund your account', icon: DollarSign, route: '/accounts', color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'withdraw', label: 'Withdraw Funds', desc: 'Withdraw from your account', icon: Wallet, route: '/accounts', color: 'bg-crimson/10 text-crimson' },
    ],
  },
  {
    title: 'Scheduled & Recurring',
    items: [
      { id: 'scheduled', label: 'Scheduled Transfers', desc: 'View & manage scheduled transfers', icon: Calendar, color: 'bg-brass/10 text-brass' },
      { id: 'recurring', label: 'Recurring Transfers', desc: 'Set up automatic recurring payments', icon: Repeat, color: 'bg-blue-500/10 text-blue-600' },
      { id: 'beneficiaries', label: 'Beneficiaries', desc: 'Manage your account beneficiaries', icon: Users, color: 'bg-purple-500/10 text-purple-600' },
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
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Move Money</h1>
        <p className="text-gray text-sm mt-0.5">Transfers, wires, payments & deposits</p>
      </div>

      {/* Balance Summary */}
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

      {/* Feature Sections */}
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

      {/* Feature Panel Modal */}
      {selectedFeature && !SECTIONS.flatMap(s => s.items).find(i => i.id === selectedFeature && i.route) && (
        <FeaturePanel
          featureId={selectedFeature}
          accounts={accounts}
          onClose={handleClosePanel}
        />
      )}
    </div>
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
          <ZellePanel accounts={accounts} />
        ) : featureId === 'qr' ? (
          <QrPanel accounts={accounts} />
        ) : featureId === 'deposit-check' ? (
          <DepositCheckPanel />
        ) : (
          <ComingSoonPanel feature={feature} />
        )}
      </motion.div>
    </motion.div>
  );
}

function ZellePanel({ accounts }) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-3">
        <p className="text-purple-700 text-xs leading-relaxed">
          Zelle® is a fast and free way to send and receive money with people you trust. Available through participating financial institutions.
        </p>
      </div>
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">From Account</label>
        <select className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none">
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
          placeholder="name@email.com"
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
        disabled={!amount || !recipient}
        className="w-full py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-brass/90 transition-all"
      >
        Send with Zelle®
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

function DepositCheckPanel() {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto bg-brass/10 rounded-2xl flex items-center justify-center mb-3">
          <FileCheck size={28} className="text-brass" />
        </div>
        <p className="text-foreground font-medium text-sm">Take a photo of your check</p>
        <p className="text-gray text-xs mt-1">Front and back of the check</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="py-3 bg-slate-100 text-gray font-medium rounded-xl text-sm hover:bg-slate-200 transition-all flex flex-col items-center gap-1">
          <FileCheck size={20} /> Front
        </button>
        <button className="py-3 bg-slate-100 text-gray font-medium rounded-xl text-sm hover:bg-slate-200 transition-all flex flex-col items-center gap-1">
          <FileCheck size={20} /> Back
        </button>
      </div>
      <button className="w-full py-3 bg-brass text-white font-semibold rounded-xl text-sm hover:bg-brass/90 transition-all">
        Deposit Check
      </button>
    </div>
  );
}

function ComingSoonPanel({ feature }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto bg-brass/10 rounded-2xl flex items-center justify-center mb-3">
        <feature.icon size={28} className="text-brass" />
      </div>
      <p className="text-foreground font-semibold text-sm">{feature.label}</p>
      <p className="text-gray text-xs mt-1 leading-relaxed px-4">
        This feature is being prepared. You'll be notified when it's available.
      </p>
      <span className="inline-block mt-3 px-3 py-1 bg-brass/10 text-brass text-[10px] font-bold uppercase tracking-wider rounded-full">
        Coming Soon
      </span>
    </div>
  );
}