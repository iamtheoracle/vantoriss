import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatCurrency';
import { Wallet, ChevronRight, Plus, X, CheckCircle, Clock } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { PRODUCTS } from '@/components/auth/ProductSelection';

const ACCOUNT_TYPES = ['All', 'Checking', 'Savings', 'Money Market', 'CD', 'Joint', 'Business'];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryProductType, setEnquiryProductType] = useState('');
  const [enquiryReason, setEnquiryReason] = useState('');
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryResult, setEnquiryResult] = useState(null);
  const [enquiryError, setEnquiryError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const [accts, approvedApps] = await Promise.all([
        base44.entities.Account.filter({ user_id: me.id }),
        base44.entities.Application.filter({ user_id: me.id, application_status: 'approved' }),
      ]);
      setAccounts(accts);
      setApprovedApplications(approvedApps);
      setLoading(false);
    }
    load();
  }, []);

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    setEnquiryError('');
    setEnquiryLoading(true);
    try {
      const result = await base44.functions.invoke('submitApplication', {
        account_type: enquiryProductType,
        reason: enquiryReason,
      });
      if (result?.error) {
        setEnquiryError(result.error);
      } else {
        setEnquiryResult(result);
      }
    } catch (err) {
      setEnquiryError(err.message || 'Failed to submit enquiry.');
    } finally {
      setEnquiryLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const heldTypes = approvedApplications.map((a) => a.account_type);
  const availableProductTypes = PRODUCTS
    .map((p) => p.accountType)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .filter((t) => !heldTypes.includes(t));

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const filteredAccounts = activeFilter === 'All'
    ? accounts
    : accounts.filter(a => a.account_type === activeFilter);

  return (
    <div className="px-5 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Accounts</h1>
        <p className="text-gray text-sm">Total Balance: <span className="text-foreground font-semibold">{formatCurrency(totalBalance)}</span></p>
      </div>

      {/* Filter tabs — functional */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ACCOUNT_TYPES.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === tab
                ? 'bg-brass text-white border-brass'
                : 'bg-white text-gray border-slate-200 hover:border-brass/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <Wallet size={32} className="text-gray mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">{accounts.length === 0 ? 'No Accounts Yet' : 'No Matching Accounts'}</p>
          <p className="text-gray text-sm">{accounts.length === 0 ? 'Your accounts will appear here once approved.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAccounts.map(account => (
            <button
              key={account.id}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 w-full text-left hover:border-brass/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
                    <Wallet size={18} className="text-brass" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{account.account_name}</p>
                    <p className="text-gray text-xs font-mono">{account.account_number}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray/40" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray text-[11px] uppercase tracking-wider">Available Balance</p>
                  <p className="text-foreground text-xl font-bold">{formatCurrency(account.balance)}</p>
                </div>
                <StatusBadge status={account.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Enquire about a new account — only shown when user holds at least one approved account */}
      {heldTypes.length > 0 && availableProductTypes.length > 0 && (
        <div className="mt-8">
          {!showEnquiryForm && !enquiryResult && (
            <button
              onClick={() => setShowEnquiryForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brass/40 text-brass font-medium text-sm hover:border-brass hover:bg-brass/5 transition"
            >
              <Plus size={16} />
              Enquire about a new account
            </button>
          )}

          {showEnquiryForm && !enquiryResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">New Account Enquiry</h2>
                <button onClick={() => { setShowEnquiryForm(false); setEnquiryError(''); }} className="text-gray hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {enquiryError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {enquiryError}
                </div>
              )}

              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray mb-1.5">Account Type</label>
                  <select
                    value={enquiryProductType}
                    onChange={(e) => setEnquiryProductType(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-brass/30"
                  >
                    <option value="">Select a type…</option>
                    {availableProductTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray mb-1.5">Reason <span className="text-gray/50">(optional)</span></label>
                  <textarea
                    value={enquiryReason}
                    onChange={(e) => setEnquiryReason(e.target.value)}
                    rows={3}
                    placeholder="Tell us why you're interested in this account type…"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-brass/30 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enquiryLoading || !enquiryProductType}
                  className="w-full h-11 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {enquiryLoading ? 'Submitting…' : 'Submit Enquiry'}
                </button>
              </form>
            </div>
          )}

          {enquiryResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              {enquiryResult.outcome === 'enquiry_exists' ? (
                <>
                  <Clock size={32} className="text-brass mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">Already Under Review</p>
                  <p className="text-gray text-sm">{enquiryResult.message}</p>
                </>
              ) : (
                <>
                  <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">Enquiry Submitted</p>
                  <p className="text-gray text-sm">Your enquiry is pending review. We'll notify you once a decision has been made.</p>
                </>
              )}
              <button
                onClick={() => { setEnquiryResult(null); setEnquiryProductType(''); setEnquiryReason(''); setEnquiryError(''); }}
                className="mt-4 text-sm text-navy font-medium hover:underline"
              >
                Submit another enquiry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}