import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, UserPlus } from 'lucide-react';
import StudentCard from '@/components/campus/StudentCard';
import ConnectionModal from '@/components/campus/ConnectionModal';

const LEVEL_FILTERS = ['All', '100', '200', '300', '400', '500', 'Postgrad'];
const INTEREST_FILTERS = ['All', 'Technology', 'Business', 'Art', 'Sports', 'Music', 'Gaming', 'Faith', 'Science'];

export default function Discover() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [interestFilter, setInterestFilter] = useState('All');
  const [connectTarget, setConnectTarget] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const myProfiles = await base44.entities.StudentProfile.filter({ user_id: me.id });
      setMyProfile(myProfiles[0] || null);
      const allStudents = await base44.entities.StudentProfile.list('-created_date', 100);
      setStudents(allStudents.filter(s => s.user_id !== me.id));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = students.filter(s => {
    if (levelFilter !== 'All' && s.level !== levelFilter) return false;
    if (interestFilter !== 'All' && !(s.interests || []).includes(interestFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.full_name || '').toLowerCase().includes(q) ||
             (s.university || '').toLowerCase().includes(q) ||
             (s.faculty || '').toLowerCase().includes(q) ||
             (s.department || '').toLowerCase().includes(q) ||
             (s.interests || []).some(i => i.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="campus-gradient-soft rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl campus-gradient flex items-center justify-center">
            <Sparkles size={16} style={{ color: '#FFFFFF' }} />
          </div>
          <h1 className="text-xl font-bold campus-gradient-text">Campus Connect</h1>
        </div>
        <p className="text-sm text-muted-foreground">Discover students, build your network, find your community.</p>
      </div>

      {/* No profile banner */}
      {user && !myProfile && !loading && (
        <button
          onClick={() => navigate('/profile/edit')}
          className="w-full campus-glass p-4 mb-4 flex items-center gap-3 text-left hover:shadow-lg transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-campus-primary/10 flex items-center justify-center flex-shrink-0">
            <UserPlus size={18} className="text-campus-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Create your profile</p>
            <p className="text-xs text-muted-foreground">Set up your profile to start connecting with students.</p>
          </div>
        </button>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students, universities, interests..."
          className="w-full campus-glass rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-campus-primary/20"
        />
      </div>

      {/* Level filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-1" style={{ scrollbarWidth: 'none' }}>
        {LEVEL_FILTERS.map(chip => (
          <button
            key={chip}
            onClick={() => setLevelFilter(chip)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              levelFilter === chip
                ? 'campus-btn-primary'
                : 'bg-card border border-border text-muted-foreground hover:border-campus-primary/30'
            }`}
          >
            {chip === 'All' ? 'All Levels' : `Level ${chip}`}
          </button>
        ))}
      </div>

      {/* Interest filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2" style={{ scrollbarWidth: 'none' }}>
        {INTEREST_FILTERS.map(chip => (
          <button
            key={chip}
            onClick={() => setInterestFilter(chip)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              interestFilter === chip
                ? 'bg-campus-accent'
                : 'bg-card border border-border text-muted-foreground hover:border-campus-accent/30'
            }`}
            style={interestFilter === chip ? { color: '#FFFFFF' } : {}}
          >
            {chip}
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
            <Search size={24} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold mb-1">
            {students.length === 0 ? 'No students yet' : 'No matches found'}
          </p>
          <p className="text-muted-foreground text-sm">
            {students.length === 0
              ? 'Be the first to create your profile and start building the campus network.'
              : 'Try adjusting your filters to find more students.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onConnect={() => setConnectTarget(student)}
            />
          ))}
        </div>
      )}

      {connectTarget && user && (
        <ConnectionModal
          student={connectTarget}
          currentUser={user}
          onClose={() => setConnectTarget(null)}
        />
      )}
    </div>
  );
}