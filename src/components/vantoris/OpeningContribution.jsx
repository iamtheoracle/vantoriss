import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Check, Clock, FileText, MessageCircle, Upload } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

const PAYMENT_METHODS = [
  { value: 'Opening Contribution', label: 'Opening Contribution', desc: 'Initial deposit to activate your account' },
  { value: 'Wire Transfer', label: 'Wire Transfer', desc: 'Domestic or international wire' },
  { value: 'Crypto Deposit', label: 'Crypto Deposit', desc: 'USDT / BTC / ETH' },
  { value: 'ACH Deposit', label: 'ACH Deposit', desc: 'US bank ACH transfer' },
  { value: 'Western Union', label: 'Western Union', desc: 'Send via Western Union with time-limited details' },
  { value: 'RIA', label: 'RIA', desc: 'RIA Money Transfer with time-limited account details' },
  { value: 'MoneyGram', label: 'MoneyGram', desc: 'MoneyGram international transfer with expiring details' },
  { value: 'Check', label: 'Check', desc: 'Physical check deposit with limited-validity instructions' },
  { value: 'Chime', label: 'Chime', desc: 'Chime transfer with expiring account details' },
];

const TIME_LIMITED_METHODS = new Set(['Western Union', 'RIA', 'MoneyGram', 'Check', 'Chime']);

function formatUsd(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5B6472]">
      {children}
    </label>
  );
}

export default function OpeningContribution({ application, onUpdate }) {
  const whatsappNumber = useWhatsAppConfig();
  const [method, setMethod] = useState(application?.opening_payment_method || 'Opening Contribution');
  const [amount, setAmount] = useState(application?.opening_balance ? String(application.opening_balance) : '');
  const [receiptUrl, setReceiptUrl] = useState(application?.opening_receipt_url || '');
  const [accountDetails, setAccountDetails] = useState(application?.deposit_account_details || '');
  const [detailsExpiry, setDetailsExpiry] = useState(
    application?.deposit_details_expires
      ? new Date(application.deposit_details_expires).toISOString().split('T')[0]
      : ''
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const contribStatus = application?.opening_contribution_status || 'not_started';
  const needsExpiringDetails = TIME_LIMITED_METHODS.has(method);
  const canSubmit = Boolean(
    receiptUrl &&
      amount &&
      Number(amount) > 0 &&
      (!needsExpiringDetails || (accountDetails.trim() && detailsExpiry)) &&
      !submitting
  );

  const supportLink = useMemo(
    () =>
      whatsappLinkFromConfig(
        whatsappNumber,
        'Hello BOA, I need help with my opening contribution payment.'
      ),
    [whatsappNumber]
  );

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);
    } catch (err) {
      console.error(err);
      setError('Receipt upload failed. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !application?.id) return;

    setSubmitting(true);
    setError('');

    try {
      const updateData = {
        opening_receipt_url: receiptUrl,
        opening_payment_method: method,
        opening_balance: parseFloat(amount) || 0,
        opening_contribution_status: 'pending',
      };