import React from 'react';

export default function OperationsPageLayout({ title, description, icon: Icon, actions, children }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center">
              <Icon size={20} className="text-brass" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
            {description && <p className="text-[#AAB4C3] text-sm">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}