import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Building2, CreditCard, TrendingUp, Check, Clock } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const services = [
  { type: 'Joint Account', icon: Users, desc: 'Add a joint account with another member', color: 'bg-brass/15 text-brass' },
  { type: 'Business Account', icon: Building2, desc: 'Open a business account for your company', color: 'bg-olive/20 text-emerald-400' },
  { type: 'Debit Card', icon: CreditCard, desc: 'Request a debit card for your account', color: 'bg-blue-500/15 text-blue-400' },
  { type: 'Investment Access', icon: TrendingUp, desc: 'Request access to investment opportunities', color: 'bg-purple-500/15 text-purple-400' },
];

export default function Services() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const me = await base44.auth.me();
    const reqs = await base44.entities.ServiceRequest.filter({ user_id: me.id }, '-created_date');
    setRequests(reqs);
    setLoading(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.ServiceRequest.create({
        user_id: me.id,
        service_type: showRequest,
        details,
        status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: me.id,
        title: 'Service Requested',
        message: `Your request for ${showRequest} has been submitted for review.`,
        type: 'info',
      });
      setShowRequest(null);
      setDetails('');
      loadRequests();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Services</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Request additional accounts and services</p>

      {/* Available Services */}
      <h3 className="text-white font-semibold text-sm mb-3">Available Services</h3>
      <div className="space-y-3 mb-8">
        {services.map(svc => {
          const Icon = svc.icon;
          return (
            <button
              key={svc.type}
              onClick={() => setShowRequest(svc.type)}
              className="vantoris-card p-4 w-full text-left flex items-center gap-4 hover:border-brass/30 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${svc.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{svc.type}</p>
                <p className="text-[#AAB4C3] text-xs">{svc.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* My Requests */}
      {requests.length > 0 && (
        <>
          <h3 className="text-white font-semibold text-sm mb-3">My Requests</h3>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="vantoris-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{req.service_type}</p>
                  <p className="text-[#AAB4C3] text-xs">
                    {new Date(req.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Request Dialog */}
      <Dialog open={!!showRequest} onOpenChange={() => setShowRequest(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Request {showRequest}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-[#AAB4C3] text-sm">Provide any additional details for your request.</p>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none"
              rows={4}
            />
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}