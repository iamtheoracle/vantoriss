import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Plus, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatCurrency';

const TRADING_CHARTS = [
  { symbol: 'EURUSD', type: 'Forex', name: 'EUR/USD' },
  { symbol: 'GBPUSD', type: 'Forex', name: 'GBP/USD' },
  { symbol: 'USDJPY', type: 'Forex', name: 'USD/JPY' },
  { symbol: 'AAPL', type: 'Stocks', name: 'Apple Inc.' },
  { symbol: 'TSLA', type: 'Stocks', name: 'Tesla Inc.' },
  { symbol: 'GOOGL', type: 'Stocks', name: 'Google (Alphabet)' },
  { symbol: 'MSFT', type: 'Stocks', name: 'Microsoft' },
  { symbol: 'AMZN', type: 'Stocks', name: 'Amazon' },
  { symbol: 'SPY', type: 'Stocks', name: 'S&P 500 ETF' },
];

export default function Trading() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState(TRADING_CHARTS[0]);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ account_type: 'Forex', account_name: '', initial_balance: '' });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    const user = await base44.auth.me();
    const accts = await base44.entities.TradingAccount.filter({ user_id: user.id }, '-created_date', 10);
    setAccounts(accts);
    setLoading(false);
  }

  async function createAccount() {
    if (!newAccount.account_name) return;
    setCreating(true);
    try {
      const user = await base44.auth.me();
      const accountNum = `TRD-${Date.now()}`;
      const account = await base44.entities.TradingAccount.create({
        user_id: user.id,
        account_number: accountNum,
        account_name: newAccount.account_name,
        account_type: newAccount.account_type,
        balance: parseFloat(newAccount.initial_balance) || 0,
        equity: parseFloat(newAccount.initial_balance) || 0,
        margin_available: (parseFloat(newAccount.initial_balance) || 0) * 20,
        status: 'active',
        leverage: 1,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: `${newAccount.account_type} Trading Account Created`,
        message: `Your ${newAccount.account_type} trading account has been activated. Account: ${accountNum}`,
        type: 'success',
      });
      setShowCreateAccount(false);
      setNewAccount({ account_type: 'Forex', account_name: '', initial_balance: '' });
      loadAccounts();
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Trading</h1>
        <p className="text-[#AAB4C3] text-sm">Manage your forex, stocks & trading accounts</p>
      </div>

      {/* Trading Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Your Trading Accounts</h2>
          <button
            onClick={() => setShowCreateAccount(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brass text-[#0E1A2B] rounded-lg text-xs font-semibold hover:bg-brass/90 transition-all"
          >
            <Plus size={14} /> New Account
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="vantoris-card p-8 text-center">
            <TrendingUp size={32} className="text-brass/40 mx-auto mb-3" />
            <p className="text-[#AAB4C3] text-sm mb-4">No trading accounts yet</p>
            <button
              onClick={() => setShowCreateAccount(true)}
              className="px-4 py-2 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all"
            >
              Create First Account
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {accounts.map(account => (
              <div key={account.id} className="vantoris-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{account.account_name}</p>
                    <p className="text-[#AAB4C3] text-xs">{account.account_type} • {account.account_number}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${account.status === 'active' ? 'bg-olive/20 text-emerald-400' : 'bg-slate/50 text-gray'}`}>
                    {account.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1a2535] rounded-lg p-2.5">
                    <p className="text-[#AAB4C3] text-xs mb-1">Balance</p>
                    <p className="text-white font-semibold text-sm">{formatCurrency(account.balance)}</p>
                  </div>
                  <div className="bg-[#1a2535] rounded-lg p-2.5">
                    <p className="text-[#AAB4C3] text-xs mb-1">Available Margin</p>
                    <p className="text-white font-semibold text-sm">{formatCurrency(account.margin_available)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Market Charts */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Live Market Charts</h2>

        {/* Chart Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TRADING_CHARTS.map(chart => (
            <button
              key={chart.symbol}
              onClick={() => setSelectedChart(chart)}
              className={`p-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedChart.symbol === chart.symbol
                  ? 'bg-brass text-[#0E1A2B] border-brass'
                  : 'bg-[#242D38] text-[#AAB4C3] border-[#242D38] hover:border-brass/50'
              } border`}
            >
              <p className="font-semibold">{chart.symbol}</p>
              <p className="text-[10px] opacity-70">{chart.type}</p>
            </button>
          ))}
        </div>

        {/* TradingView Chart Embed */}
        <div className="vantoris-card overflow-hidden">
          <div className="bg-[#1a2535] p-4 border-b border-[#242D38]">
            <p className="text-white font-semibold text-sm">{selectedChart.name} ({selectedChart.symbol})</p>
            <p className="text-[#AAB4C3] text-xs mt-1">{selectedChart.type} • Live Market Data</p>
          </div>
          <div className="relative w-full h-96 bg-[#0E1A2B]">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${selectedChart.symbol}&symbol=${selectedChart.symbol}&interval=D&timezone=Etc%2FUTC&theme=dark&style=1&locale=en&hide_legend=false&withdateranges=true`}
              title={`${selectedChart.symbol} Chart`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>

        {/* Market Info */}
        <div className="bg-[#242D38]/50 border border-[#242D38] rounded-lg p-4 mt-4">
          <p className="text-[#AAB4C3] text-xs">
            <span className="text-brass font-medium">📊 Live Data:</span> Charts powered by TradingView. {selectedChart.type === 'Forex' ? 'Major currency pairs with real-time forex data.' : 'Stock prices updated during market hours.'}
          </p>
        </div>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-brass" />
              Create Trading Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Account Type</label>
              <select
                value={newAccount.account_type}
                onChange={e => setNewAccount({ ...newAccount, account_type: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none"
              >
                <option value="Forex">Forex</option>
                <option value="Stocks">Stocks</option>
                <option value="Crypto">Crypto</option>
                <option value="Mixed">Mixed (All Asset Classes)</option>
              </select>
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Account Name</label>
              <input
                type="text"
                value={newAccount.account_name}
                onChange={e => setNewAccount({ ...newAccount, account_name: e.target.value })}
                placeholder="e.g., My Forex Trading"
                className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2 block">Initial Balance (USD)</label>
              <input
                type="number"
                value={newAccount.initial_balance}
                onChange={e => setNewAccount({ ...newAccount, initial_balance: e.target.value })}
                placeholder="0.00"
                className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <button
              disabled={creating}
              onClick={createAccount}
              className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-lg disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}