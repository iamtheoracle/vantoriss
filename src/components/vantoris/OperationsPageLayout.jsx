import React from "react";
import {
  ChevronRight,
  Bell,
  Clock,
  ShieldCheck
} from "lucide-react";

export default function OperationsPageLayout({
  title,
  description,
  icon: Icon,
  actions,
  breadcrumbs = [],
  children
}) {
  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#8B98A5]">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item}>
              {index > 0 && <ChevronRight size={12} />}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="vantoris-card p-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div className="flex items-center gap-4">

            {Icon && (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center border border-yellow-500/20">
                <Icon size={28} className="text-yellow-400" />
              </div>
            )}

            <div>

              <h1 className="text-3xl font-bold text-white">
                {title}
              </h1>

              {description && (
                <p className="text-[#AAB4C3] mt-2">
                  {description}
                </p>
              )}

            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">

              <ShieldCheck
                size={16}
                className="text-emerald-400"
              />

              <span className="text-emerald-300 text-sm font-medium">
                Platform Healthy
              </span>

            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A2430]">

              <Clock
                size={16}
                className="text-[#AAB4C3]"
              />

              <span className="text-sm text-white">
                {currentTime}
              </span>

            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A2430]">

              <Bell
                size={16}
                className="text-yellow-400"
              />

              <span className="text-sm text-white">
                Live
              </span>

            </div>

            {actions}

          </div>

        </div>

      </div>

      {children}

    </div>
  );
}