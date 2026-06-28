import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, TrendingUp, Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const WITHDRAWAL_METHODS = ['Bank Transfer', 'Wire Transfer', 'Crypto Withdrawal', 'Internal Transfer'];

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

  const loadData = useCallback(async () => {
    const [acct, txns] = await Promise.all([
      base44.entities.Account.get(id),
      base44.entities.Transaction.filter({ account_id: id }, '-created_date', 50),
    ]);
    setAccount(acct);
    setTransactions(txns);
  }, [id]);

  useEffect(() => {
    loadData().catch(e => console.error(e)).finally(() => setLoading(false));
  }, [loadData]);

  const { containerProps, PullIndicator } = usePullToRefresh(loadData);

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
      const me = await base44.auth.me();
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();

      // Sort all transactions chronologically
      const allTxns = [...transactions].sort((a, b) =>
        new Date(a.transaction_date || a.created_date) - new Date(b.transaction_date || b.created_date)
      );

      // Filter by date range
      const filtered = allTxns.filter(t => {
        const d = new Date(t.transaction_date || t.created_date);
        if (stmtRange.from && d < new Date(stmtRange.from)) return false;
        if (stmtRange.to && d > new Date(stmtRange.to + 'T23:59:59')) return false;
        return true;
      });

      // Opening balance: sum of all transactions before the from date
      const beforeRange = stmtRange.from
        ? allTxns.filter(t => new Date(t.transaction_date || t.created_date) < new Date(stmtRange.from))
        : [];
      const openingBalance = beforeRange.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Closing balance
      const closingBalance = filtered.length > 0
        ? (filtered[filtered.length - 1].balance_after != null
          ? filtered[filtered.length - 1].balance_after
          : openingBalance + filtered.reduce((sum, t) => sum + (t.amount || 0), 0))
        : account.balance;

      // Transaction summary
      const credits = filtered.filter(t => (t.amount || 0) >= 0).reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const debits = filtered.filter(t => (t.amount || 0) < 0).reduce((s, t) => s + Math.abs(t.amount || 0), 0);

      // Reference number
      const now = new Date();
      const refDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const refRand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referenceNumber = `VST-${refDate}-${refRand}`;

      const periodText = stmtRange.from && stmtRange.to
        ? `${stmtRange.from} to ${stmtRange.to}`
        : 'All Transactions';

      // === PDF Generation ===
      doc.setFillColor(14, 26, 43);
      doc.rect(0, 0, 210, 297, 'F');

      // Institution branding
      doc.setTextColor(176, 141, 87);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('VANTORIS', 20, 25);
      doc.setFontSize(8);
      doc.setTextColor(170, 180, 195);
      doc.text('PRIVATE INSTITUTIONAL PLATFORM', 20, 31);

      // Statement title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('STATEMENT OF ACCOUNT', 130, 25);

      // Reference & timestamp
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(170, 180, 195);
      doc.text(`Reference: ${referenceNumber}`, 130, 33);
      doc.text(`Generated: ${now.toLocaleString('en-US')}`, 130, 38);
      doc.text(`Period: ${periodText}`, 130, 43);

      // Divider
      doc.setDrawColor(176, 141, 87);
      doc.setLineWidth(0.5);
      doc.line(20, 47, 190, 47);

      // Member details
      doc.setTextColor(170, 180, 195);
      doc.setFontSize(7);
      doc.text('MEMBER', 20, 55);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(me.full_name || 'Member', 20, 61);

      // Account details
      doc.setTextColor(170, 180, 195);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('ACCOUNT', 110, 55);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(account.account_name, 110, 61);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(170, 180, 195);
      doc.text(`Account Number: ${account.account_number}`, 110, 67);
      doc.text(`Account Type: ${account.account_type}`, 110, 72);

      // Balance summary box
      doc.setFillColor(36, 45, 56);
      doc.roundedRect(20, 78, 170, 24, 3, 3, 'F');
      doc.setTextColor(170, 180, 195);
      doc.setFontSize(7);
      doc.text('OPENING BALANCE', 25, 85);
      doc.text('CREDITS', 80, 85);
      doc.text('DEBITS', 120, 85);
      doc.text('CLOSING BALANCE', 155, 85);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(formatCurrency(openingBalance), 25, 93);
      doc.setTextColor(62, 76, 58);
      doc.text(formatCurrency(credits), 80, 93);
      doc.setTextColor(140, 47, 57);
      doc.text(formatCurrency(debits), 120, 93);
      doc.setTextColor(255, 255, 255);
      doc.text(formatCurrency(closingBalance), 155, 93);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(170, 180, 195);
      doc.text(`${filtered.length} transactions in period`, 25, 99);

      // Table header
      let y = 114;
      doc.setFillColor(36, 45, 56);
      doc.rect(20, y - 5, 170, 8, 'F');
      doc.setTextColor(170, 180, 195);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text('DATE', 22, y);
      doc.text('DESCRIPTION', 50, y);
      doc.text('REFERENCE', 100, y);
      doc.text('DEBIT', 140, y);
      doc.text('CREDIT', 165, y);
      y += 8;

      // Transaction history
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      filtered.forEach(txn => {
        if (y > 275) {
          doc.addPage();
          doc.setFillColor(14, 26, 43);
          doc.rect(0, 0, 210, 297, 'F');
          y = 20;
        }
        const txnDate = new Date(txn.transaction_date || txn.created_date);
        doc.setTextColor(170, 180, 195);
        doc.text(txnDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }), 22, y);
        doc.setTextColor(255, 255, 255);
        doc.text((txn.description || txn.type).substring(0, 25), 50, y);
        doc.setTextColor(170, 180, 195);
        doc.text((txn.reference || '-').substring(0, 18), 100, y);
        if (txn.amount < 0) {
          doc.setTextColor(140, 47, 57);
          doc.text(formatCurrency(Math.abs(txn.amount)), 140, y);
          doc.text('-', 168, y);
        } else {
          doc.text('-', 143, y);
          doc.setTextColor(62, 76, 58);
          doc.text(formatCurrency(Math.abs(txn.amount)), 165, y);
        }
        doc.setDrawColor(36, 45, 56);
        doc.line(20, y + 2, 190, y + 2);
        y += 7;
      });

      // Page numbers and footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(176, 141, 87);
        doc.setFontSize(7);
        doc.text('SECURE. TRUSTED. TAILORED FOR YOU.', 20, 287);
        doc.setTextColor(170, 180, 195);
        doc.text('VANTORIS — Elevating Your Financial World.', 20, 292);
        doc.text(`Page ${i} of ${pageCount}`, 170, 292);
        doc.text(referenceNumber, 90, 292);
      }

      // Download
      doc.save(`Vantoris_Statement_${account.account_number}.pdf`);

      // Automatic archive: upload and save to Member Documents
      try {
        const blob = doc.output('blob');
        const file = new File([blob], `statement_${referenceNumber}.pdf`, { type: 'application/pdf' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.Document.create({
          user_id: me.id,
          title: `Account Statement — ${periodText}`,
          type: 'statement',
          file_url,
          reference_number: referenceNumber,
          account_id: account.id,
          statement_period: periodText,
          status: 'active',
        });
      } catch (archiveErr) {
        console.error('Statement archive failed:', archiveErr);
      }
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
    <div className="px-5 pt-6 vantoris-scroll" {...containerProps}>
      <PullIndicator />
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
              <Select
                value={wForm.method}
                onValueChange={val => setWForm({ ...wForm, method: val })}
              >
                <SelectTrigger className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#242D38] border-[#242D38] max-h-60">
                  {WITHDRAWAL_METHODS.map(method => (
                    <SelectItem key={method} value={method} className="text-white focus:bg-brass/15 focus:text-brass">
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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