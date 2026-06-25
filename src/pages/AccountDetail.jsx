import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, TrendingUp, Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wForm, setWForm] = useState({ amount: '', method: 'Bank Transfer', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [stmtRange, setStmtRange] = useState({ from: '', to: '' });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [acct, txns] = await Promise.all([
        base44.entities.Account.get(id),
        base44.entities.Transaction.filter({ account_id: id }, '-created_date', 50),
      ]);
      setAccount(acct);
      setTransactions(txns);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleWithdraw() {
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.WithdrawalRequest.create({
        account_id: id,
        user_id: me.id,
        amount: parseFloat(wForm.amount),
        method: wForm.method,
        notes: wForm.notes,
        status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: me.id,
        title: 'Withdrawal Requested',
        message: `Your withdrawal request of ${formatCurrency(parseFloat(wForm.amount))} is pending review.`,
        type: 'info',
      });
      setShowWithdraw(false);
      setWForm({ amount: '', method: 'Bank Transfer', notes: '' });
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  async function generateStatement() {
    setGeneratingPdf(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      const filtered = transactions.filter(t => {
        const d = new Date(t.created_date);
        if (stmtRange.from && d < new Date(stmtRange.from)) return false;
        if (stmtRange.to && d > new Date(stmtRange.to + 'T23:59:59')) return false;
        return true;
      });

      doc.setFillColor(14, 26, 43);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setTextColor(176, 141, 87);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('VANTORIS', 20, 25);
      doc.setFontSize(8);
      doc.setTextColor(170, 180, 195);
      doc.text('PRIVATE INSTITUTIONAL PLATFORM', 20, 31);

      doc.setTextColor(170, 180, 195);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('STATEMENT OF ACCOUNT', 130, 25);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const periodText = stmtRange.from && stmtRange.to
        ? `${stmtRange.from} to ${stmtRange.to}`
        : 'All Transactions';
      doc.text(`Statement Period: ${periodText}`, 130, 33);

      doc.setDrawColor(176, 141, 87);
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(account.account_name, 20, 50);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(170, 180, 195);
      doc.text(`Account: ${account.account_number}`, 20, 56);
      doc.text(`Type: ${account.account_type}`, 20, 62);

      doc.setFillColor(36, 45, 56);
      doc.roundedRect(130, 44, 60, 20, 3, 3, 'F');
      doc.setTextColor(170, 180, 195);
      doc.setFontSize(8);
      doc.text('Current Balance', 135, 51);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(formatCurrency(account.balance), 135, 60);

      // Table header
      let y = 78;
      doc.setFillColor(36, 45, 56);
      doc.rect(20, y - 5, 170, 8, 'F');
      doc.setTextColor(170, 180, 195);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text('DATE', 22, y);
      doc.text('DESCRIPTION', 50, y);
      doc.text('REFERENCE', 100, y);
      doc.text('DEBIT (USD)', 132, y);
      doc.text('CREDIT (USD)', 158, y);
      y += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      filtered.forEach(txn => {
        if (y > 270) { doc.addPage(); doc.setFillColor(14, 26, 43); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
        doc.setTextColor(170, 180, 195);
        doc.text(new Date(txn.created_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }), 22, y);
        doc.setTextColor(255, 255, 255);
        doc.text((txn.description || txn.type).substring(0, 25), 50, y);
        doc.setTextColor(170, 180, 195);
        doc.text((txn.reference || '-').substring(0, 18), 100, y);
        if (txn.type === 'withdrawal') {
          doc.setTextColor(140, 47, 57);
          doc.text(formatCurrency(Math.abs(txn.amount)), 132, y);
          doc.text('-', 162, y);
        } else {
          doc.text('-', 137, y);
          doc.setTextColor(62, 76, 58);
          doc.text(formatCurrency(Math.abs(txn.amount)), 158, y);
        }
        doc.setDrawColor(36, 45, 56);
        doc.line(20, y + 2, 190, y + 2);
        y += 7;
      });

      // Footer
      doc.setTextColor(176, 141, 87);
      doc.setFontSize(7);
      doc.text('SECURE. TRUSTED. TAILORED FOR YOU.', 20, 287);
      doc.setTextColor(170, 180, 195);
      doc.text('VANTORIS - Elevating Your Financial World.', 20, 292);

      doc.save(`Vantoris_Statement_${account.account_number}.pdf`);
    } catch (e) { console.error(e); }
    setGeneratingPdf(false);
    setShowStatement(false);
  }

  if (loading || !account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <button onClick={() => navigate('/accounts')} className="flex items-center gap-2 text-[#AAB4C3] text-sm mb-6">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      {/* Balance Card */}
      <div className="vantoris-card p-6 mb-5 relative overflow-hidden">
        <div className="vantoris-balance-glow absolute inset-0" />
        <div className="relative z-10">
          <p className="text-[#AAB4C3] text-xs">{account.account_name}</p>
          <p className="text-[#AAB4C3]/60 text-[11px] mb-2">{account.account_number}</p>
          <p className="text-[#AAB4C3] text-[10px] uppercase tracking-widest mb-1">Available Balance</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(account.balance)}</h2>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowWithdraw(true)}
          className="flex-1 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl text-sm hover:bg-brass/90 transition-all flex items-center justify-center gap-2"
        >
          <ArrowUpRight size={16} />
          Withdraw
        </button>
        <button
          onClick={() => setShowStatement(true)}
          className="flex-1 py-3 bg-[#242D38] text-white font-medium rounded-xl text-sm hover:bg-[#2a3340] transition-all flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Statement
        </button>
      </div>

      {/* Transaction History */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Transaction History</h3>
        <span className="text-[#AAB4C3] text-xs">{transactions.length} records</span>
      </div>

      {transactions.length === 0 ? (
        <div className="vantoris-card p-6 text-center">
          <FileText size={24} className="text-[#AAB4C3] mx-auto mb-2" />
          <p className="text-[#AAB4C3] text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-0">
          {transactions.map(txn => (
            <div key={txn.id} className="flex items-center justify-between py-3.5 border-b border-[#242D38]/60 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  txn.type === 'deposit' || txn.type === 'opening_balance'
                    ? 'bg-olive/20'
                    : txn.type === 'withdrawal'
                    ? 'bg-crimson/15'
                    : 'bg-brass/15'
                }`}>
                  {txn.type === 'deposit' || txn.type === 'opening_balance'
                    ? <ArrowDownLeft size={15} className="text-emerald-400" />
                    : txn.type === 'withdrawal'
                    ? <ArrowUpRight size={15} className="text-red-400" />
                    : <TrendingUp size={15} className="text-brass" />
                  }
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{txn.description || txn.type.replace('_', ' ')}</p>
                  <p className="text-[#AAB4C3] text-[11px]">
                    {new Date(txn.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${txn.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {txn.type === 'withdrawal' ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                </p>
                {txn.balance_after != null && (
                  <p className="text-[#AAB4C3] text-[10px]">Bal: {formatCurrency(txn.balance_after)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Request Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
              <input
                type="number"
                value={wForm.amount}
                onChange={e => setWForm({ ...wForm, amount: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Method</label>
              <select
                value={wForm.method}
                onChange={e => setWForm({ ...wForm, method: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
              >
                <option>Bank Transfer</option>
                <option>Wire Transfer</option>
                <option>Crypto Withdrawal</option>
                <option>Internal Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Notes</label>
              <textarea
                value={wForm.notes}
                onChange={e => setWForm({ ...wForm, notes: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none"
                rows={3}
              />
            </div>
            <button
              disabled={!wForm.amount || parseFloat(wForm.amount) <= 0 || submitting}
              onClick={handleWithdraw}
              className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statement Dialog */}
      <Dialog open={showStatement} onOpenChange={setShowStatement}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Download Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">From Date</label>
              <input
                type="date"
                value={stmtRange.from}
                onChange={e => setStmtRange({ ...stmtRange, from: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">To Date</label>
              <input
                type="date"
                value={stmtRange.to}
                onChange={e => setStmtRange({ ...stmtRange, to: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <button
              onClick={generateStatement}
              disabled={generatingPdf}
              className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40"
            >
              {generatingPdf ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}