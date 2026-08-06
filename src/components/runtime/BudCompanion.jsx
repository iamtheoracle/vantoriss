import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, Activity, Shield, Cpu, ChevronLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CommandCompanion() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [showHealth, setShowHealth] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('oracleRuntime', {
        message: userMessage.content,
        action: 'process',
      });
      const data = response.data || response;
      let content = data?.response || 'I apologize, I could not process your request.';
      if (data?.pendingApproval) {
        content += '\n\nYour request has been forwarded to our staff for review. You will be notified once it has been approved or if additional information is needed.';
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        metadata: data?.metadata,
        sources: data?.sources,
        capabilities: data?.capabilities,
        routing: data?.routing,
        pendingApproval: data?.pendingApproval,
        escalated: data?.escalated,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    setShowHealth(true);
    try {
      const response = await base44.functions.invoke('oracleRuntime', { action: 'health' });
      const data = response.data || response;
      setHealth(data?.health || []);
    } catch (e) {
      setHealth([{ service: 'runtime', status: 'unhealthy', details: { error: e.message } }]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/more" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft size={20} className="text-gray" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Command</h1>
              <p className="text-xs text-gray">AI Runtime Assistant</p>
            </div>
          </div>
          <button onClick={checkHealth} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Activity size={18} className="text-gray" />
          </button>
        </div>
      </div>

      {showHealth && (
        <div className="px-5 py-3 max-w-3xl mx-auto w-full">
          <div className="vantoris-glass-flat p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-1">Runtime Health</p>
            {health ? health.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray font-medium">{h.service}</span>
                <span className={`font-semibold ${h.status === 'healthy' ? 'text-mint' : h.status === 'degraded' ? 'text-warning' : 'text-crimson'}`}>
                  {h.status}
                </span>
              </div>
            )) : (
              <div className="flex items-center gap-2 text-xs text-gray">
                <Loader2 size={12} className="animate-spin" /> Checking...
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="px-5 py-2 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 text-xs text-gray">
            <Shield size={12} />
            <span>Guardian</span>
            <span className="text-gray/40">→</span>
            <Cpu size={12} />
            <span>Nexus</span>
            <span className="text-gray/40">→</span>
            <Sparkles size={12} />
            <span>Spark</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-navy/8 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-navy" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">How can I help?</h2>
              <p className="text-sm text-gray">Ask me anything about your accounts, transactions, or platform features.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'vantoris-chat-bubble-out rounded-br-md'
                  : 'vantoris-chat-bubble-in rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.pendingApproval && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center gap-1.5">
                    <Clock size={11} className="text-brass" />
                    <span className="text-[10px] text-brass font-medium">
                      {msg.escalated ? 'Escalated for staff review' : 'Pending staff approval'}
                    </span>
                  </div>
                )}
                {msg.metadata?.traceId && (
                  <p className="text-[10px] text-gray/50 mt-2">Trace: {msg.metadata.traceId.substring(0, 8)}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="vantoris-chat-bubble-in rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray/40 animate-typing-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="vantoris-glass-nav sticky bottom-0 px-5 py-3 safe-bottom">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Message Command..."
            disabled={loading}
            className="flex-1 bg-white border border-border rounded-full px-4 py-2.5 text-sm focus:border-brass/50 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center disabled:opacity-30 hover:bg-navy/90 transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}