import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, CheckCheck, User } from 'lucide-react';
import ReadReceipt from '@/components/vantoris/chat/ReadReceipt';

export default function MemberMessages() {
  const [threads, setThreads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [thrds, usrs] = await Promise.all([
        base44.entities.MessageThread.list('-created_date', 100),
        base44.entities.User.list('-created_date', 200),
      ]);
      setThreads(thrds);
      setUsers(usrs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getUser(id) { return users.find(u => u.id === id); }

  async function openThread(thread) {
    setSelected(thread);
    setReply('');
    try {
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: thread.id }, 'created_date', 200);
      setMessages(msgs);
      if (thread.unread_by_admin) {
        await base44.entities.MessageThread.update(thread.id, { unread_by_admin: false });
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread_by_admin: false } : t));
      }
      // Mark all member messages as read by the admin (for read receipts)
      const memberUnread = msgs.filter(m => m.sender === 'member' && !m.read);
      for (const m of memberUnread) {
        base44.entities.ThreadMessage.update(m.id, { read: true });
      }
      if (memberUnread.length > 0) {
        setMessages(prev => prev.map(m => m.sender === 'member' ? { ...m, read: true } : m));
      }
    } catch (e) { console.error(e); }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.ThreadMessage.create({
        thread_id: selected.id,
        user_id: selected.user_id,
        sender: 'admin',
        body: reply,
        admin_name: me?.full_name || 'Vantoris Support',
      });
      await base44.entities.MessageThread.update(selected.id, {
        last_message: reply.slice(0, 200),
        last_sender: 'admin',
        last_message_date: new Date().toISOString(),
        unread_by_member: true,
        unread_by_admin: false,
      });
      // Notification is now created automatically by the entity automation
      const member = getUser(selected.user_id);
      if (member?.email) {
        await base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `Vantoris Support: ${selected.subject}`,
          body: `Dear ${member.full_name || 'Member'},\n\nYou have a new reply from Vantoris Support:\n\n${reply}\n\nView the full conversation in your Vantoris app under Messages.\n\nWarm regards,\nThe Vantoris Team`,
        });
      }
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: selected.id }, 'created_date', 200);
      setMessages(msgs);
      setReply('');
      loadData();
    } catch (e) { console.error(e); }
    setSending(false);
  }

  async function closeThread() {
    if (!selected) return;
    try {
      await base44.entities.MessageThread.update(selected.id, { status: 'closed' });
      setSelected(null);
      loadData();
    } catch (e) { console.error(e); }
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Member Messages" description="Reply to member inquiries" icon={MessageSquare}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const openThreads = threads.filter(t => t.status !== 'closed');
  const unreadCount = threads.filter(t => t.unread_by_admin).length;

  return (
    <OperationsPageLayout title="Member Messages" description="Reply to member inquiries within the app" icon={MessageSquare}>
      {unreadCount > 0 && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-brass/15 text-brass rounded-xl text-xs font-medium">
          <MessageSquare size={12} /> {unreadCount} unread {unreadCount === 1 ? 'thread' : 'threads'}
        </div>
      )}

      {threads.length === 0 ? (
        <div className="vantoris-card p-8 text-center">
          <MessageSquare size={32} className="text-[#AAB4C3] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No Member Messages</p>
          <p className="text-[#AAB4C3] text-sm">Member replies will appear here as conversation threads.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Member</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Subject</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Last Message</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">From</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {threads.map(thread => {
                  const member = getUser(thread.user_id);
                  return (
                    <tr key={thread.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                      <td className="px-5 py-4">
                        <p className="text-white font-medium text-sm">{member?.full_name || '—'}</p>
                        <p className="text-[#AAB4C3] text-xs">{member?.email || ''}</p>
                      </td>
                      <td className="px-5 py-4 text-white text-sm font-medium">{thread.subject}</td>
                      <td className="px-5 py-4 text-[#AAB4C3] text-xs max-w-xs truncate">{thread.last_message || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${thread.last_sender === 'admin' ? 'text-brass' : 'text-emerald-400'}`}>
                          {thread.last_sender === 'admin' ? 'Staff' : 'Member'}
                        </span>
                        {thread.unread_by_admin && thread.last_sender === 'member' && (
                          <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-brass" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                        {thread.last_message_date
                          ? new Date(thread.last_message_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : new Date(thread.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => openThread(thread)} className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all">
                          {thread.status === 'closed' ? 'View' : 'Open'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {threads.map(thread => {
              const member = getUser(thread.user_id);
              return (
                <button key={thread.id} onClick={() => openThread(thread)} className="vantoris-card p-4 w-full text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-medium text-sm">{member?.full_name || '—'}</p>
                    {thread.unread_by_admin && thread.last_sender === 'member' && <span className="w-2 h-2 rounded-full bg-brass" />}
                  </div>
                  <p className="text-white text-xs font-medium mb-1">{thread.subject}</p>
                  <p className="text-[#AAB4C3] text-xs line-clamp-1">{thread.last_message || '—'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] font-medium ${thread.last_sender === 'admin' ? 'text-brass' : 'text-emerald-400'}`}>
                      From: {thread.last_sender === 'admin' ? 'Staff' : 'Member'}
                    </span>
                    <span className="text-[#AAB4C3]/50 text-[10px]">
                      {thread.last_message_date ? new Date(thread.last_message_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Thread Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{selected?.subject || 'Conversation'}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 text-xs text-[#AAB4C3]">
                <User size={12} />
                {getUser(selected.user_id)?.full_name || 'Member'} · {getUser(selected.user_id)?.email || ''}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto vantoris-scroll pr-1">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'admin'
                        ? 'bg-brass/20 text-white border border-brass/20'
                        : 'bg-[#242D38] text-white'
                    }`}>
                      {msg.sender === 'admin' && msg.admin_name && (
                        <p className="text-brass text-[10px] font-medium mb-0.5">{msg.admin_name}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap selectable-content">{msg.body}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <p className="text-[#AAB4C3]/50 text-[9px]">
                          {new Date(msg.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {msg.sender === 'admin' && <ReadReceipt read={msg.read} />}
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-[#AAB4C3] text-xs text-center py-4">No messages yet</p>}
              </div>
              {selected.status !== 'closed' && (
                <div className="space-y-2">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    rows={3}
                    className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none selectable-content"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="flex-1 py-2.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Send size={14} /> {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      onClick={closeThread}
                      className="px-4 py-2.5 bg-[#242D38] text-[#AAB4C3] rounded-xl text-xs font-medium hover:text-white"
                    >
                      Close Thread
                    </button>
                  </div>
                </div>
              )}
              {selected.status === 'closed' && (
                <div className="flex items-center justify-center gap-2 text-[#AAB4C3] text-xs py-2">
                  <CheckCheck size={14} /> This conversation is closed
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  );
}