import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight, Search, Trash2, Edit2, Pin, Menu, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AgentChat({ agentName = 'vantoris_assistant' }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [pinnedConvs, setPinnedConvs] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      if (convs && convs.length > 0 && !activeConv) {
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

  async function deleteConversation(convId) {
    try {
      // Rename to "deleted" since agents API may not support deletion
      const updated = { ...conversations.find(c => c.id === convId), metadata: { name: '[Deleted]' } };
      setConversations(conversations.filter(c => c.id !== convId));
      if (activeConv?.id === convId) {
        setActiveConv(conversations.find(c => c.id !== convId) || null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Delete conversation error:', e);
    }
  }

  async function renameConversation(convId, newName) {
    try {
      // Update locally since agents API may not support metadata updates
      const updated = conversations.find(c => c.id === convId);
      if (updated) {
        updated.metadata = { name: newName };
        setConversations([...conversations]);
        if (activeConv?.id === convId) {
          setActiveConv(updated);
        }
      }
      setShowRenameDialog(null);
      setRenameText('');
    } catch (e) {
      console.error('Rename conversation error:', e);
    }
  }

  function togglePin(convId) {
    const newPinned = new Set(pinnedConvs);
    if (newPinned.has(convId)) {
      newPinned.delete(convId);
    } else {
      newPinned.add(convId);
    }
    setPinnedConvs(newPinned);
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

  const filteredConversations = conversations.filter(conv =>
    (conv.metadata?.name || 'Conversation').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedList = filteredConversations.filter(c => pinnedConvs.has(c.id));
  const unpinnedList = filteredConversations.filter(c => !pinnedConvs.has(c.id));

  return (
    <div className="flex h-[calc(100vh-180px)] gap-0 bg-[#0E1A2B] rounded-2xl overflow-hidden border border-[#242D38]">
      {/* Sidebar */}
      <div className={`flex-shrink-0 flex flex-col border-r border-[#242D38] bg-[#1a2535] transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#242D38]">
          <button
            onClick={startNewConversation}
            className="w-full py-2.5 bg-brass text-[#0E1A2B] rounded-lg text-xs font-semibold hover:bg-brass/90 transition-all"
          >
            + New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#242D38]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#242D38] border border-[#242D38] rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-brass/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={16} className="animate-spin text-brass" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-[#AAB4C3] text-xs">
              <Bot size={24} className="mx-auto mb-2 opacity-40" />
              <p>No conversations yet</p>
              <p className="text-[10px] opacity-50 mt-1">Start a new one to begin</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Pinned Section */}
              {pinnedList.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[#AAB4C3] text-[10px] uppercase font-bold tracking-wider opacity-60">Pinned</div>
                  {pinnedList.map(conv => (
                    <ConversationCard
                      key={conv.id}
                      conv={conv}
                      isActive={activeConv?.id === conv.id}
                      isPinned={true}
                      onSelect={() => { setActiveConv(conv); setMessages(conv.messages || []); }}
                      onRename={() => { setShowRenameDialog(conv.id); setRenameText(conv.metadata?.name || ''); }}
                      onDelete={() => deleteConversation(conv.id)}
                      onPin={() => togglePin(conv.id)}
                    />
                  ))}
                </>
              )}

              {/* Unpinned Section */}
              {unpinnedList.length > 0 && (
                <>
                  {pinnedList.length > 0 && <div className="my-2 border-t border-[#242D38]" />}
                  <div className="px-2 py-1.5 text-[#AAB4C3] text-[10px] uppercase font-bold tracking-wider opacity-60">Recent</div>
                  {unpinnedList.map(conv => (
                    <ConversationCard
                      key={conv.id}
                      conv={conv}
                      isActive={activeConv?.id === conv.id}
                      isPinned={false}
                      onSelect={() => { setActiveConv(conv); setMessages(conv.messages || []); }}
                      onRename={() => { setShowRenameDialog(conv.id); setRenameText(conv.metadata?.name || ''); }}
                      onDelete={() => deleteConversation(conv.id)}
                      onPin={() => togglePin(conv.id)}
                    />
                  ))}
                </>
              )}

              {searchTerm && filteredConversations.length === 0 && (
                <div className="p-4 text-center text-[#AAB4C3] text-xs">No matches found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#242D38] bg-[#0E1A2B]/40">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#242D38] rounded-lg transition-all flex-shrink-0"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <ChevronDown size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brass/15 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-brass" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-sm truncate">Vantoris AI Assistant</h3>
                <p className="text-[#AAB4C3] text-xs">Platform-wide operations</p>
              </div>
            </div>
          </div>
          {activeConv && (
            <div className="flex items-center gap-3 ml-4">
              <span className="text-[#AAB4C3] text-xs bg-[#242D38] px-2.5 py-1 rounded-full flex-shrink-0">{messages.length} messages</span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" title="Active"></span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-brass/10 flex items-center justify-center mb-4">
                <Bot size={32} className="text-brass" />
              </div>
              <h4 className="text-white font-bold text-base mb-1">What can I help you with?</h4>
              <p className="text-[#AAB4C3] text-sm max-w-sm mb-8">
                I have full access to your Vantoris platform. Ask me about members, accounts, applications, withdrawals, KYC status, and more.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                {[
                  'Show me pending applications',
                  'What is the total AUM?',
                  'List the top 10 accounts by balance',
                  'How many members completed KYC?',
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
        <div className="p-4 border-t border-[#242D38] bg-[#0E1A2B]/40">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about members, applications, KYC status, account balances..."
              className="flex-1 bg-[#242D38] border border-[#242D38] rounded-lg px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none max-h-24 selectable-content"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-10 h-10 flex items-center justify-center bg-brass text-[#0E1A2B] rounded-lg hover:bg-brass/90 transition-all disabled:opacity-40 flex-shrink-0 font-bold"
              title="Send message (Shift+Enter for new line)"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[#AAB4C3] text-[10px] mt-2 opacity-60">Shift+Enter for new line</p>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!showRenameDialog} onOpenChange={() => setShowRenameDialog(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38]">
          <DialogHeader>
            <DialogTitle className="text-white">Rename Conversation</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                renameConversation(showRenameDialog, renameText);
              }
            }}
            placeholder="New name..."
            className="w-full bg-[#242D38] border border-[#242D38] rounded-lg px-4 py-2 text-white text-sm focus:border-brass/50 focus:outline-none"
          />
          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={() => setShowRenameDialog(null)}
              className="px-4 py-2 text-[#AAB4C3] text-sm hover:bg-[#242D38] rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => renameConversation(showRenameDialog, renameText)}
              className="px-4 py-2 bg-brass text-[#0E1A2B] text-sm font-semibold rounded-lg hover:bg-brass/90 transition-all"
            >
              Rename
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConversationCard({ conv, isActive, isPinned, onSelect, onRename, onDelete, onPin }) {
  const [showActions, setShowActions] = useState(false);
  const title = conv.metadata?.name || 'Conversation';
  const date = new Date(conv.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border group ${
        isActive
          ? 'bg-brass/10 text-brass border-brass/30'
          : 'text-[#AAB4C3] hover:bg-[#242D38]/50 border-[#242D38]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-xs truncate ${isActive ? 'text-brass' : ''}`}>{title}</p>
          <p className="text-[10px] opacity-50 mt-0.5">{date}</p>
        </div>
        <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            title={isPinned ? 'Unpin' : 'Pin'}
            className="p-1 hover:bg-[#242D38] rounded transition-all"
          >
            <Pin size={12} className={isPinned ? 'text-brass fill-brass' : ''} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            title="Rename"
            className="p-1 hover:bg-[#242D38] rounded transition-all"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            className="p-1 hover:bg-crimson/10 rounded transition-all text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl`}>
        <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-brass/20' : 'bg-[#242D38]'
          }`}>
            {isUser ? <User size={14} className="text-brass" /> : <Bot size={14} className="text-brass" />}
          </div>
          <div className={`px-4 py-3 rounded-lg ${
            isUser ? 'bg-brass/15 border border-brass/20 text-white' : 'bg-[#242D38]/70 border border-[#242D38] text-[#AAB4C3]'
          }`}>
            {message.content && (
              isUser ? (
                <p className="text-sm">{message.content}</p>
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