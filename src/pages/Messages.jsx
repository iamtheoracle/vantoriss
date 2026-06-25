import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, Shield, ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';

const typeIcons = {
  success: { icon: CheckCheck, bg: 'bg-olive/20', color: 'text-emerald-400' },
  warning: { icon: Shield, bg: 'bg-brass/15', color: 'text-brass' },
  action: { icon: ArrowUpRight, bg: 'bg-crimson/15', color: 'text-red-400' },
  info: { icon: Info, bg: 'bg-blue-500/15', color: 'text-blue-400' },
};

export default function Messages() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const me = await base44.auth.me();
    const notifs = await base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 50);
    setNotifications(notifs);
    setLoading(false);
    // Mark all as read
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      base44.entities.Notification.update(n.id, { read: true });
    }
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}