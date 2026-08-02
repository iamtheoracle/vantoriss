import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, BadgeCheck, MapPin, Target, Globe, BookOpen,
  Award, FolderGit2, Edit3, UserPlus, Clock, Sparkles,
} from 'lucide-react';
import ConnectionModal from '@/components/campus/ConnectionModal';

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-fuchsia-500 to-purple-500',
];

function Chip({ children }) {
  return <span className="campus-chip">{children}</span>;
}

function Section({ icon: Icon, title, children }) {
  if (!children) return null;
  return (
    <div className="campus-glass p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-campus-primary/10 flex items-center justify-center">
          <Icon size={14} className="text-campus-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function StudentProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setCurrentUser(me);
      const p = await base44.entities.StudentProfile.get(id);
      setProfile(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const isMe = currentUser && profile && currentUser.id === profile.user_id;
  const colorIdx = profile ? (profile.full_name || '?').charCodeAt(0) % AVATAR_GRADIENTS.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-campus-primary/20 border-t-campus-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="campus-glass p-8 text-center mt-8">
        <p className="text-foreground font-semibold mb-1">Profile not found</p>
        <p className="text-muted-foreground text-sm mb-4">This student profile may have been removed.</p>
        <button onClick={() => navigate('/')} className="campus-btn-primary px-4 py-2 text-sm">Back to Discover</button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="campus-gradient rounded-3xl p-6 mb-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-3">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20 shadow-xl" />
            ) : (
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[colorIdx]} flex items-center justify-center text-4xl font-bold ring-4 ring-white/20 shadow-xl`} style={{ color: '#FFFFFF' }}>
                {(profile.full_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h1 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{profile.full_name}</h1>
            {profile.verified && <BadgeCheck size={18} style={{ color: '#FFFFFF' }} />}
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {[profile.faculty, profile.department].filter(Boolean).join(' · ') || '—'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {[profile.university, profile.campus].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {profile.level && <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>Level {profile.level}</span>}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>
              <span className={`w-1.5 h-1.5 rounded-full ${profile.availability === 'available' ? 'bg-campus-success' : profile.availability === 'busy' ? 'bg-campus-warning' : 'bg-campus-muted'}`} />
              {profile.availability || 'available'}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="campus-glass p-4 mb-3">
          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Current Goals */}
      {profile.current_goals && (
        <Section icon={Target} title="Current Goals">
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.current_goals}</p>
        </Section>
      )}

      {/* Looking For */}
      {profile.looking_for?.length > 0 && (
        <Section icon={UserPlus} title="Looking For">
          <div className="flex flex-wrap gap-1.5">
            {profile.looking_for.map((item, i) => <Chip key={i}>{item}</Chip>)}
          </div>
        </Section>
      )}

      {/* Interests */}
      {profile.interests?.length > 0 && (
        <Section icon={Sparkles} title="Interests">
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((item, i) => <Chip key={i}>{item}</Chip>)}
          </div>
        </Section>
      )}

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <Section icon={Award} title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((item, i) => <Chip key={i}>{item}</Chip>)}
          </div>
        </Section>
      )}

      {/* Courses */}
      {profile.courses?.length > 0 && (
        <Section icon={BookOpen} title="Courses">
          <ul className="space-y-1">
            {profile.courses.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-campus-primary" /> {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Languages */}
      {profile.languages?.length > 0 && (
        <Section icon={Globe} title="Languages">
          <div className="flex flex-wrap gap-1.5">
            {profile.languages.map((item, i) => <Chip key={i}>{item}</Chip>)}
          </div>
        </Section>
      )}

      {/* Projects */}
      {profile.projects?.length > 0 && (
        <Section icon={FolderGit2} title="Projects">
          <ul className="space-y-1.5">
            {profile.projects.map((item, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <FolderGit2 size={14} className="text-campus-primary mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Achievements */}
      {profile.achievements?.length > 0 && (
        <Section icon={Award} title="Achievements">
          <ul className="space-y-1.5">
            {profile.achievements.map((item, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <Award size={14} className="text-campus-accent mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <Section icon={BadgeCheck} title="Badges">
          <div className="flex flex-wrap gap-1.5">
            {profile.badges.map((item, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-campus-secondary/10 text-campus-secondary text-xs font-semibold">{item}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Action button */}
      <div className="pt-2 pb-4">
        {isMe ? (
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-full py-3 campus-btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        ) : (
          <button
            onClick={() => setShowConnect(true)}
            className="w-full py-3 campus-btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus size={16} /> Connect with {profile.full_name?.split(' ')[0]}
          </button>
        )}
      </div>

      {showConnect && currentUser && (
        <ConnectionModal
          student={profile}
          currentUser={currentUser}
          onClose={() => setShowConnect(false)}
        />
      )}
    </div>
  );
}