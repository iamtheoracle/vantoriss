import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Heart, Loader2, CheckCircle, AlertCircle, Clock, ExternalLink, MapPin, Globe, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';

const RECIPIENT_TYPE_LABELS = {
  individual: 'Individual',
  family: 'Family',
  childrens_home: "Children's Home",
  orphanage: 'Orphanage',
  shelter: 'Shelter',
  ngo: 'NGO',
  organization: 'Organization',
  military_personnel: 'Military Personnel',
  military_family: 'Military Family',
  community: 'Community',
};

const CATEGORY_LABELS = {
  financial_assistance: 'Financial Assistance',
  surgery_medical: 'Surgery / Medical',
  food: 'Food',
  essential_supplies: 'Essential Supplies',
  children_support: 'Children Support',
  shelter: 'Shelter',
  emergency: 'Emergency',
  military_support: 'Military Support',
  communication: 'Communication',
  other: 'Other',
};

export default function HumanitarianCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const allCases = await base44.entities.HumanitarianCase.filter({}, '-date_discovered', 50).catch(() => []);
      setCases(allCases);
    } catch (err) {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleApprove(caseId) {
    try {
      await base44.entities.HumanitarianCase.update(caseId, {
        review_status: 'approved',
        case_status: 'open',
        reviewed_date: new Date().toISOString(),
      });
      toast({ title: 'Case approved', description: 'This case is now visible for donations.' });
      loadData();
    } catch (err) {
      toast({ title: 'Approval failed', description: err.message, variant: 'destructive' });
    }
  }

  async function handleReject(caseId) {
    try {
      await base44.entities.HumanitarianCase.update(caseId, {
        review_status: 'rejected',
        case_status: 'rejected',
        reviewed_date: new Date().toISOString(),
      });
      toast({ title: 'Case rejected' });
      loadData();
    } catch (err) {
      toast({ title: 'Rejection failed', description: err.message, variant: 'destructive' });
    }
  }

  const filteredCases = filter === 'all' ? cases : cases.filter((c) => c.review_status === filter);

  if (loading) {
    return (
      <OperationsPageLayout title="Humanitarian Cases" icon={Heart}>
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Humanitarian Cases"
      description="Verified assistance needs discovered by the Discovery & Intelligence Network"
      icon={Heart}
    >
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Cases' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === tab.id ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredCases.length === 0 ? (
        <div className="vantoris-glass p-8 text-center">
          <Heart size={28} className="text-gray mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No humanitarian cases {filter !== 'all' ? `with status "${filter}"` : 'discovered yet'}</p>
          <p className="text-xs text-gray mt-1">
            Cases will appear here when the Discovery Network finds and verifies legitimate, publicly documented assistance needs. Vantoris never fabricates cases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCases.map((c) => (
            <div key={c.id} className="vantoris-glass p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{c.case_title}</p>
                  <p className="text-xs text-gray mt-0.5">
                    {RECIPIENT_TYPE_LABELS[c.recipient_type] || c.recipient_type} · {CATEGORY_LABELS[c.category] || c.category}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  c.review_status === 'approved' ? 'bg-mint/10 text-mint' :
                  c.review_status === 'rejected' ? 'bg-crimson/10 text-crimson' :
                  c.review_status === 'under_review' ? 'bg-champagne/10 text-champagne' :
                  'bg-warning/10 text-warning'
                }`}>
                  {c.review_status.replace(/_/g, ' ')}
                </span>
              </div>

              {c.recipient_name && <p className="text-xs text-foreground font-medium">{c.recipient_name}</p>}
              {c.location && (
                <p className="text-[10px] text-gray flex items-center gap-1 mt-1">
                  <MapPin size={10} /> {c.location}
                </p>
              )}
              {c.stated_need && (
                <p className="text-xs text-gray mt-2 line-clamp-3">{c.stated_need}</p>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  c.verification_status === 'verified' ? 'bg-mint/10 text-mint' :
                  c.verification_status === 'failed' ? 'bg-crimson/10 text-crimson' :
                  'bg-warning/10 text-warning'
                }`}>
                  {c.verification_status}
                </span>
                <span className="text-[10px] text-gray">Confidence: {c.confidence_level}</span>
                {c.estimated_amount > 0 && (
                  <span className="text-[10px] text-gray">Est: {formatCurrency(c.estimated_amount)}</span>
                )}
              </div>

              {c.source_url && (
                <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-navy font-medium mt-2 inline-flex items-center gap-1">
                  <ExternalLink size={10} /> View Source
                </a>
              )}

              {c.risk_flags && (() => {
                let flags = [];
                try { flags = JSON.parse(c.risk_flags || '[]'); } catch (e) {}
                return flags.length > 0 ? (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning">
                    <AlertCircle size={12} /> {flags.length} risk flag(s)
                  </div>
                ) : null;
              })()}

              {/* Actions */}
              {c.review_status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(c.id)}
                    className="flex-1 py-2 rounded-lg bg-mint/10 text-mint text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <ShieldCheck size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(c.id)}
                    className="flex-1 py-2 rounded-lg bg-crimson/10 text-crimson text-xs font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}

              {c.case_status === 'matched' && c.matched_order_id && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-mint">
                  <CheckCircle size={12} /> Matched to order VAN-{c.matched_order_id.slice(-8).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </OperationsPageLayout>
  );
}