import React from "react";
import ShieldLogo from "@/components/vantoris/ShieldLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1A2B] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <ShieldLogo size={56} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white mb-0.5">VANTORIS</h1>
          <p className="text-[#AAB4C3] text-[10px] tracking-[0.25em] uppercase mb-6">Private Institutional Platform</p>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-[#AAB4C3] text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="bg-[#242D38] rounded-2xl border border-[#242D38] p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-[#AAB4C3] mt-6">{footer}</p>
        )}
        <p className="text-center text-[10px] text-[#AAB4C3]/30 mt-8 tracking-widest uppercase">
          Secure · Trusted · Tailored for you
        </p>
      </div>
    </div>
  );
}