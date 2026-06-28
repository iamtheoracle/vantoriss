import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import { hasOperationsAccess, getRoleLabel } from '@/lib/operationsAccess';
import { User, Mail, Shield, LogOut, FileText, Trash2 } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
    }
    load();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {/* Avatar & Name */}
      <div className="vantoris-card p-6 flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-brass/15 flex items-center justify-center">
          <span className="text-brass text-xl font-bold">
            {(user.full_name || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{user.full_name || 'Member'}</p>
          <p className="text-[#AAB4C3] text-sm">{user.email}</p>
          <p className="text-brass text-xs mt-0.5">{getRoleLabel(user.role)}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-2 mb-6">
        <div className="vantoris-card p-4 flex items-center gap-3">
          <User size={18} className="text-[#AAB4C3]" />
          <div className="flex-1">
            <p className="text-[#AAB4C3] text-xs">Full Name</p>
            <p className="text-white text-sm">{user.full_name || '—'}</p>
          </div>
        </div>
        <div className="vantoris-card p-4 flex items-center gap-3">
          <Mail size={18} className="text-[#AAB4C3]" />
          <div className="flex-1">
            <p className="text-[#AAB4C3] text-xs">Email</p>
            <p className="text-white text-sm">{user.email}</p>
          </div>
        </div>
        <div className="vantoris-card p-4 flex items-center gap-3">
          <Shield size={18} className="text-[#AAB4C3]" />
          <div className="flex-1">
            <p className="text-[#AAB4C3] text-xs">Account Role</p>
            <p className="text-white text-sm">{getRoleLabel(user.role)}</p>
          </div>
        </div>
      </div>

      {/* My Documents */}
      <button
        onClick={() => navigate('/documents')}
        className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
      >
        <FileText size={18} className="text-[#AAB4C3]" />
        <span className="text-white text-sm font-medium">My Documents</span>
      </button>

      {/* Operations Center access — discreet, role-gated */}
      {hasOperationsAccess(user.role) && (
        <button
          onClick={() => navigate('/operations')}
          className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-brass/30 transition-all mb-3"
        >
          <Shield size={18} className="text-brass" />
          <div className="text-left">
            <span className="text-white text-sm font-medium">Operations Center</span>
            <p className="text-[#AAB4C3] text-xs">Staff access</p>
          </div>
        </button>
      )}

      {/* Logout */}
      <button
        onClick={() => base44.auth.logout('/')}
        className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-crimson/30 transition-all mb-2"
      >
        <LogOut size={18} className="text-red-400" />
        <span className="text-red-400 text-sm font-medium">Sign Out</span>
      </button>

      {/* Delete Account */}
      <button
        onClick={() => setShowDelete(true)}
        className="vantoris-card p-4 w-full flex items-center gap-3 hover:border-crimson/30 transition-all"
      >
        <Trash2 size={18} className="text-red-400/70" />
        <span className="text-red-400/70 text-sm font-medium">Delete Account</span>
      </button>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center">
        <ShieldLogo size={28} className="mb-2 opacity-40" />
        <p className="text-[#AAB4C3]/30 text-[10px] tracking-widest uppercase">Secure. Trusted. Tailored for you.</p>
      </div>
    </div>
  );
}