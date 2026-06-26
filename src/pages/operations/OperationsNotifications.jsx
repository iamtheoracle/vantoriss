import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Bell, Search } from 'lucide-react';

export default function OperationsNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const notifs = await base44.entities.Notification.list('-created_date', 100);
        setNotifications(notifs);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const filtered = notifications.filter(n =>
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.message || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OperationsPageLayout title="Notifications" description="All notifications sent across the platform" icon={Bell}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
            />
          </div>
          <div className="vantoris-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#242D38] bg-[#1a2535]">
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Title</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Message</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                    <td className="px-5 py-4 text-white font-medium text-xs">{n.title}</td>
                    <td className="px-5 py-4 text-[#AAB4C3] text-xs max-w-xs truncate">{n.message}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        n.type === 'warning' ? 'bg-brass/10 text-brass' :
                        n.type === 'action' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-[#242D38] text-[#AAB4C3]'
                      }`}>{n.type}</span>
                    </td>
                    <td className="px-5 py-4 text-[#AAB4C3] text-xs">{n.created_date.split('T')[0]}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-[#AAB4C3]">No notifications found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OperationsPageLayout>
  );
}