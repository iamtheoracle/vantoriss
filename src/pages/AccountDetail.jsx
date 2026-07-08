import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  FileDown,
  FileText,
  HandCoins,
  Landmark,
  MoreHorizontal,
  Receipt,
  Repeat,
  Search,
  Send,
  ShieldCheck,
  Snowflake,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useToast } from '@/components/ui/use-toast';

const WITHDRAWAL_METHODS = [
  {
    value: 'ACH Transfer',
    title: 'ACH Transfer',
    speed: 'Fast',
    time: '1-2 Business Days',
    fee: '$0 standard fee',
    limit: 'Up to $25,000 daily',
    availability: 'Available for verified U.S. bank accounts',
  },
  {
    value: 'Domestic Wire',
    title: 'Domestic Wire',
    speed: 'Same Day',
    time: 'Same business day when submitted before cutoff',
    fee: '$25 estimated fee',
    limit: 'Up to $100,000 daily',
    availability: 'U.S. routing and account number required',
  },
  {
    value: 'International Wire',
    title: 'International Wire',
    speed: 'Global',
    time: '2-5 Business Days',
    fee: '$45 estimated fee',
    limit: 'Subject to destination country review',
    availability: 'SWIFT and beneficiary details required',
  },
  {
    value: 'Internal Transfer',
    title: 'Internal Transfer',
    speed: 'Instant',
    time: 'Usually immediate',
    fee: '$0 fee',
    limit: 'Available balance limit',
    availability: 'Between eligible BOA accounts',
  },
  {
    value: 'External Linked Bank',
    title: 'External Linked Bank',
    speed: 'Standard',
    time: '2-3 Business Days',
    fee: '$0 standard fee',
    limit: 'Up to linked bank limits',
    availability: 'Requires verified external account',
  },
  {
    value: 'Check by Mail',
    title: 'Check by Mail',
    speed: 'Mail',
    time: '5-7 Business Days',
    fee: '$10 estimated fee',
    limit: 'Up to $10,000 per check',
    availability: 'Optional mailed check delivery',
  },
  {
    value: 'Crypto Withdrawal',
    title: 'Crypto Withdrawal',
    speed: 'Network',
    time: 'Depends on network confirmation',
    fee: 'Network fee applies',
    limit: 'Enabled accounts only',
    availability: 'Subject to wallet review and policy controls',
  },
];

const DESTINATIONS = [
  { id: 'saved-bank', title: 'Saved U.S. Bank', detail: 'Chase Checking ending 4821', type: 'Saved banks' },
  { id: 'linked-account', title: 'Linked BOA Account', detail: 'Personal Savings ending 0188', type: 'Linked accounts' },
  