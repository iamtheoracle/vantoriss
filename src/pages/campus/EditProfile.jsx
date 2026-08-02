import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { UserCog, Camera, Plus, X, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LEVELS = ['100', '200', '300', '400', '500', 'Postgrad', 'PhD'];
const AVAILABILITY = ['available', 'busy', 'offline'];
const INTEREST_SUGGESTIONS = ['Technology', 'Business', 'Art', 'Sports', 'Music', 'Photography', 'Entrepreneurship', 'Volunteering', 'Gaming', 'Faith', 'Science', 'Research', 'Hackathons', 'Clubs', 'Languages'];
const SKILL_SUGGESTIONS = ['Python', 'JavaScript', 'React', 'Design', 'Public Speaking', 'Leadership', 'Research', 'Writing', 'Data Analysis', 'Marketing', 'UI/UX', 'Machine Learning'];
const LOOKING_FOR = ['Study Buddy', 'Project Collaboration', 'Research Partner', 'Language Exchange', 'Hackathon Team', 'Mentor', 'Mentee', 'Internship'];

function TagInput({ label, placeholder, values, onChange, suggestions = [] }) {
  const [input, setInput] = useState('');
  const [showSugg, setShowSugg] = useState(false);

  function addTag(tag) {
    const t = tag.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setInput('');
  }

  function removeTag(tag) { onChange(values.filter(v => v !== tag)); }

  const filteredSugg = suggestions.filter(s => !values.includes(s) && s.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.map((tag, i) => (
            <span key={i} className="campus-chip flex items-center gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-campus-accent"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSugg(true); }}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder}
          className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
        />
        {showSugg && filteredSugg.length > 0 && (
          <div className="absolute z-10 top-full mt-1 left-0 right-0 campus-glass p-2 max-h-32 overflow-y-auto">
            {filteredSugg.slice(0, 6).map(s => (
              <button
                key={s}
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-1"
              >
                <Plus size={12} className="text-campus-primary" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    photo_url: '', full_name: '', university: '', campus: '', faculty: '', department: '', level: '100',
    bio: '', availability: 'available', current_goals: '',
    interests: [], skills: [], courses: [], languages: [], looking_for: [],
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      setForm(f => ({ ...f, full_name: me.full_name || '' }));
      const existing = await base44.entities.StudentProfile.filter({ user_id: me.id });
      if (existing[0]) {
        const p = existing[0];
        setProfileId(p.id);
        setForm({
          photo_url: p.photo_url || '', full_name: p.full_name || me.full_name || '',
          university: p.university || '', campus: p.campus || '', faculty: p.faculty || '',
          department: p.department || '', level: p.level || '100', bio: p.bio || '',
          availability: p.availability || 'available', current_goals: p.current_goals || '',
          interests: p.interests || [], skills: p.skills || [], courses: p.courses || [],
          languages: p.languages || [], looking_for: p.looking_for || [],
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('photo_url', file_url);
      toast({ title: 'Photo uploaded' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.university.trim()) {
      toast({ title: 'Required fields', description: 'Name and university are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const data = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        photo_url: form.photo_url,
        university: form.university.trim(),
        campus: form.campus.trim(),
        faculty: form.faculty.trim(),
        department: form.department.trim(),
        level: form.level,
        bio: form.bio.trim(),
        availability: form.availability,
        current_goals: form.current_goals.trim(),
        interests: form.interests,
        skills: form.skills,
        courses: form.courses,
        languages: form.languages,
        looking_for: form.looking_for,
      };
      if (profileId) {
        await base44.entities.StudentProfile.update(profileId, data);
      } else {
        await base44.entities.StudentProfile.create(data);
      }
      toast({ title: 'Profile saved!', description: 'Your profile is now visible to other students.' });
      navigate('/');
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-campus-primary/20 border-t-campus-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl campus-gradient flex items-center justify-center">
          <UserCog size={18} style={{ color: '#FFFFFF' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{profileId ? 'Edit Profile' : 'Create Profile'}</h1>
          <p className="text-xs text-muted-foreground">Your campus identity</p>
        </div>
      </div>

      {/* Photo */}
      <div className="campus-glass p-5 mb-3 flex flex-col items-center">
        <div className="relative">
          {form.photo_url ? (
            <img src={form.photo_url} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white" style={{ color: '#FFFFFF' }}>
              {(form.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full campus-btn-primary flex items-center justify-center cursor-pointer shadow-md">
            {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={14} style={{ color: '#FFFFFF' }} />}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Tap to upload a photo</p>
      </div>

      {/* Basic Info */}
      <div className="campus-glass p-4 mb-3 space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
          <input
            value={form.full_name}
            onChange={e => update('full_name', e.target.value)}
            placeholder="Your full name"
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">University *</label>
          <input
            value={form.university}
            onChange={e => update('university', e.target.value)}
            placeholder="e.g. University of Lagos"
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Faculty</label>
            <input
              value={form.faculty}
              onChange={e => update('faculty', e.target.value)}
              placeholder="e.g. Science"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Department</label>
            <input
              value={form.department}
              onChange={e => update('department', e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Level</label>
            <select
              value={form.level}
              onChange={e => update('level', e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-campus-primary focus:outline-none"
            >
              {LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Availability</label>
            <select
              value={form.availability}
              onChange={e => update('availability', e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-campus-primary focus:outline-none capitalize"
            >
              {AVAILABILITY.map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Campus (optional)</label>
          <input
            value={form.campus}
            onChange={e => update('campus', e.target.value)}
            placeholder="e.g. Main Campus"
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none"
          />
        </div>
      </div>

      {/* About */}
      <div className="campus-glass p-4 mb-3 space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => update('bio', e.target.value)}
            placeholder="Tell other students about yourself..."
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Current Goals</label>
          <textarea
            value={form.current_goals}
            onChange={e => update('current_goals', e.target.value)}
            placeholder="What are you working toward this semester?"
            rows={2}
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Skills & Interests */}
      <div className="campus-glass p-4 mb-3 space-y-4">
        <TagInput
          label="Interests"
          placeholder="Type and press Enter..."
          values={form.interests}
          onChange={v => update('interests', v)}
          suggestions={INTEREST_SUGGESTIONS}
        />
        <TagInput
          label="Skills"
          placeholder="Type and press Enter..."
          values={form.skills}
          onChange={v => update('skills', v)}
          suggestions={SKILL_SUGGESTIONS}
        />
        <TagInput
          label="Courses"
          placeholder="Add a course..."
          values={form.courses}
          onChange={v => update('courses', v)}
        />
        <TagInput
          label="Languages"
          placeholder="Add a language..."
          values={form.languages}
          onChange={v => update('languages', v)}
          suggestions={['English', 'French', 'Spanish', 'Arabic', 'Yoruba', 'Igbo', 'Hausa', 'Chinese', 'German']}
        />
      </div>

      {/* Looking For */}
      <div className="campus-glass p-4 mb-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Looking For</label>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR.map(item => {
            const selected = form.looking_for.includes(item);
            return (
              <button
                key={item}
                onClick={() => {
                  update('looking_for', selected
                    ? form.looking_for.filter(f => f !== item)
                    : [...form.looking_for, item]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selected ? 'campus-btn-primary' : 'bg-card border border-border text-muted-foreground hover:border-campus-primary/30'
                }`}
              >
                {selected && <Check size={11} className="inline mr-1" />}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 campus-btn-primary disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
      >
        {saving ? 'Saving...' : profileId ? 'Save Changes' : 'Create Profile'}
      </button>
    </div>
  );
}