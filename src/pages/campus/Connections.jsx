import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Link2, Inbox, Send, Check, Clock, CheckCheck, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TYPE_LABELS = {
  connect: 'Connection',
  study_together: 'Study Together',
  join_project: 'Project Invite',
  collaborate: 'Collaboration',
  become_buddies: 'Study Buddy',
  follow: 'Following',
  save_profile: 'Saved',
};

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
];

export default function Connections() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const all = await base44.entities.Connection.list('-created_date', 200);
      setConnections(all.filter(c => c.from_user_id === me.id || c.to_user_id === me.id));
      const allProfiles = await base44.entities.StudentProfile.list('-created_date', 200);
      setProfiles(allProfiles);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getProfile(userId) {
    return profiles.find(p => p.user_id === userId);
  }

  async function handleAccept(conn) {
    try {
      await base44.entities.Connection.update(conn.id, { status: 'accepted' });
      setConnections(connections.map(c => c.id === conn.id ? { ...c, status: 'accepted' } : c));
      toast({ title: 'Connected!', description: `You're now connected with ${conn.from_name}.` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  }

  async function handleDecline(conn) {
    try {
      await base44.entities.Connection.update(conn.id, { status: 'declined' });
      setConnections(connections.map(c => c.id === conn.id ? { ...c, status: 'declined' } : c));
      toast({ title: 'Declined', description: `Request from ${conn.from_name} declined.` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  }

  const requests = connections.filter(c => c.to_user_id === user?.id && c.status === 'pending');
  const sent = connections.filter(c => c.from_user_id === user?.id);
  const connected = connections.filter(c =>
    (c.from_user_id === user?.id || c.to_user_id === user?.id) && c.status === 'accepted'
  );

  const tabs = [
    { key: 'requests', label: 'Requests', icon: Inbox, count: requests.length },
    { key: 'sent', label: 'Sent', icon: Send, count: sent.length },
    { key: 'connected', label: 'Connected', icon: CheckCheck, count: connected.length },
  ];

  const activeList = tab === 'requests' ? requests : tab === 'sent' ? sent : connected;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl campus-gradient flex items-center justify-center">
          <Link2 size={18} style={{ color: '#FFFFFF' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Connections</h1>
          <p className="text-xs text-muted-foreground">Manage your network</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 campus-glass p-1 rounded-2xl mb-4">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key ? 'campus-btn-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} /> {t.label}
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${tab === t.key ? 'bg-white/20' : 'bg-muted text-muted-foreground'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-campus-primary/20 border-t-campus-primary rounded-full animate-spin" />
        </div>
      ) : activeList.length === 0 ? (
        <div className="campus-glass p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            {tab === 'requests' ? <Inbox size={24} className="text-muted-foreground" /> :
             tab === 'sent' ? <Send size={24} className="text-muted-foreground" /> :
             <CheckCheck size={24} className="text-muted-foreground" />}
          </div>
          <p className="text-foreground font-semibold mb-1">
            {tab === 'requests' ? 'No pending requests' :
             tab === 'sent' ? 'No requests sent' : 'No connections yet'}
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            {tab === 'requests' ? 'Connection requests will appear here.' :
             tab === 'sent' ? 'Start connecting with students from Discover.' :
             'Accept requests to build your network.'}
          </p>
          {tab !== 'requests' && (
            <button onClick={() => navigate('/')} className="campus-btn-ghost px-4 py-2 text-sm">
              Discover Students
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {activeList.map(conn => {
            const isIncoming = conn.to_user_id === user?.id;
            const otherName = isIncoming ? conn.from_name : conn.to_name;
            const otherPhoto = isIncoming ? conn.from_photo : conn.to_photo;
            const otherUserId = isIncoming ? conn.from_user_id : conn.to_user_id;
            const profile = getProfile(otherUserId);
            const colorIdx = (otherName || '?').charCodeAt(0) % AVATAR_GRADIENTS.length;

            return (
              <div key={conn.id} className="campus-glass p-3 flex items-center gap-3">
                <div className="relative flex-shrink-0 cursor-pointer" onClick={() => profile && navigate(`/students/${profile.id}`)}>
                  {otherPhoto ? (
                    <img src={otherPhoto} alt={otherName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[colorIdx]} flex items-center justify-center font-bold text-lg`} style={{ color: '#FFFFFF' }}>
                      {(otherName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{otherName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="campus-chip text-[10px]">{TYPE_LABELS[conn.type] || conn.type}</span>
                    {conn.status === 'pending' && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                    {conn.status === 'accepted' && (
                      <span className="flex items-center gap-1 text-[10px] text-campus-success">
                        <Check size={10} /> Connected
                      </span>
                    )}
                  </div>
                  {conn.message && <p className="text-xs text-muted-foreground truncate mt-0.5">"{conn.message}"</p>}
                </div>

                {/* Actions */}
                {tab === 'requests' && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(conn)}
                      className="w-9 h-9 rounded-xl campus-btn-primary flex items-center justify-center"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleDecline(conn)}
                      className="w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}