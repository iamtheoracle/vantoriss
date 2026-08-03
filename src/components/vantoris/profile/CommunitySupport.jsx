import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ChevronRight, Users, Package, Gift, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import SectionTitle from './SectionTitle';

export default function CommunitySupport({ heroProfile, heroRequests }) {
  if (!heroProfile) return null;

  const pendingRequests = heroRequests.filter(r => r.status === 'pending' || r.status === 'under_review').length;
  const metrics = [
    { icon: Users, label: 'Heroes Supported', value: heroProfile.heroes_supported || 0 },
    { icon: Package, label: 'Packages Delivered', value: heroProfile.packages_delivered || 0 },
    { icon: Gift, label: 'Total Contribution', value: formatCurrency(heroProfile.total_contribution || 0) },
    { icon: Clock, label: 'Volunteer Hours', value: heroProfile.volunteer_hours || 0 },
  ].filter(m => m.value > 0 || m.label === 'Total Contribution');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <SectionTitle
        icon={Heart}
        title="Community Support"
        right={pendingRequests > 0 ? (
          <span className="px-1.5 py-0.5 bg-brass/15 text-brass rounded text-[9px] font-bold">{pendingRequests} pending</span>
        ) : null}
      />

      <Link to="/herobox" className="block vantoris-glass-premium p-4 hover:shadow-float transition-all group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brass/15 to-brass/5 flex items-center justify-center">
            <Heart size={18} className="text-brass" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm capitalize">{heroProfile.role}</p>
            <p className="text-gray text-xs">Status: <span className="capitalize">{heroProfile.status}</span></p>
          </div>
          <ChevronRight size={16} className="text-gray/40 group-hover:text-navy transition-colors" />
        </div>

        {heroProfile.mission_statement && (
          <p className="text-gray text-xs italic mb-3 line-clamp-2">"{heroProfile.mission_statement}"</p>
        )}

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {metrics.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="vantoris-glass-flat p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={11} className="text-navy/60" />
                    <span className="text-gray text-[9px] uppercase tracking-wider font-medium">{m.label}</span>
                  </div>
                  <p className="text-foreground font-bold text-sm">{m.value}</p>
                </div>
              );
            })}
          </div>
        )}
      </Link>
    </motion.div>
  );
}