import React, { useState } from 'react';
import { X, UserPlus, BookOpen, FolderGit2, Users, Heart, Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const CONNECTION_TYPES = [
  { type: 'connect', label: 'Connect', icon: UserPlus, desc: 'Send a connection request' },
  { type: 'study_together', label: 'Study Together', icon: BookOpen, desc: 'Propose a study session' },
  { type: 'join_project', label: 'Join Project', icon: FolderGit2, desc: 'Invite to collaborate on a project' },
  { type: 'become_buddies', label: 'Become Buddies', icon: Users, desc: 'Become study buddies' },
  { type: 'follow', label: 'Follow', icon: Heart, desc: 'Follow their updates' },
  { type: 'save_profile', label: 'Save Profile', icon: Bookmark, desc: 'Save for later' },
];

export default function ConnectionModal({ student, currentUser, onClose, onSent }) {
  const [selectedType, setSelectedType] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  async function handleSend() {
    if (!selectedType) return;
    setSending(true);
    try {
      const isInstant = selectedType === 'follow' || selectedType === 'save_profile';
      await base44.entities.Connection.create({
        from_user_id: currentUser.id,
        to_user_id: student.user_id,
        from_name: currentUser.full_name || currentUser.email,
        to_name: student.full_name,
        from_photo: '',
        to_photo: student.photo_url || '',
        type: selectedType,
        status: isInstant ? 'accepted' : 'pending',
        message: message || '',
      });
      const label = CONNECTION_TYPES.find(c => c.type === selectedType)?.label;
      toast({
        title: isInstant ? `${label}!` : 'Request sent!',
        description: isInstant
          ? `${label === 'Follow' ? 'Now following' : 'Profile saved'} — ${student.full_name}`
          : `${label} request sent to ${student.full_name}`,
      });
      onSent?.();
      onClose();
    } catch (e) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md campus-glass rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto campus-bottom-sheet"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Connect with {student.full_name?.split(' ')[0]}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {CONNECTION_TYPES.map(({ type, label, icon: Icon, desc }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                selectedType === type
                  ? 'border-campus-primary bg-campus-primary/5'
                  : 'border-border bg-card hover:border-campus-primary/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedType === type ? 'campus-btn-primary' : 'bg-muted text-campus-primary'
              }`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {selectedType && selectedType !== 'follow' && selectedType !== 'save_profile' && (
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a personal note (optional)..."
            rows={2}
            className="w-full bg-card border border-border rounded-2xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-campus-primary focus:outline-none resize-none mb-4"
          />
        )}

        <button
          onClick={handleSend}
          disabled={!selectedType || sending}
          className="w-full py-3 campus-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {sending ? 'Sending...' : selectedType ? `Send ${CONNECTION_TYPES.find(c => c.type === selectedType)?.label}` : 'Select an option'}
        </button>
      </div>
    </div>
  );
}