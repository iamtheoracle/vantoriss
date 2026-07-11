import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Sparkles,
  Shield,
  Phone,
  MessageCircle,
  Calendar,
  Mail,
  ChevronRight,
  Star,
  Trash2,
  Clock,
} from 'lucide-react';
import { getMessageKey, isStarred, toggleStar, addDeletedId, getDeletedIds } from '@/lib/starredMessages';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';
import ConversationTabs from '@/components/vantoris/chat/ConversationTabs';
import ChatMessage from '@/components/vantoris/chat/ChatMessage';
import ChatInputBar from '@/components/vantoris/chat/ChatInputBar';
import BankingCards from '@/components/vantoris/chat/BankingCards';
import TypingIndicator from '@/components/vantoris/chat/TypingIndicator';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useToast } from '@/components/ui/use-toast';

const SUGGESTIONS = [
  'What is my current account balance?',
  'Show me my recent transactions',
  'What is my KYC status?',
  'What services can I request?',
];

function DateSeparator({ label }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[10px] font-semibold text-gray/70 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200">
        {label}
      </span>
    </div>
  );
}

function formatDateGroup(dateStr) {
  if (!dateStr) return 'Today';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowDateSeparator(messages, idx) {
  if (idx === 0) return true;
  const prev = messages[idx - 1];
  const curr = messages[idx];
  const prevDate = new Date(prev.created_date || prev.timestamp || Date.now()).toDateString();
  const currDate = new Date(curr.created_date || curr.timestamp || Date.now()).toDateString();
  return prevDate !== currDate;
}

export default function MemberAdvisorChat() {
  const [activeTab, setActiveTab] = useState('advisor');
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const [starredOnly, setStarredOnly] = useState(false);
  const [starredVersion, setStarredVersion] = useState(0);
  const messagesEndRef = useRef(null);
  const whatsappNumber = useWhatsAppConfig();
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'advisor') {
      loadConversations();
    } else {
      setLoadingConv(false);
      setMessages([]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeConv && activeTab === 'advisor') {
      const unsubscribe = base44.agents.subscribeToConversation(activeConv.id, (data) => {
        setMessages(data.messages || []);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeConv, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadConversations() {
    setLoadingConv(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: 'member_advisor' });
      const deleted = getDeletedIds('member_advisor');
      const filtered = (convs || []).filter(c => !deleted.has(c.id));
      setConversations(filtered);
      if (filtered.length > 0) {
        setActiveConv(filtered[0]);
        setMessages(filtered[0].messages || []);
      }
    } catch (e) {
      console.error('Load conversations error:', e);
      toast({ title: 'Chat load failed', description: e.message || 'Unable to load conversations.', variant: 'destructive' });
    }
    setLoadingConv(false);
  }

  function deleteConversation(convId) {
    addDeletedId('member_advisor', convId);
    const remaining = conversations.filter(c => c.id !== convId);
    setConversations(remaining);
    if (activeConv?.id === convId) {
      const next = remaining[0] || null;
      setActiveConv(next);
      setMessages(next?.messages || []);
    }
  }

  function startNewConversation() {
    setActiveConv(null);
    setMessages([]);
  }

  async function generateConversationTitle(firstMessage) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a very short title (3-6 words, no quotes, no trailing punctuation) for a conversation that starts with this message:\n\n"${firstMessage}"\n\nTitle:`,
      });
      const title = (typeof result === 'string' ? result : (result.response || result.result || '')).trim();
      return title.slice(0, 60) || firstMessage.slice(0, 40);
    } catch {
      return firstMessage.length > 40 ? firstMessage.slice(0, 40) + '…' : firstMessage;
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: text, created_date: new Date().toISOString() }]);

    let conv = activeConv;
    if (!conv) {
      const title = await generateConversationTitle(text);
      conv = await base44.agents.createConversation({
        agent_name: 'member_advisor',
        metadata: { name: title, description: 'Member advisory chat' },
      });
      if (!conv.metadata) conv.metadata = { name: title };
      setConversations([conv, ...conversations]);
      setActiveConv(conv);
    }

    try {
      await base44.agents.addMessage(conv, { role: 'user', content: text });
    } catch (e) {
      console.error('Send message error:', e);
      toast({ title: 'Message failed', description: e.message || 'Unable to send message. Please try again.', variant: 'destructive' });
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      {/* Conversation Tabs */}
      <ConversationTabs active={activeTab} onChange={setActiveTab} />

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-2">
        {/* Header */}
        <ChatHeader
          activeTab={activeTab}
          whatsappNumber={whatsappNumber}
          conversations={conversations}
          activeConv={activeConv}
          onSelectConv={(conv) => { setActiveConv(conv); setMessages(conv.messages || []); }}
          onDeleteConv={deleteConversation}
          onToggleStarred={() => setStarredOnly(!starredOnly)}
          starredOnly={starredOnly}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto vantoris-scroll px-3 py-3 bg-slate-50/40">
          {loadingConv && (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-navy" />
            </div>
          )}

          {activeTab === 'advisor' && messages.length === 0 && !loadingConv && !starredOnly && (
            <EmptyAdvisorState onSuggestion={sendMessage} />
          )}

          {activeTab === 'advisor' && starredOnly && messages.length > 0 && !loadingConv &&
            messages.filter(msg => activeConv && isStarred(activeConv.id, getMessageKey(msg))).length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Star size={32} className="text-gray/40 mb-2" />
              <p className="text-gray text-sm">No starred messages</p>
              <p className="text-gray/60 text-xs mt-1">Star important messages to find them here</p>
            </div>
          )}

          {activeTab === 'support' && !loadingConv && (
            <SupportChannel whatsappNumber={whatsappNumber} />
          )}

          {activeTab === 'manager' && !loadingConv && (
            <ManagerChannel />
          )}

          {activeTab === 'advisor' && (() => {
            const displayed = starredOnly && activeConv
              ? messages.filter(msg => isStarred(activeConv.id, getMessageKey(msg)))
              : messages;
            return displayed.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const prevMsg = displayed[idx - 1];
              const nextMsg = displayed[idx + 1];
              const showDateSep = shouldShowDateSeparator(displayed, idx);
              const showAvatar = !nextMsg || nextMsg.role !== msg.role;
              const isLastInGroup = !nextMsg || nextMsg.role !== msg.role;
              return (
                <React.Fragment key={idx}>
                  {showDateSep && <DateSeparator label={formatDateGroup(msg.created_date)} />}
                  <ChatMessage
                    message={msg}
                    isUser={isUser}
                    showAvatar={showAvatar}
                    isLastInGroup={isLastInGroup}
                    convId={activeConv?.id}
                    onStarToggle={() => setStarredVersion(v => v + 1)}
                  />
                </React.Fragment>
              );
            });
          })()}

          {loading && activeTab === 'advisor' && (
            <div className="flex items-start gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-navy/8 flex items-center justify-center flex-shrink-0 self-end">
                <VantorisMonogram size={18} variant="flat" theme="light" />
              </div>
              <div className="vantoris-chat-bubble-in rounded-2xl rounded-bl-md">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Banking Quick Actions */}
        {activeTab === 'advisor' && <BankingCards />}

        {/* Input Bar */}
        {activeTab === 'advisor' && (
          <ChatInputBar onSend={sendMessage} disabled={loading} />
        )}
        {activeTab !== 'advisor' && (
          <ChannelInputBar activeTab={activeTab} whatsappNumber={whatsappNumber} />
        )}
      </div>
    </div>
  );
}

function ChatHeader({ activeTab, whatsappNumber, conversations, activeConv, onSelectConv, onDeleteConv, onToggleStarred, starredOnly }) {
  const [showHistory, setShowHistory] = useState(false);
  const config = {
    advisor: { name: 'Vantoris Advisor', status: 'Online · AI Financial Guide', online: true },
    support: { name: 'Human Support', status: whatsappNumber ? `WhatsApp · ${whatsappNumber}` : 'Available via WhatsApp', online: true },
    manager: { name: 'Relationship Manager', status: 'Your dedicated RM', online: true },
  };
  const info = config[activeTab];

  return (
    <div className="flex items-center gap-3 p-3.5 border-b border-slate-200 vantoris-glass-header">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-navy/8 flex items-center justify-center">
          <VantorisMonogram size={24} variant="flat" theme="light" />
        </div>
        {info.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-mint rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate">{info.name}</h3>
        <p className="text-gray text-xs truncate flex items-center gap-1">
          {info.status}
        </p>
      </div>
      {activeTab === 'advisor' && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleStarred}
            className={`p-2 rounded-lg transition-all ${starredOnly ? 'bg-gold/15 text-gold' : 'text-gray hover:bg-slate-100 hover:text-foreground'}`}
            title="Show starred messages only"
          >
            <Star size={16} fill={starredOnly ? 'currentColor' : 'none'} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg text-gray hover:bg-slate-100 hover:text-foreground transition-all"
              title="Conversation history"
            >
              <Clock size={16} />
            </button>
            {showHistory && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto vantoris-scroll">
                  {conversations.length === 0 ? (
                    <p className="p-4 text-center text-gray text-sm">No conversations</p>
                  ) : conversations.map(conv => (
                    <div key={conv.id} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0 ${activeConv?.id === conv.id ? 'bg-navy/5' : ''}`}>
                      <button
                        onClick={() => { onSelectConv(conv); setShowHistory(false); }}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{conv.metadata?.name || 'Conversation'}</p>
                        <p className="text-xs text-gray truncate">{conv.messages?.[conv.messages.length - 1]?.content?.slice(0, 50) || 'No messages'}</p>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteConv(conv.id); }}
                        className="p-1.5 rounded-lg text-gray hover:bg-crimson/10 hover:text-crimson transition-all flex-shrink-0"
                        title="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-navy/5">
        <Shield size={12} className="text-navy" />
        <span className="text-navy text-[9px] font-semibold uppercase tracking-wider">Encrypted</span>
      </div>
    </div>
  );
}

