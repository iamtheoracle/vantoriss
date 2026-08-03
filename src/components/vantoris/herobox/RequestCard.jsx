import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { Package, Wifi, Heart, Phone, Truck, MapPin, ChevronDown } from 'lucide-react';

const TYPE_META = {
  care_package: { icon: Package, color: 'text-brass', bg: 'bg-brass/12', label: 'Care Package' },
  internet_support: { icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Internet Support' },
  financial_assistance: { icon: Heart, color: 'text-crimson', bg: 'bg-crimson/10', label: 'Financial Assistance' },
  communication_services: { icon: Phone, color: 'text-mint', bg: 'bg-mint/12', label: 'Communication' },
  essential_supplies: { icon: Package, color: 'text-navy', bg: 'bg-navy/8', label: 'Essential Supplies' },
};

const STATUS_META = {
  pending: { label: 'Pending', color: 'text-brass', bg: 'bg-brass/12' },
  under_review: { label: 'Under Review', color: 'text-champagne', bg: 'bg-champagne/12' },
  approved: { label: 'Approved', color: 'text-mint', bg: 'bg-mint/12' },
  in_progress: { label: 'In Progress', color: 'text-champagne', bg: 'bg-champagne/12' },
  delivered: { label: 'Delivered', color: 'text-mint', bg: 'bg-mint/12' },
  completed: { label: 'Completed', color: 'text-gray', bg: 'bg-slate-100' },
};

const STATUS_FLOW = ['pending', 'under_review', 'approved', 'in_progress', 'delivered', 'completed'];

export default function RequestCard({ request }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[request.request_type] || TYPE_META.care_package;
  const statusMeta = STATUS_META[request.status] || STATUS_META.pending;
  const Icon = meta.icon;
  const currentStep = STATUS_FLOW.indexOf(request.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="vantoris-glass p-3.5"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={17} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm truncate">{request.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-gray text-[11px]">{meta.label}</span>
            <span className="text-gray/30 text-[10px]">·</span>
            <span className="text-gray text-[11px]">
              {new Date(request.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMeta.bg} ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
          {request.amount > 0 && (
            <p className="text-foreground font-semibold text-sm mt-1">{formatCurrency(request.amount)}</p>
          )}
        </div>
        <ChevronDown size={14} className={`text-gray/30 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-slate-100 space-y-3"
        >
          {/* Status timeline */}
          <div className="flex items-center gap-1">
            {STATUS_FLOW.map((step, idx) => {
              const isPast = idx <= currentStep;
              const stepMeta = STATUS_META[step];
              return (
                <React.Fragment key={step}>
                  <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-mint' : 'bg-slate-200'}`} />
                  {idx < STATUS_FLOW.length - 1 && (
                    <div className={`flex-1 h-0.5 ${idx < currentStep ? 'bg-mint' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            {request.recipient_name && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray/60">Recipient</span>
                <span className="text-gray font-medium">{request.recipient_name}</span>
              </div>
            )}
            {request.recipient_location && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray/60">Location</span>
                <span className="text-gray font-medium flex items-center gap-1">
                  <MapPin size={10} />{request.recipient_location}
                </span>
              </div>
            )}
            {request.tracking_number && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray/60 flex items-center gap-1"><Truck size={10} />Tracking</span>
                <span className="text-gray font-mono">{request.tracking_number}</span>
              </div>
            )}
            {request.estimated_delivery && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray/60">Est. Delivery</span>
                <span className="text-gray font-medium">
                  {new Date(request.estimated_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {request.description && (
              <p className="text-gray text-[11px] pt-1 leading-relaxed">{request.description}</p>
            )}
            {request.mission_notes && (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-gray/60 text-[10px] uppercase tracking-wider font-medium mb-0.5">Mission Notes</p>
                <p className="text-gray text-[11px]">{request.mission_notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}