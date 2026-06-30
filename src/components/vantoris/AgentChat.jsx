import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export default function AgentChat({ agentName = 'vantoris_assistant' }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
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
      const convs = await base44.agents.listConversations({ agent_name: agentName });
      setConversations(convs || []);
      if (convs && convs.length > 0) {
        setActiveConv(convs[0]);
        setMessages(convs[0].messages || []);
      }
    } catch (e) {
      console.error('Load conversations error:', e);
    }
    setLoadingConvs(false);
  }

  async function startNewConversation() {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: { name: 'New Conversation', description: 'Admin assistance session' },
      });
      setConversations([conv, ...conversations]);
      setActiveConv(conv);
      setMessages([]);
    } catch (e) {
      console.error('Create conversation error:', e);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput('');

    if (!activeConv) {
      await startNewConversation();
    }

    const conv = activeConv;
    setLoading(true);

    // Optimistic update
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
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Conversation List Sidebar */}
      <div className="w-72 flex-shrink-0 bg-[#1a2535] border border-[#242D38] rounded-2xl p-4 overflow-y-auto flex flex-col">
        <button
          onClick={startNewConversation}
          className="w-full mb-4 py-3 bg-brass text-[#0E1A2B] rounded-lg text-sm font-semibold hover:bg-brass/90 transition-all"
        >
          + New Session
        </button>
        
        <div className="text-[#AAB4C3] text-xs uppercase tracking-wider font-medium mb-3">Session History</div>
        
        {loadingConvs ? (
          <div className="text-center py-8">
            <Loader2 size={16} className="animate-spin text-brass mx-auto" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-[#AAB4C3] text-xs text-center py-8 opacity-60">No sessions yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConv(conv);
                  setMessages(conv.messages || []);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs transition-all border ${
                  activeConv?.id === conv.id
                    ? 'bg-brass/10 text-brass border-brass/30'
                    : 'text-[#AAB4C3] hover:bg-[#242D38]/50 border-[#242D38]'
                }`}
              >
                <p className="font-medium truncate">
                  {conv.metadata?.name || 'Session'}
                </p>
                <p className="text-[10px] opacity-50 mt-1">
                  {new Date(conv.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-[#1a2535] border border-[#242D38] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#242D38] bg-[#0E1A2B]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brass/15 flex items-center justify-center">
              <Bot size={20} className="text-brass" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Vantoris AI Assistant</h3>
              <p className="text-[#AAB4C3] text-xs">Platform-wide operations & analytics</p>
            </div>
          </div>
          {activeConv && <span className="text-[#AAB4C3] text-xs bg-[#242D38] px-3 py-1 rounded-full">{messages.length} messages</span>}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-brass/10 flex items-center justify-center mb-6">
                <Bot size={40} className="text-brass" />
              </div>
              <h4 className="text-white font-bold text-lg mb-2">What can I help you with?</h4>
              <p className="text-[#AAB4C3] text-sm max-w-sm mb-8">
                I have full access to your Vantoris platform. Ask me about members, accounts, applications, withdrawals, and more.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                {[
                  'Show me pending applications',
                  'What is the total AUM?',
                  'List top 10 accounts by balance',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-[#242D38]/40 hover:bg-[#242D38] text-[#AAB4C3] text-xs transition-all border border-[#242D38]"
                  >
                    → {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-[#AAB4C3] text-sm bg-[#242D38]/30 rounded-lg p-4 w-fit">
              <Loader2 size={16} className="animate-spin text-brass flex-shrink-0" />
              <span>Processing your request...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-[#242D38] bg-[#0E1A2B]/40">
          <div className="flex items-end gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about members, accounts, applications, balance sheets..."
              className="flex-1 bg-[#242D38] border border-[#242D38] rounded-lg px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none max-h-24"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-11 h-11 flex items-center justify-center bg-brass text-[#0E1A2B] rounded-lg hover:bg-brass/90 transition-all disabled:opacity-40 flex-shrink-0 font-bold"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-2xl ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-brass/20' : 'bg-[#242D38]'
          }`}>
            {isUser ? <User size={16} className="text-brass" /> : <Bot size={16} className="text-brass" />}
          </div>
          <div className={`px-5 py-4 rounded-xl ${
            isUser ? 'bg-brass/15 border border-brass/20 text-white' : 'bg-[#242D38]/70 border border-[#242D38] text-[#AAB4C3]'
          }`}>
            {message.content && (
              isUser ? (
                <p className="text-sm font-medium">{message.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&_p]:my-2 [&_h1]:my-3 [&_h2]:my-2 [&_h3]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:ml-4 [&_code]:bg-[#0E1A2B] [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[#0E1A2B] [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_table]:w-full [&_table]:text-xs [&_thead]:bg-[#1a2535] [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-1 [&_strong]:text-white [&_em]:text-brass">
                  {message.content}
                </ReactMarkdown>
              )
            )}
            {message.tool_calls?.map((toolCall, idx) => (
              <ToolCallDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || 'completed';
  const isFailed = ['failed', 'error'].includes(status);
  const statusColor = isFailed ? 'text-red-400' : status === 'pending' || status === 'running' ? 'text-brass' : 'text-emerald-400';

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
    <div className="mt-4 text-xs border border-[#242D38] rounded-lg overflow-hidden bg-[#0E1A2B]/40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#242D38]/40 transition-all text-left"
      >
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {expanded ? <ChevronDown size={14} className="text-brass" /> : <ChevronRight size={14} className="text-brass" />}
        </div>
        <span className="text-[#AAB4C3] font-semibold flex-1 uppercase tracking-wide text-[10px]">{toolCall.name}</span>
        <span className={`${statusColor} capitalize font-medium text-[10px]`}>{status}</span>
      </button>
      {expanded && (
        <div className="px-4 py-3 border-t border-[#242D38] space-y-3 bg-[#0E1A2B]/20">
          {toolCall.arguments_string && (
            <div>
              <p className="text-[#AAB4C3] text-[10px] uppercase tracking-widest font-bold mb-2 opacity-60">Parameters</p>
              <pre className="text-emerald-400/70 text-[11px] overflow-x-auto whitespace-pre-wrap bg-[#0E1A2B]/60 p-2 rounded border border-[#242D38]">
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {parsedResults !== null && parsedResults !== undefined && (
            <div>
              <p className="text-[#AAB4C3] text-[10px] uppercase tracking-widest font-bold mb-2 opacity-60">Result</p>
              <pre className={`text-[11px] overflow-x-auto whitespace-pre-wrap bg-[#0E1A2B]/60 p-2 rounded border ${isFailed ? 'border-red-400/30' : 'border-[#242D38]'} ${isFailed ? 'text-red-400' : 'text-emerald-400/80'}`}>
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}