function EmptyAdvisorState({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-16 h-16 rounded-2xl bg-navy/8 flex items-center justify-center mb-4"
      >
        <Sparkles size={28} className="text-navy" />
      </motion.div>
      <h4 className="font-semibold text-foreground mb-1">How can I help you today?</h4>
      <p className="text-gray text-sm max-w-xs mb-5">
        Ask me about your accounts, transactions, onboarding status, or available services.
      </p>
      <div className="space-y-2 w-full max-w-sm">
        {SUGGESTIONS.map((suggestion, idx) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => onSuggestion(suggestion)}
            className="flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-navy/20 hover:bg-navy/3 text-foreground text-xs font-medium transition-all"
          >
            {suggestion}
            <ChevronRight size={14} className="text-gray/40" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function SupportChannel({ whatsappNumber }) {
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : '#';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-mint/10 flex items-center justify-center mb-4">
        <MessageCircle size={28} className="text-mint" />
      </div>
      <h4 className="font-semibold text-foreground mb-1">Human Support via WhatsApp</h4>
      <p className="text-gray text-sm max-w-xs mb-6">
        Connect with our support team directly through WhatsApp Business. Your conversation stays private and secure.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 w-full max-w-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-mint/10 flex items-center justify-center">
            <Phone size={16} className="text-mint" />
          </div>
          <div>
            <p className="text-xs text-gray">WhatsApp Number</p>
            <p className="text-sm font-semibold text-foreground">{whatsappNumber || 'Not configured'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy/8 flex items-center justify-center">
            <Mail size={16} className="text-navy" />
          </div>
          <div>
            <p className="text-xs text-gray">Hours</p>
            <p className="text-sm font-semibold text-foreground">Mon–Fri, 8AM–8PM ET</p>
          </div>
        </div>
      </div>
      {whatsappNumber && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full max-w-xs py-3 bg-mint text-white font-semibold rounded-xl text-sm hover:bg-mint/90 transition flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          Continue on WhatsApp
        </a>
      )}
    </div>
  );
}

function ManagerChannel() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-4">
        <Calendar size={28} className="text-gold" />
      </div>
      <h4 className="font-semibold text-foreground mb-1">Your Relationship Manager</h4>
      <p className="text-gray text-sm max-w-xs mb-6">
        Schedule a private consultation with your dedicated relationship manager for personalized wealth management guidance.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 w-full max-w-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy/8 flex items-center justify-center">
            <VantorisMonogram size={22} variant="flat" theme="light" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Assigned RM</p>
            <p className="text-xs text-gray">Vantoris Wealth Management</p>
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate('/advisor')}
        className="mt-5 w-full max-w-xs py-3 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy/90 transition flex items-center justify-center gap-2"
      >
        <Calendar size={16} />
        Schedule Appointment
      </button>
    </div>
  );
}

function ChannelInputBar({ activeTab, whatsappNumber }) {
  const navigate = useNavigate();

  if (activeTab === 'support' && whatsappNumber) {
    const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;
    return (
      <div className="p-3 border-t border-slate-200 bg-white safe-bottom">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 bg-mint text-white font-semibold rounded-xl text-sm hover:bg-mint/90 transition flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          Open WhatsApp Chat
        </a>
      </div>
    );
  }
  if (activeTab === 'manager') {
    return (
      <div className="p-3 border-t border-slate-200 bg-white safe-bottom">
        <button
          onClick={() => navigate('/advisor')}
          className="w-full h-11 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy/90 transition flex items-center justify-center gap-2"
        >
          <Calendar size={16} />
          Book Appointment
        </button>
      </div>
    );
  }
  return null;
}