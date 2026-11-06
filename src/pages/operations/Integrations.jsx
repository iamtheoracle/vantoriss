import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Plug, Settings, ShieldAlert } from 'lucide-react';

const integrations = [
  { name: 'Card issuer / processor', category: 'Cards', description: 'Issuer authorization, card creation, activation and card controls.' },
  { name: 'Banking connectivity', category: 'Account verification', description: 'Account ownership verification and permitted balance connectivity.' },
  { name: 'Payment rails', category: 'Transfers & payments', description: 'Provider-backed domestic transfers, payment submission and settlement reconciliation.' },
  { name: 'Stripe', category: 'Payments', description: 'Potential payment acceptance integration; no live processing is implied.' },
  { name: 'Plaid', category: 'Banking', description: 'Potential account-linking and verification integration; connection must be tested.' },
  { name: 'Google Drive', category: 'Document storage', description: 'Potential document archive destination; permissions and retention require review.' },
  { name: 'Slack', category: 'Notifications', description: 'Potential staff notification channel; no alerts are assumed connected.' },
];

export default function Integrations() {
  return (
    <OperationsPageLayout title="Provider Connections" description="Verified service connectivity and provider readiness" icon={Plug}>
      <div className="rounded-2xl border border-[#D9CBAF] bg-[#FBF9F3] p-5 mb-5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-[#8B7650] mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold text-[#173D32]">Connection status is not yet verified</h2>
            <p className="text-sm text-[#68766F] mt-1 leading-relaxed">A provider appearing in this catalogue does not mean credentials are configured, production access is approved, or end-to-end tests have passed. Keep dependent operations disabled until the provider, authorization, failure handling and reconciliation paths are verified.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map(integration => (
          <article key={integration.name} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#173D32]/10 flex items-center justify-center">
                <Plug size={18} className="text-[#173D32]" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600">Not verified</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8B7650]">{integration.category}</p>
            <h3 className="text-foreground font-semibold text-sm mt-1">{integration.name}</h3>
            <p className="text-gray text-xs mt-2 leading-relaxed">{integration.description}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 mt-5">
        <div className="flex items-center gap-3">
          <Settings size={17} className="text-[#8B7650]" />
          <p className="text-gray text-sm">Provider secrets belong in backend configuration. Never paste API keys into member or operations chat, page code, or client-side settings.</p>
        </div>
      </div>
    </OperationsPageLayout>
  );
}
