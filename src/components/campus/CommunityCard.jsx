import React from 'react';
import { Users } from 'lucide-react';

const CATEGORY_STYLES = {
  department: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  courses: { bg: 'bg-blue-50', text: 'text-blue-600' },
  interests: { bg: 'bg-violet-50', text: 'text-violet-600' },
  career: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  sports: { bg: 'bg-orange-50', text: 'text-orange-600' },
  music: { bg: 'bg-pink-50', text: 'text-pink-600' },
  gaming: { bg: 'bg-purple-50', text: 'text-purple-600' },
  faith: { bg: 'bg-amber-50', text: 'text-amber-600' },
  technology: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  business: { bg: 'bg-teal-50', text: 'text-teal-600' },
  art: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

const COMMUNITY_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
];

export default function CommunityCard({ community, isMember, onJoin, onLeave }) {
  const cat = CATEGORY_STYLES[community.category] || CATEGORY_STYLES.interests;
  const colorIdx = (community.name || '?').charCodeAt(0) % COMMUNITY_GRADIENTS.length;

  return (
    <div className="campus-glass p-4">
      <div className="flex items-start gap-3 mb-3">
        {community.icon_url ? (
          <img src={community.icon_url} alt={community.name} className="w-12 h-12 rounded-2xl object-cover" />
        ) : (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${COMMUNITY_GRADIENTS[colorIdx]} flex items-center justify-center`} style={{ color: '#FFFFFF' }}>
            <span className="text-lg font-bold">{(community.name || '?').charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{community.name}</h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.bg} ${cat.text} capitalize`}>
            {community.category}
          </span>
        </div>
      </div>
      {community.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{community.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Users size={12} /> {community.member_count || 0} members
        </span>
        {isMember ? (
          <button
            onClick={() => onLeave(community)}
            className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
          >
            Joined
          </button>
        ) : (
          <button
            onClick={() => onJoin(community)}
            className="px-4 py-1.5 campus-btn-primary text-xs"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}