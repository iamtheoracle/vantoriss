import React from 'react';

/**
 * OperationsPageLayout — Unified institutional page shell for Operations Center.
 * Light-themed, consistent with the member portal design language.
 */
export default function OperationsPageLayout({ title, description, icon: Icon, actions, children, breadcrumb }) {
  return (
    <div className="max-w-[1500px] mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3.5 min-w-0">
          {Icon && (
            <div className="w-11 h-11 rounded-xl bg-navy/8 border border-navy/10 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-navy" strokeWidth={2} />
            </div>
          )}
          <div className="min-w-0">
            {breadcrumb && (
              <p className="text-gray/60 text-[10px] uppercase tracking-[0.15em] font-semibold mb-0.5">{breadcrumb}</p>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {description && <p className="text-gray text-sm mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}