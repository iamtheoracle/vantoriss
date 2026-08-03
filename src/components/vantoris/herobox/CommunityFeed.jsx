import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { TrendingUp, Users, Award, Heart, Package, Mail, Clock, Wifi, Check } from 'lucide-react';

const COMMUNITY_TYPES = ['impact_report', 'community_update', 'mission_milestone'];

const ACTIVITY_META = {
  impact_report: { icon: TrendingUp, color: 'text-navy', bg: 'bg-navy/8', label: 'Impact Report' },
  community_update: { icon: Users, color: 'text-navy', bg: 'bg-navy/8', label: 'Community Update' },
  mission_milestone: { icon: Award, color: 'text-brass', bg: 'bg-brass/12', label: 'Milestone' },
};

export default function CommunityFeed({ activities }) {
  const communityActivities = activities.filter(a => COMMUNITY_TYPES.includes(a.activity_type));

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-foreground font-semibold text-sm">Community</h3>
        <span className="text-gray text-[11px]">Updates & Impact</span>
      </div>

      {communityActivities.length === 0 ? (
        <div className="vantoris-glass-flat p-6 text-center">
          <p className="text-gray text-sm">No community updates yet</p>
          <p className="text-gray/50 text-[11px] mt-1">Impact reports and milestones will appear here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {communityActivities.map((activity, idx) => {
            const meta = ACTIVITY_META[activity.activity_type] || ACTIVITY_META.community_update;
            const Icon = meta.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="vantoris-glass p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm">{activity.title}</p>
                    {activity.description && (
                      <p className="text-gray text-xs mt-0.5 leading-relaxed">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray text-[10px]">{meta.label}</span>
                      <span className="text-gray/30 text-[10px]">·</span>
                      <span className="text-gray text-[10px]">
                        {new Date(activity.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {activity.amount > 0 && (
                    <p className="text-brass text-sm font-semibold flex-shrink-0">{formatCurrency(activity.amount)}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}