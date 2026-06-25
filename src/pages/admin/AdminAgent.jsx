import React from 'react';
import AgentChat from '@/components/vantoris/AgentChat';

export default function AdminAgent() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">AI Assistant</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Intelligent operations agent with full platform access</p>
      <AgentChat agentName="vantoris_assistant" />
    </div>
  );
}