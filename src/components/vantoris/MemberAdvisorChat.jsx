import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Sparkles, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';

const SUGGESTIONS = [
  'What is my current account balance?',
  'Show me my recent transactions',
  'What is my KYC status?',
  'What services can I request?',
];

export default function MemberAdvisorChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      const unsubscribe = base44.agents.subscribeToConversation(activeConv.id, (data) => {
        setMessages(data.messages || []);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const convs = await base44.agents.listConversations({ agent_name: 'member_advisor' });
      setConversations(convs || []);
      if (convs && convs.length > 0) {
        setActiveConv(convs[0]);
        setMessages(convs[0].messages || []);
      }
    } catch (e) {
      console.error('Load conversations error:', e);
    }
    setLoadingConv(false);
  }

  async function startNewConversation() {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'member_advisor',
        metadata: { name: 'Advisor Session', description: 'Member advisory chat' },
      });
      setConversations([conv, ...conversations]);
      setActiveConv(conv);
      setMessages([]);
      return conv;
    } catch (e) {
      console.error('Create conversation error:', e);
    }
  }

  async function sendMessage(text) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    let conv = activeConv;
    if (!conv) {
      conv = await startNewConversation();
    }

    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content }]);

    try {
      await base44.agents.addMessage(conv, { role: 'user', content });
    } catch (e) {
      console.error('Send message error:', e);
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header — Advisor identity bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="w-10 h-10 rounded-xl bg-brass/10 border border-brass/15 flex items-center justify-center">
            <VantorisMonogram size={26} variant="flat" theme="light" />
          </div>
          <div className="flex-1">
            <h3 className="text-foreground font-semibold text-sm">Vantoris Advisor</h3>
            <p className="text-gray text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mint inline-block" />
              Online · Your personal AI financial guide
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brass/8">
            <Shield size={13} className="text-brass" />
            <span className="text-brass text-[10px] font-semibold uppercase tracking-wider">Encrypted</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {loadingConv && (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-brass" />
            </div>
          )}
          {messages.length === 0 && !loadingConv && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-brass/10 border border-brass/15 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-brass" />
              </div>
              <h4 className="text-foreground font-semibold mb-1">How can I help you today?</h4>
              <p className="text-gray text-sm max-w-xs mb-5">
                Ask me about your accounts, transactions, onboarding status, or available services.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="block w-full text-left px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-brass/30 hover:bg-brass/5 text-foreground text-xs font-medium transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-gray text-sm">
              <Loader2 size={14} className="animate-spin text-brass" />
              <span>Advisor is composing a response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-200 bg-white safe-bottom">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message to your advisor..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-foreground text-sm focus:border-brass/40 focus:bg-white focus:outline-none transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 flex items-center justify-center bg-brass text-white rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-gray/60 text-[10px] mt-2 text-center">
            Your advisor has secure access to your account information. Never share passwords or PINs.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`flex gap-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-slate-200' : 'bg-brass/10 border border-brass/15'
        }`}>
          {isUser ? (
            <span className="text-gray text-[10px] font-bold uppercase">You</span>
          ) : (
            <VantorisMonogram size={20} variant="flat" theme="light" />
          )}
        </div>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-brass text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-foreground rounded-tl-sm'
        }`}>
          {message.content && (
            isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded">
                {message.content}
              </ReactMarkdown>
            )
          )}
          {message.tool_calls?.map((toolCall, idx) => (
            <ToolCallBadge key={idx} toolCall={toolCall} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolCallBadge({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || 'completed';
  const isFailed = ['failed', 'error'].includes(status);
  const statusColor = isFailed ? 'text-crimson' : status === 'pending' || status === 'running' ? 'text-brass' : 'text-mint';

  let parsedResults = null;
  try {
    parsedResults = typeof toolCall.results === 'string' ? JSON.parse(toolCall.results) : toolCall.results;
  } catch {
    parsedResults = toolCall.results;
  }

  const hideDetails = toolCall.display_projection?.hide_details && toolCall.display_projection?.details_redacted;

  if (hideDetails) {
    return (
      <div className="mt-2 text-xs">
        <span className={statusColor}>
          {isFailed ? (toolCall.display_projection?.error_label || 'Failed') :
           status === 'pending' || status === 'running' ? (toolCall.display_projection?.active_label || 'Processing...') :
           (toolCall.display_projection?.label || toolCall.name)}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 text-xs border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-all"
      >
        {expanded ? <ChevronDown size={12} className="text-gray" /> : <ChevronRight size={12} className="text-gray" />}
        <span className="text-gray font-medium">{toolCall.name}</span>
        <span className={`ml-auto ${statusColor} capitalize`}>{status}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-slate-200 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <p className="text-gray text-[10px] uppercase tracking-wider mb-1">Parameters</p>
              <pre className="text-gray text-[11px] overflow-x-auto whitespace-pre-wrap">
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {parsedResults !== null && parsedResults !== undefined && (
            <div>
              <p className="text-gray text-[10px] uppercase tracking-wider mb-1">Result</p>
              <pre className={`text-[11px] overflow-x-auto whitespace-pre-wrap ${isFailed ? 'text-crimson' : 'text-mint'}`}>
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}