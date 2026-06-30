import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Check, Clock, FileText, AlertCircle } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { MessageCircle } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'Opening Contribution', label: 'Opening Contribution', desc: 'Initial deposit to activate your account' },
  { value: 'Wire Transfer', label: 'Wire Transfer', desc: 'Domestic or international wire' },
  { value: 'Crypto Deposit', label: 'Crypto Deposit', desc: 'USDT / BTC / ETH' },
  { value: 'ACH Deposit', label: 'ACH Deposit', desc: 'US bank ACH transfer' },
];

export default function OpeningContribution({ application, onUpdate }) {
  const whatsappNumber = useWhatsAppConfig();
  const [method, setMethod] = useState('Opening Contribution');
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(application?.opening_receipt_url || '');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);
    } catch (err) { console.error(err); }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!receiptUrl || !amount) return;
    setSubmitting(true);
    try {
      await base44.entities.Application.update(application.id, {
        opening_receipt_url: receiptUrl,
        opening_payment_method: method,
        opening_balance: parseFloat(amount) || 0,
        opening_contribution_status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: application.user_id,
        title: 'Opening Contribution Received',
        message: `Your opening contribution of $${amount} via ${method} has been received. Payment verification typically takes 2–3 working days. We will notify you once your account is activated.`,
        type: 'info',
      });
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  // If receipt already submitted and pending/rejected
  const contribStatus = application?.opening_contribution_status || 'not_started';

  if (contribStatus === 'pending') {
    return (
      <div className="vantoris-card p-6 mt-5">
        <div className="w-14 h-14 rounded-full bg-brass/10 flex items-center justify-center mx-auto mb-4">
          <Clock size={26} className="text-brass" />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Payment Under Verification</h3>
        <p className="text-[#AAB4C3] text-sm text-center mb-4 leading-relaxed">
          Your opening contribution receipt has been submitted and is being verified by our operations team.
          This process typically takes <span className="text-brass font-medium">2–3 working days</span>.
        </p>
        <div className="bg-[#242D38] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#AAB4C3]">Amount</span>
            <span className="text-white font-medium">${application.opening_balance || 0}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#AAB4C3]">Method</span>
            <span className="text-white font-medium">{application.opening_payment_method || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#AAB4C3]">Status</span>
            <span className="text-brass font-medium">Pending Verification</span>
          </div>
        </div>
        <p className="text-[#AAB4C3]/70 text-xs text-center mt-4">
          You will receive a notification once your payment is verified and your account is activated.
        </p>
      </div>
    );
  }

  return (
    <div className="vantoris-card p-6 mt-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-olive/20 flex items-center justify-center">
          <Check size={22} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">KYC Approved — Complete Opening</h3>
          <p className="text-[#AAB4C3] text-xs">Submit your opening contribution to activate your account</p>
        </div>
      </div>

      {contribStatus === 'rejected' && (
        <div className="flex items-start gap-2 bg-crimson/10 border border-crimson/30 rounded-xl p-3 mb-4">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs">Your previous contribution was not verified. Please re-submit with a valid payment receipt.</p>
        </div>
      )}

      {/* Payment method */}
      <div className="space-y-2 mb-4">
        <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Payment Method</label>
        {PAYMENT_METHODS.map(m => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={`vantoris-card p-3 w-full text-left flex items-center gap-3 transition-all ${
              method === m.value ? 'border-brass/50 bg-brass/5' : ''
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${method === m.value ? 'border-brass bg-brass' : 'border-[#AAB4C3]/30'}`} />
            <div>
              <p className="text-white text-sm font-medium">{m.label}</p>
              <p className="text-[#AAB4C3] text-xs">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Contribution Amount (USD)</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
          placeholder="0.00"
        />
      </div>

      {/* Receipt upload */}
      <div className="mb-4">
        <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Payment Receipt</label>
        {receiptUrl ? (
          <div className="vantoris-card p-3 flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" />
            <span className="text-white text-xs flex-1 truncate">Receipt uploaded</span>
            <button onClick={() => setReceiptUrl('')} className="text-red-400 text-xs">Remove</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-[#242D38] rounded-xl cursor-pointer hover:border-brass/30 transition-all">
            <Upload size={24} className="text-[#AAB4C3] mb-2" />
            <p className="text-white text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Receipt'}</p>
            <p className="text-[#AAB4C3] text-xs mt-1">PDF, JPG, or PNG</p>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="bg-[#242D38] rounded-xl p-3 mb-4">
        <p className="text-[#AAB4C3] text-xs flex items-start gap-2">
          <Clock size={14} className="text-brass flex-shrink-0 mt-0.5" />
          Payment verification takes <span className="text-brass font-medium mx-0.5">2–3 working days</span>. Your account will be activated once verified.
        </p>
      </div>

      <button
        disabled={!receiptUrl || !amount || submitting}
        onClick={handleSubmit}
        className="w-full py-3.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40"
      >
        {submitting ? 'Submitting...' : 'Submit Contribution'}
      </button>

      <a
        href={whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris, I need help with my opening contribution payment.')}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full py-2.5 flex items-center justify-center gap-2 text-emerald-400 text-xs font-medium"
      >
        <MessageCircle size={14} /> Need help with payment? Chat on WhatsApp
      </a>
    </div>
  );
}