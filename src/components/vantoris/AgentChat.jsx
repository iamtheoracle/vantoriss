import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight, Search, Plus, Menu, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const COLORS = {
  container: '#151c26',
  sidebar: '#1a2330',
  surface: '#1f2a38',
  border: '#2a3645',
  textPrimary: '#ffffff',
  textSecondary: '#aab8c2',
  accent: '#c9a227',
  accentBright: '#ffc107',
};

export default function AgentChat({
  agentName = 'vantoris_assistant',
  title = 'Vantoris AI Assistant',
  subtitle = 'Platform-wide operations',
  suggestions = null,
  inputPlaceholder = 'Ask about members, applications, KYC status, account balances...'
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);

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
      if (convs && convs.length > 0 && !activeConv) {
        setActiveConv(convs[0]);
        setMessages(convs[0].messages || []);
      }
    } catch (e) { console.error('Load conversations error:', e); }
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
    } catch (e) { console.error('Create conversation error:', e); }
  }

  async function deleteConversation(convId) {
    try {
      setConversations(conversations.filter(c => c.id !== convId));
      if (activeConv?.id === convId) {
        const next = conversations.find(c => c.id !== convId) || null;
        setActiveConv(next);
        setMessages(next?.messages || []);
      }
    } catch (e) { console.error('Delete conversation error:', e); }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const content = input.trim();
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

  const filteredConversations = conversations.filter(conv =>
    (conv.metadata?.name || 'Conversation').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{ height: 'calc(100vh - 140px)', background: COLORS.container, border: '1px solid ' + COLORS.border }}
    >
      {/* Conversation History Sidebar */}
      <div
        className="flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden"
        style={{ width: sidebarOpen ? '300px' : '0', borderRight: sidebarOpen ? '1px solid ' + COLORS.border : 'none', background: COLORS.sidebar }}
      >
        {/* New Conversation Button */}
        <div className="p-4" style={{ borderBottom: '1px solid ' + COLORS.border }}>
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
            style={{ background: COLORS.accentBright, color: COLORS.container }}
          >
            <Plus size={14} strokeWidth={3} />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3" style={{ borderBottom: '1px solid ' + COLORS.border }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-all"
              style={{ background: COLORS.surface, color: COLORS.textPrimary, border: '1px solid ' + COLORS.border }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto vantoris-scroll p-2">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={16} className="animate-spin" style={{ color: COLORS.accent }} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center" style={{ color: COLORS.textSecondary }}>
              <Bot size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No conversations yet</p>
              <p className="text-[10px] opacity-50 mt-1">Start a new one to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="px-2 py-1.5 text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: COLORS.textSecondary }}>Recent</p>
              {filteredConversations.map(conv => (
                <ConversationCard
                  key={conv.id}
                  conv={conv}
                  isActive={activeConv?.id === conv.id}
                  onSelect={() => { setActiveConv(conv); setMessages(conv.messages || []); }}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid ' + COLORS.border }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-all flex-shrink-0"
              style={{ color: COLORS.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.background = COLORS.surface}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                <Bot size={18} style={{ color: COLORS.accentBright }} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate" style={{ color: COLORS.textPrimary }}>{title}</h3>
                <p className="text-xs" style={{ color: COLORS.textSecondary }}>{subtitle}</p>
              </div>
            </div>
          </div>
          {activeConv && (
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: COLORS.surface, color: COLORS.textSecondary }}
              >
                {messages.length} messages
              </span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full" title="Active" />
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto vantoris-scroll px-6 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255, 193, 7, 0.08)' }}>
                <Bot size={32} style={{ color: COLORS.accentBright }} />
              </div>
              <h4 className="font-bold text-base mb-1" style={{ color: COLORS.textPrimary }}>What can I help you with?</h4>
              <p className="text-sm max-w-sm mb-8" style={{ color: COLORS.textSecondary }}>
                I have full access to your Vantoris platform. Ask me about members, accounts, applications, withdrawals, KYC status, and more.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                {(suggestions || [
                  'Show me pending applications',
                  'What is the total AUM?',
                  'List the top 10 accounts by balance',
                  'How many members completed KYC?',
                ]).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-lg text-xs transition-all hover:opacity-80"
                    style={{ background: 'rgba(42, 54, 69, 0.4)', color: COLORS.textSecondary, border: '1px solid ' + COLORS.border }}
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
            <div
              className="flex items-center gap-3 text-sm rounded-lg p-4 w-fit"
              style={{ background: 'rgba(42, 54, 69, 0.3)', color: COLORS.textSecondary }}
            >
              <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: COLORS.accent }} />
              <span>Processing your request...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4" style={{ borderTop: '1px solid ' + COLORS.border }}>
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              className="flex-1 rounded-lg px-4 py-3 text-sm focus:outline-none resize-none max-h-24 selectable-content transition-all"
              style={{ background: COLORS.surface, color: COLORS.textPrimary, border: '1px solid ' + COLORS.border }}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-10 h-10 flex items-center justify-center rounded-lg transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: COLORS.accentBright, color: COLORS.container }}
              title="Send message (Shift+Enter for new line)"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] mt-2 opacity-50" style={{ color: COLORS.textSecondary }}>Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

function ConversationCard({ conv, isActive, onSelect, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const title = conv.metadata?.name || 'Conversation';
  const date = new Date(conv.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="group w-full text-left px-3 py-2.5 rounded-lg cursor-pointer transition-all"
      style={{
        background: isActive ? 'rgba(255, 193, 7, 0.08)' : 'transparent',
        border: '1px solid ' + (isActive ? 'rgba(255, 193, 7, 0.2)' : 'transparent'),
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-xs truncate"
            style={{ color: isActive ? COLORS.accentBright : COLORS.textSecondary }}
          >
            {title}
          </p>
          <p className="text-[10px] mt-0.5 opacity-50" style={{ color: COLORS.textSecondary }}>{date}</p>
        </div>
        {showActions && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded transition-all flex-shrink-0"
            style={{ color: COLORS.textSecondary }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textSecondary; }}
            title="Delete"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-3xl">
        <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isUser ? 'rgba(255, 193, 7, 0.12)' : COLORS.surface }}
          >
            {isUser
              ? <User size={14} style={{ color: COLORS.accentBright }} />
              : <Bot size={14} style={{ color: COLORS.accentBright }} />
            }
          </div>
          <div
            className="px-4 py-3 rounded-lg"
            style={{
              background: isUser ? 'rgba(42, 54, 69, 0.6)' : 'rgba(42, 54, 69, 0.5)',
              border: '1px solid ' + (isUser ? 'rgba(201, 162, 39, 0.15)' : COLORS.border),
              color: isUser ? '#e0e0e0' : COLORS.textSecondary,
            }}
          >
            {message.content && (
              isUser ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                <ReactMarkdown
                  className="text-sm max-w-none [&_p]:my-2 [&_h1]:my-3 [&_h2]:my-2 [&_h3]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li]:ml-4 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-xs [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_table]:w-full [&_table]:text-xs [&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-1 [&_strong]:text-white [&_em]:text-inherit"
                  components={{
                    code: ({ node, inline, className, children, ...props }) => (
                      <code
                        className={className}
                        style={{ background: COLORS.container, color: COLORS.textPrimary }}
                        {...props}
                      >
                        {children}
                      </code>
                    ),
                    pre: ({ node, children, ...props }) => (
                      <pre
                        style={{ background: COLORS.container, border: '1px solid ' + COLORS.border }}
                        {...props}
                      >
                        {children}
                      </pre>
                    ),
                  }}
                >
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
  const statusColor = isFailed ? '#ef4444' : (status === 'pending' || status === 'running') ? COLORS.accent : '#22c55e';

  let parsedResults = null;
  try {
    parsedResults = typeof toolCall.results === 'string' ? JSON.parse(toolCall.results) : toolCall.results;
  } catch {
    parsedResults = toolCall.results;
  }

  const hideDetails = toolCall.display_projection?.hide_details && toolCall.display_projection?.details_redacted;

  if (hideDetails) {
    return (
      <div className="mt-2 text-xs" style={{ color: statusColor }}>
        {isFailed ? (toolCall.display_projection?.error_label || 'Failed') :
         status === 'pending' || status === 'running' ? (toolCall.display_projection?.active_label || 'Processing...') :
         (toolCall.display_projection?.label || toolCall.name)}
      </div>
    );
  }

  return (
    <div
      className="mt-4 text-xs rounded-lg overflow-hidden"
      style={{ border: '1px solid ' + COLORS.border, background: 'rgba(21, 28, 38, 0.4)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(42, 54, 69, 0.4)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {expanded
            ? <ChevronDown size={14} style={{ color: COLORS.accent }} />
            : <ChevronRight size={14} style={{ color: COLORS.accent }} />
          }
        </div>
        <span className="font-semibold flex-1 uppercase tracking-wide text-[10px]" style={{ color: COLORS.textSecondary }}>
          {toolCall.name}
        </span>
        <span className="capitalize font-medium text-[10px]" style={{ color: statusColor }}>{status}</span>
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-3" style={{ borderTop: '1px solid ' + COLORS.border, background: 'rgba(21, 28, 38, 0.2)' }}>
          {toolCall.arguments_string && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2 opacity-60" style={{ color: COLORS.textSecondary }}>Parameters</p>
              <pre
                className="text-[11px] overflow-x-auto whitespace-pre-wrap p-2 rounded"
                style={{ background: 'rgba(21, 28, 38, 0.6)', color: '#22c55e', border: '1px solid ' + COLORS.border }}
              >
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {parsedResults !== null && parsedResults !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2 opacity-60" style={{ color: COLORS.textSecondary }}>Result</p>
              <pre
                className="text-[11px] overflow-x-auto whitespace-pre-wrap p-2 rounded"
                style={{
                  background: 'rgba(21, 28, 38, 0.6)',
                  border: '1px solid ' + (isFailed ? 'rgba(239, 68, 68, 0.3)' : COLORS.border),
                  color: isFailed ? '#ef4444' : 'rgba(34, 197, 94, 0.8)',
                }}
              >
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}