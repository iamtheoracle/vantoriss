import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Search, Zap, Clock, Star, AlertCircle, Briefcase, DollarSign, FileText, Users } from 'lucide-react';

export default function AIAssistantHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    loadData();
  }, []);

  const suggestedActions = [
    { label: 'Generate Statement', icon: FileText, action: () => navigate('/advisor?action=statement') },
    { label: 'Continue KYC', icon: AlertCircle, action: () => navigate('/advisor?action=kyc') },
    { label: 'Upload Documents', icon: Plus, action: () => navigate('/documents') },
    { label: 'View Transactions', icon: DollarSign, action: () => navigate('/advisor?action=transactions') },
    { label: 'Portfolio Summary', icon: Briefcase, action: () => navigate('/advisor?action=portfolio') },
    { label: 'Contact Support', icon: Users, action: () => navigate('/messages') },
  ];

  const smartPrompts = [
    'Where is my KYC?',
    'Generate my latest statement',
    'Show today\'s transactions',
    'Explain my portfolio',
    'Continue onboarding',
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0E1A2B] text-white">
      {/* Header */}
      <div className="border-b border-[#242D38] sticky top-0 z-20 bg-[#0E1A2B]/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 safe-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare size={28} className="text-brass" />
                VANTORIS Guide
              </h1>
              <p className="text-[#AAB4C3] text-xs mt-1">Enterprise AI Workspace</p>
            </div>
            <button
              onClick={() => navigate('/advisor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-brass/10 to-transparent border border-brass/20 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.full_name || 'Member'}</h2>
          <p className="text-[#AAB4C3] text-sm mb-4">
            I'm your intelligent AI co-pilot for VANTORIS. I can help you with documents, accounts, transactions, onboarding, and more.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#242D38]/40 rounded-lg p-3 border border-[#242D38]">
              <p className="text-[#AAB4C3] mb-1">Role</p>
              <p className="font-semibold text-white capitalize">{user?.role || '—'}</p>
            </div>
            <div className="bg-[#242D38]/40 rounded-lg p-3 border border-[#242D38]">
              <p className="text-[#AAB4C3] mb-1">Status</p>
              <p className="font-semibold text-emerald-400">Online</p>
            </div>
            <div className="bg-[#242D38]/40 rounded-lg p-3 border border-[#242D38]">
              <p className="text-[#AAB4C3] mb-1">AI Status</p>
              <p className="font-semibold text-emerald-400">Ready</p>
            </div>
            <div className="bg-[#242D38]/40 rounded-lg p-3 border border-[#242D38]">
              <p className="text-[#AAB4C3] mb-1">Last Sync</p>
              <p className="font-semibold text-white">Just now</p>
            </div>
          </div>
        </div>

        {/* Smart Prompts */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={20} className="text-brass" />
            Smart Prompts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/advisor?prompt=${encodeURIComponent(prompt)}`)}
                className="text-left p-4 bg-[#242D38] hover:bg-[#2a3340] border border-[#242D38] rounded-xl transition-all text-sm text-[#AAB4C3] hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-brass" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestedActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className="p-4 bg-[#242D38] hover:bg-[#2a3340] border border-[#242D38] hover:border-brass/30 rounded-xl transition-all text-center"
                >
                  <Icon size={24} className="text-brass mx-auto mb-2" />
                  <p className="text-white text-xs font-medium">{action.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Conversations */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-brass" />
            Recent Conversations
          </h3>
          <div className="bg-[#242D38]/30 border border-[#242D38] rounded-xl p-8 text-center">
            <MessageSquare size={32} className="text-[#AAB4C3]/40 mx-auto mb-3" />
            <p className="text-[#AAB4C3] text-sm">No recent conversations yet</p>
            <button
              onClick={() => navigate('/advisor')}
              className="mt-3 text-brass text-xs font-semibold hover:underline"
            >
              Start your first conversation
            </button>
          </div>
        </div>

        {/* Platform Resources */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-brass" />
            Platform Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'How KYC Works', desc: 'Learn about document verification' },
              { title: 'Account Types', desc: 'Understand your account options' },
              { title: 'Transaction Guide', desc: 'Deposits, withdrawals & more' },
              { title: 'Portfolio Basics', desc: 'Manage your investments' },
            ].map((res, idx) => (
              <div key={idx} className="p-4 bg-[#242D38]/40 border border-[#242D38] rounded-xl">
                <p className="text-white text-sm font-medium">{res.title}</p>
                <p className="text-[#AAB4C3] text-xs mt-1">{res.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}