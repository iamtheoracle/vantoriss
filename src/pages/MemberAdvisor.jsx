import React from 'react';
import MemberAdvisorChat from '@/components/vantoris/MemberAdvisorChat';

export default function MemberAdvisor() {
  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Advisor</h1>
      <p className="text-[#AAB4C3] text-sm mb-4">Get instant guidance on your accounts and services</p>
      <MemberAdvisorChat />
    </div>
  );
}