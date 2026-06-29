import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, Shield, ArrowDownLeft, ArrowUpRight, Info, Send } from 'lucide-react';

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

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const me = await base44.auth.me();
    setUser(me);
    const notifs = await base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 50);
    setNotifications(notifs);
    setLoading(false);
    // Mark all as read
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      base44.entities.Notification.update(n.id, { read: true });
    }
  }

  async function sendReply(notif) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'support@vantoris.com',
        subject: `Member Reply: ${notif.title}`,
        body: `Member: ${user?.full_name || 'Unknown'} (${user?.email || 'No email'})\n\nOriginal Notification: ${notif.title}\n${notif.message}\n\nMember Reply:\n${replyText}`,
      });
      setRepliedIds(prev => [...prev, notif.id]);
      setReplyingTo(null);
      setReplyText('');
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">{notifications.length} notifications</p>

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
                      <CheckCheck size={12} /> Reply sent
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
    </div>
  );
}