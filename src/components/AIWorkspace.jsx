import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Menu, X, Plus, Search, Pin, Star, Trash2, Copy, Share2, Download, ThumbsUp, ThumbsDown, Mic, Settings } from 'lucide-react';
import AIWorkspaceSidebar from './AIWorkspaceSidebar';
import AIWorkspaceHeader from './AIWorkspaceHeader';
import { useToast } from '@/components/ui/use-toast';

export default function AIWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(searchParams.get('prompt') || '');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !user) return;
    
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStreaming(true);

    try {
      // Call the agent with context
      const response = await base44.agents.sendMessage({
        agent_name: 'vantoris_assistant',
        message: input,
        user_id: user.id,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response?.message || 'No response',
        timestamp: new Date(),
      }]);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to process message', variant: 'destructive' });
    } finally {
      setStreaming(false);
    }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex h-screen bg-[#0E1A2B] text-white overflow-hidden">
      {/* Sidebar */}
      {(sidebarOpen || !isMobile) && (
        <div className={`${isMobile ? 'fixed inset-0 z-40 w-64' : 'relative w-64'} bg-[#111C2D] border-r border-[#242D38] flex flex-col`}>
          <AIWorkspaceSidebar conversations={conversations} onSelect={setCurrentConvId} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AIWorkspaceHeader user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 vantoris-scroll">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-brass/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings size={32} className="text-brass" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
                <p className="text-[#AAB4C3] text-sm">Ask me anything about KYC, accounts, transactions, statements, and more.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-brass text-[#0E1A2B] rounded-br-none'
                    : 'bg-[#242D38] text-white rounded-bl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[#3a4450]">
                      <button className="p-1 hover:bg-[#3a4450] rounded text-xs" title="Copy"><Copy size={14} /></button>
                      <button className="p-1 hover:bg-[#3a4450] rounded text-xs" title="Share"><Share2 size={14} /></button>
                      <button className="p-1 hover:bg-[#3a4450] rounded text-xs" title="Download"><Download size={14} /></button>
                      <button className="p-1 hover:bg-[#3a4450] rounded text-xs ml-auto" title="Helpful"><ThumbsUp size={14} /></button>
                      <button className="p-1 hover:bg-[#3a4450] rounded text-xs" title="Not helpful"><ThumbsDown size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {streaming && (
            <div className="flex justify-start">
              <div className="bg-[#242D38] text-white px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-brass rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-brass rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-brass rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#242D38] p-4 md:p-6 bg-[#0E1A2B]/95 backdrop-blur safe-bottom">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about KYC, accounts, transactions, statements..."
                className="flex-1 bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none placeholder-[#AAB4C3]/50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                className="p-3 bg-brass text-[#0E1A2B] rounded-xl hover:bg-brass/90 disabled:opacity-40 transition-all"
              >
                <Send size={18} />
              </button>
              <button
                className="p-3 bg-[#242D38] text-[#AAB4C3] hover:text-white rounded-xl transition-all"
              >
                <Mic size={18} />
              </button>
            </div>
            <p className="text-[#AAB4C3] text-xs mt-2">Try: /statement, /transactions, /help, or use / for commands</p>
          </div>
        </div>
      </div>
    </div>
  );
}