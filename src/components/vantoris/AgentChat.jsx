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
      {/* Conversation List */}
      <div className="w-64 flex-shrink-0 vantoris-card p-3 overflow-y-auto">
        <button
          onClick={startNewConversation}
          className="w-full mb-3 py-2.5 bg-brass text-[#0E1A2B] rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all"
        >
          + New Chat
        </button>
        {loadingConvs ? (
          <div className="text-center py-4">
            <Loader2 size={16} className="animate-spin text-brass mx-auto" />
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConv(conv);
                  setMessages(conv.messages || []);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                  activeConv?.id === conv.id
                    ? 'bg-brass/15 text-brass'
                    : 'text-[#AAB4C3] hover:bg-[#242D38]/60'
                }`}
              >
                <p className="font-medium truncate">
                  {conv.metadata?.name || 'Conversation'}
                </p>
                <p className="text-[10px] opacity-60 mt-0.5">
                  {new Date(conv.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-[#AAB4C3] text-xs text-center py-4">No conversations yet</p>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 vantoris-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#242D38]">
          <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center">
            <Bot size={20} className="text-brass" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Vantoris Assistant</h3>
            <p className="text-[#AAB4C3] text-xs">AI-powered operations agent</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-brass/10 flex items-center justify-center mb-4">
                <Bot size={32} className="text-brass" />
              </div>
              <h4 className="text-white font-semibold mb-1">How can I help?</h4>
              <p className="text-[#AAB4C3] text-sm max-w-xs">
                Ask me about pending applications, account balances, withdrawals, or any platform data.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  'How many pending applications are there?',
                  'Show me the top 5 accounts by balance',
                  'What is the total AUM right now?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="block w-full text-left px-4 py-2 rounded-xl bg-[#242D38]/40 hover:bg-[#242D38] text-[#AAB4C3] text-xs transition-all"
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
            <div className="flex items-center gap-2 text-[#AAB4C3] text-sm">
              <Loader2 size={14} className="animate-spin text-brass" />
              <span>Assistant is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#242D38]">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Vantoris Assistant..."
              className="flex-1 bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-11 h-11 flex items-center justify-center bg-brass text-[#0E1A2B] rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40 flex-shrink-0"
            >
              <Send size={16} />
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
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-[#242D38]' : 'bg-brass/15'
        }`}>
          {isUser ? <User size={16} className="text-[#AAB4C3]" /> : <Bot size={16} className="text-brass" />}
        </div>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-brass/15 text-white' : 'bg-[#242D38]/60 text-white'
        }`}>
          {message.content && (
            isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
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
    <div className="mt-2 text-xs border border-[#242D38] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#242D38]/40 transition-all"
      >
        {expanded ? <ChevronDown size={12} className="text-[#AAB4C3]" /> : <ChevronRight size={12} className="text-[#AAB4C3]" />}
        <span className="text-[#AAB4C3] font-medium">{toolCall.name}</span>
        <span className={`ml-auto ${statusColor} capitalize`}>{status}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-[#242D38] space-y-2">
          {toolCall.arguments_string && (
            <div>
              <p className="text-[#AAB4C3] text-[10px] uppercase tracking-wider mb-1">Parameters</p>
              <pre className="text-[#AAB4C3] text-[11px] overflow-x-auto whitespace-pre-wrap">
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {parsedResults !== null && parsedResults !== undefined && (
            <div>
              <p className="text-[#AAB4C3] text-[10px] uppercase tracking-wider mb-1">Result</p>
              <pre className={`text-[11px] overflow-x-auto whitespace-pre-wrap ${isFailed ? 'text-red-400' : 'text-emerald-400/80'}`}>
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}