import React from 'react';
import MemberAdvisorChat from '@/components/vantoris/MemberAdvisorChat';

export default function MemberAdvisor() {
  return (
    <div className="px-5 pt-6">
      <div className="mb-4">
        <p className="text-gray text-xs uppercase tracking-[0.2em] font-semibold mb-1">Member Advisor</p>
        <h1 className="text-2xl font-bold text-foreground">Your Financial Advisor</h1>
        <p className="text-gray text-sm mt-1">Secure, instant guidance on your accounts, investments, and services.</p>
      </div>
      <MemberAdvisorChat />
    </div>
  );
}