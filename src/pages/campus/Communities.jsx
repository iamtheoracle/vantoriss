import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Plus, X, Search } from 'lucide-react';
import CommunityCard from '@/components/campus/CommunityCard';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = ['All', 'department', 'courses', 'interests', 'career', 'sports', 'music', 'gaming', 'faith', 'technology', 'business', 'art'];

export default function Communities() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [comms, mems] = await Promise.all([
        base44.entities.Community.list('-created_date', 200),
        base44.entities.CommunityMembership.filter({ user_id: me.id }),
      ]);
      setCommunities(comms);
      setMemberships(mems);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const memberIds = new Set(memberships.map(m => m.community_id));

  const filtered = communities.filter(c => {
    if (category !== 'All' && c.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  async function handleJoin(community) {
    try {
      await base44.entities.CommunityMembership.create({
        community_id: community.id,
        user_id: user.id,
        user_name: user.full_name || user.email,
        role: 'member',
      });
      await base44.entities.Community.update(community.id, { member_count: (community.member_count || 0) + 1 });
      setMemberships([...memberships, { community_id: community.id }]);
      setCommunities(communities.map(c => c.id === community.id ? { ...c, member_count: (c.member_count || 0) + 1 } : c));
      toast({ title: 'Joined!', description: `You're now a member of ${community.name}.` });
    } catch (e) {
      toast({ title: 'Failed to join', description: e.message, variant: 'destructive' });
    }
  }

  async function handleLeave(community) {
    try {
      const mem = memberships.find(m => m.community_id === community.id);
      if (mem) await base44.entities.CommunityMembership.delete(mem.id);
      await base44.entities.Community.update(community.id, { member_count: Math.max((community.member_count || 0) - 1, 0) });
      setMemberships(memberships.filter(m => m.community_id !== community.id));
      setCommunities(communities.map(c => c.id === community.id ? { ...c, member_count: Math.max((c.member_count || 0) - 1, 0) } : c));
      toast({ title: 'Left community', description: `You left ${community.name}.` });
    } catch (e) {
      toast({ title: 'Failed to leave', description: e.message, variant: 'destructive' });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl campus-gradient flex items-center justify-center">
            <Users size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Communities</h1>
            <p className="text-xs text-muted-foreground">Find your people on campus</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-xl campus-btn-primary flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search communities..."
          className="w-full campus-glass rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-campus-primary/20"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize ${
              category === cat
                ? 'campus-btn-primary'
                : 'bg-card border border-border text-muted-foreground hover:border-campus-primary/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-campus-primary/20 border-t-campus-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="campus-glass p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold mb-1">No communities yet</p>
          <p className="text-muted-foreground text-sm mb-4">
            {communities.length === 0
              ? 'Create the first community for your campus.'
              : 'Try a different category or search.'}
          </p>
          {communities.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="campus-btn-primary px-4 py-2 text-sm">
              Create Community
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(community => (
            <CommunityCard
              key={community.id}
              community={community}
              isMember={memberIds.has(community.id)}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}

      {/* Create Community Dialog */}
      {showCreate && user && (
        <CreateCommunityDialog
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); }}
        />
      )}
    </div>
  );
}

function CreateCommunityDialog({ user, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('interests');
  const [university, setUniversity] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const comm = await base44.entities.Community.create({
        name: name.trim(),
        description: description.trim(),
        category,
        university: university.trim(),
        member_count: 1,
        created_by_id: user.id,
        created_by_name: user.full_name || user.email,
      });
      await base44.entities.CommunityMembership.create({
        community_id: comm.id,
        user_id: user.id,
        user_name: user.full_name || user.email,
        role: 'admin',
      });
      toast({ title: 'Community created!', description: `${name} is now live.` });
      onCreated();
    } catch (e) {
      toast({ title: 'Failed to create', description: e.message, variant: 'destructive' });
    }
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md campus-glass rounded-t-3xl p-6 campus-bottom-sheet"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Create Community</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Computer Science Society"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this community about?"
              rows={2}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-campus-primary focus:outline-none capitalize"
            >
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat} className="capitalize">{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">University (optional)</label>
            <input
              value={university}
              onChange={e => setUniversity(e.target.value)}
              placeholder="e.g. University of Lagos"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="w-full py-3 campus-btn-primary disabled:opacity-40 text-sm"
        >
          {creating ? 'Creating...' : 'Create Community'}
        </button>
      </div>
    </div>
  );
}