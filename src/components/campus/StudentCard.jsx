import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-fuchsia-500 to-purple-500',
];

export default function StudentCard({ student, onConnect }) {
  const navigate = useNavigate();
  const colorIdx = (student.full_name || '?').charCodeAt(0) % AVATAR_GRADIENTS.length;

  return (
    <div
      className="campus-glass p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/students/${student.id}`)}
    >
      <div className="relative mb-3">
        {student.photo_url ? (
          <img
            src={student.photo_url}
            alt={student.full_name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
          />
        ) : (
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[colorIdx]} flex items-center justify-center text-xl font-bold ring-2 ring-white shadow-md`} style={{ color: '#FFFFFF' }}>
            {(student.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {student.verified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-campus-primary border-2 border-white flex items-center justify-center">
            <BadgeCheck size={11} style={{ color: '#FFFFFF' }} />
          </div>
        )}
        <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
          student.availability === 'available' ? 'bg-campus-success' :
          student.availability === 'busy' ? 'bg-campus-warning' : 'bg-campus-muted'
        }`} />
      </div>
      <h3 className="font-semibold text-sm text-foreground truncate w-full">{student.full_name}</h3>
      <p className="text-xs text-muted-foreground truncate w-full">{student.faculty || student.department || '—'}</p>
      <p className="text-[10px] text-muted-foreground/70 truncate w-full mb-2">{student.university}</p>
      {student.interests?.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mb-3">
          {student.interests.slice(0, 2).map((interest, i) => (
            <span key={i} className="campus-chip">{interest}</span>
          ))}
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onConnect?.(student); }}
        className="w-full py-2 campus-btn-primary text-xs"
      >
        Connect
      </button>
    </div>
  );
}