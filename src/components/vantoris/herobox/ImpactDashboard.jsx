import React from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Mail, Heart, Wifi, Clock, Building2, Award } from 'lucide-react';

const METRICS = [
  { key: 'heroes_supported', label: 'Heroes Supported', icon: Users, color: 'text-brass', bg: 'bg-brass/12' },
  { key: 'packages_delivered', label: 'Packages Delivered', icon: Package, color: 'text-mint', bg: 'bg-mint/12' },
  { key: 'letters_sent', label: 'Letters Sent', icon: Mail, color: 'text-champagne', bg: 'bg-champagne/12' },
  { key: 'families_assisted', label: 'Families Assisted', icon: Heart, color: 'text-crimson', bg: 'bg-crimson/10' },
  { key: 'internet_sponsorships', label: 'Internet Sponsorships', icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/12' },
  { key: 'volunteer_hours', label: 'Volunteer Hours', icon: Clock, color: 'text-gray', bg: 'bg-slate-100' },
  { key: 'organizations_supported', label: 'Organizations', icon: Building2, color: 'text-navy', bg: 'bg-navy/8' },
  { key: 'mission_milestones', label: 'Milestones', icon: Award, color: 'text-brass', bg: 'bg-brass/12' },
];

export default function ImpactDashboard({ profile }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-foreground font-semibold text-sm">Your Impact</h3>
        <span className="text-gray text-[11px]">Mission Metrics</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="vantoris-glass p-3.5"
            >
              <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center mb-2`}>
                <Icon size={14} className={metric.color} />
              </div>
              <p className="text-foreground font-bold text-xl">{profile?.[metric.key] || 0}</p>
              <p className="text-gray text-[10px] uppercase tracking-wider font-medium">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}