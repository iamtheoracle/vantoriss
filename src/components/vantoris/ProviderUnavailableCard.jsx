import React from 'react';
import { useNavigate } from 'react-router-dom';

// Truthful unavailable state — Spec §25, §30.
// Shows when a provider is not yet connected. Never fabricates data.
export default function ProviderUnavailableCard({
  providerName,
  description,
  icon: Icon,
  actionLabel,
  actionRoute,
  compact = false,
}) {
  const navigate = useNavigate();

  return (
    <div className={`vantoris-glass-flat p-5 text-center ${compact ? '' : 'py-8'}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        {Icon ? <Icon size={22} className="text-gray" /> : null}
      </div>
      <p className="font-semibold text-foreground text-sm">{providerName}</p>
      <p className="text-gray text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
        {description || 'This capability is not yet available.'}
      </p>
      {actionLabel && actionRoute && (
        <button
          onClick={() => navigate(actionRoute)}
          className="mt-4 text-xs font-semibold text-brass"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}