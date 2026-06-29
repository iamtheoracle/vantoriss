import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, Shield, ArrowDownLeft, ArrowUpRight, Info, Send, MessageCircle, ChevronRight, X } from 'lucide-react';
import { OPERATIONS_EMAIL } from '@/lib/businessConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const typeIcons = {
  success: { icon: CheckCheck, bg: 'bg-olive/20', color: 'text-emerald-400' },
  warning: { icon: Shield, bg: 'bg-brass/15', color: 'text-brass' },
  action: { icon: ArrowUpRight, bg: 'bg-crimson/15', color: 'text-red-400' },
  info: { icon: Info, bg: 'bg-blue-500/15', color: 'text-blue-400' },
};

export default function Messages() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [repliedIds, setRepliedIds] = useState([]);
  const [threads, setThreads] = useState([]);
  const [openThread, setOpenThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadReply, setThreadReply] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const [notifs, thrds] = await Promise.all([
      base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 50),
      base44.entities.MessageThread.filter({ user_id: me.id }, '-created_date', 50),
    ]);
    setNotifications(notifs);
    setThreads(thrds);
    setLoading(false);
    // Mark all notifications as read
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      base44.entities.Notification.update(n.id, { read: true });
    }
  }

  async function sendReply(notif) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      // Create or reuse a conversation thread for this notification topic
      const subject = notif.title || 'Message to Support';
      const existing = threads.find(t => t.subject === subject && t.status !== 'closed');
      let threadId;
      if (existing) {
        threadId = existing.id;
      } else {
        const thread = await base44.entities.MessageThread.create({
          user_id: user.id,
          subject,
          last_message: replyText,
          last_sender: 'member',
          last_message_date: new Date().toISOString(),
          unread_by_member: false,
          unread_by_admin: true,
        });
        threadId = thread.id;
      }
      await base44.entities.ThreadMessage.create({
        thread_id: threadId,
        user_id: user.id,
        sender: 'member',
        body: replyText,
      });
      await base44.entities.MessageThread.update(threadId, {
        last_message: replyText.slice(0, 200),
        last_sender: 'member',
        last_message_date: new Date().toISOString(),
        unread_by_admin: true,
      });
      // Notify operations team via email
      await base44.integrations.Core.SendEmail({
        to: OPERATIONS_EMAIL,
        subject: `Member Message: ${subject}`,
        body: `Member: ${user?.full_name || 'Unknown'} (${user?.email || 'No email'})\n\nOriginal Notification: ${notif.title}\n${notif.message}\n\nMember Reply:\n${replyText}\n\nView and reply in the Operations Center under Member Messages.`,
      });
      setRepliedIds(prev => [...prev, notif.id]);
      setReplyingTo(null);
      setReplyText('');
      loadData();
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  async function openConversation(thread) {
    setOpenThread(thread);
    setThreadReply('');
    try {
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: thread.id }, 'created_date', 200);
      setThreadMessages(msgs);
      if (thread.unread_by_member) {
        await base44.entities.MessageThread.update(thread.id, { unread_by_member: false });
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread_by_member: false } : t));
      }
    } catch (e) { console.error(e); }
  }

  async function sendThreadReply() {
    if (!threadReply.trim() || !openThread) return;
    setSending(true);
    try {
      await base44.entities.ThreadMessage.create({
        thread_id: openThread.id,
        user_id: user.id,
        sender: 'member',
        body: threadReply,
      });
      await base44.entities.MessageThread.update(openThread.id, {
        last_message: threadReply.slice(0, 200),
        last_sender: 'member',
        last_message_date: new Date().toISOString(),
        unread_by_admin: true,
      });
      await base44.integrations.Core.SendEmail({
        to: OPERATIONS_EMAIL,
        subject: `Member Reply: ${openThread.subject}`,
        body: `Member: ${user?.full_name || 'Unknown'} (${user?.email || 'No email'})\n\nMember Reply:\n${threadReply}\n\nView and reply in the Operations Center under Member Messages.`,
      });
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: openThread.id }, 'created_date', 200);
      setThreadMessages(msgs);
      setThreadReply('');
      loadData();
    } catch (e) { console.error(e); }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const activeThreads = threads.filter(t => t.status !== 'closed' && t.last_sender === 'admin');

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Messages</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">{activeThreads.length > 0 ? `${activeThreads.length} active conversations · ` : ''}{notifications.length} notifications</p>

      {/* Conversations (threads with admin replies) */}
      {threads.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold text-sm mb-3">Conversations</h3>
          <div className="space-y-2">
            {threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => openConversation(thread)}
                className={`vantoris-card p-4 w-full text-left flex items-start gap-3 hover:border-brass/30 transition-all ${thread.unread_by_member ? 'border-brass/30' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${thread.status === 'closed' ? 'bg-[#242D38]' : 'bg-brass/15'}`}>
                  <MessageCircle size={16} className={thread.status === 'closed' ? 'text-[#AAB4C3]' : 'text-brass'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{thread.subject}</p>
                    {thread.unread_by_member && <span className="w-1.5 h-1.5 rounded-full bg-brass shrink-0" />}
                    {thread.status === 'closed' && <span className="text-[#AAB4C3]/50 text-[10px]">Closed</span>}
                  </div>
                  <p className="text-[#AAB4C3] text-xs mt-0.5 line-clamp-1">
                    <span className={thread.last_sender === 'admin' ? 'text-brass' : 'text-emerald-400'}>
                      {thread.last_sender === 'admin' ? 'Staff' : 'You'}:
                    </span>{' '}{thread.last_message}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#AAB4C3] shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <h3 className="text-white font-semibold text-sm mb-3">Notifications</h3>
      {notifications.length === 0 ? (
        <div className="vantoris-card p-8 text-center">
          <Bell size={32} className="text-[#AAB4C3] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No Notifications</p>
          <p className="text-[#AAB4C3] text-sm">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const t = typeIcons[notif.type] || typeIcons.info;
            const Icon = t.icon;
            return (
              <div
                key={notif.id}
                className={`vantoris-card p-4 flex items-start gap-3 ${!notif.read ? 'border-brass/20' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg}`}>
                  <Icon size={16} className={t.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{notif.title}</p>
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-brass shrink-0" />}
                  </div>
                  <p className="text-[#AAB4C3] text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-[#AAB4C3]/50 text-[10px] mt-1">
                    {new Date(notif.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {repliedIds.includes(notif.id) ? (
                    <p className="text-emerald-400 text-[11px] mt-2 flex items-center gap-1">
                      <CheckCheck size={12} /> Reply sent — see Conversations above
                    </p>
                  ) : replyingTo === notif.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply…"
                        rows={2}
                        className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-3 py-2 text-white text-sm focus:border-brass/50 focus:outline-none resize-none selectable-content"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendReply(notif)}
                          disabled={sending || !replyText.trim()}
                          className="flex-1 py-2 bg-brass text-[#0E1A2B] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          <Send size={12} /> Send
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          className="px-3 py-2 bg-[#242D38] text-[#AAB4C3] text-xs font-medium rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReplyingTo(notif.id); setReplyText(''); }}
                      className="text-brass text-[11px] font-medium mt-2"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conversation Thread Dialog */}
      <Dialog open={!!openThread} onOpenChange={() => setOpenThread(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{openThread?.subject || 'Conversation'}</DialogTitle>
          </DialogHeader>
          {openThread && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2 max-h-72 overflow-y-auto vantoris-scroll pr-1">
                {threadMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'member' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'member'
                        ? 'bg-brass/20 text-white border border-brass/20'
                        : 'bg-[#242D38] text-white'
                    }`}>
                      {msg.sender === 'admin' && msg.admin_name && (
                        <p className="text-brass text-[10px] font-medium mb-0.5">{msg.admin_name}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap selectable-content">{msg.body}</p>
                      <p className="text-[#AAB4C3]/50 text-[9px] mt-1">
                        {new Date(msg.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {threadMessages.length === 0 && <p className="text-[#AAB4C3] text-xs text-center py-4">No messages yet</p>}
              </div>
              {openThread.status !== 'closed' && (
                <div className="space-y-2">
                  <textarea
                    value={threadReply}
                    onChange={e => setThreadReply(e.target.value)}
                    placeholder="Type a message…"
                    rows={2}
                    className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none selectable-content"
                  />
                  <button
                    onClick={sendThreadReply}
                    disabled={sending || !threadReply.trim()}
                    className="w-full py-2.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send size={14} /> {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              )}
              {openThread.status === 'closed' && (
                <div className="flex items-center justify-center gap-2 text-[#AAB4C3] text-xs py-2">
                  <CheckCheck size={14} /> This conversation is closed
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}