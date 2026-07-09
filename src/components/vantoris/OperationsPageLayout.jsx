import React from 'react';

export default function OperationsPageLayout({ title, description, icon: Icon, actions, children, breadcrumb }) {
  return (
    <div className="max-w-[1500px] mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3.5 min-w-0">
          {Icon && (
            <div className="w-11 h-11 rounded-xl bg-brass/10 border border-brass/20 flex items-center justify-center flex-shrink-0 vantoris-shadow-glow">
              <Icon size={20} className="text-brass" />
            </div>
          )}
          <div className="min-w-0">
            {breadcrumb && (
              <p className="text-[#AAB4C3]/50 text-[10px] uppercase tracking-[0.15em] mb-0.5">{breadcrumb}</p>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{title}</h1>
            {description && <p className="text-[#AAB4C3] text-sm mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}