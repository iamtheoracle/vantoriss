import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Heart, Users, Shield, BookOpen, Clock, Building2, Star, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';

const DISCOVER_CARDS = [
  { title: 'Learn the Mission', subtitle: 'Discover our purpose and values', icon: BookOpen },
  { title: 'Sponsor a Hero', subtitle: 'Provide direct support to service members', icon: Heart },
  { title: 'Support Military Families', subtitle: 'Help families thrive during deployments', icon: Users },
  { title: 'Explore Care Packages', subtitle: 'Meaningful support packages for heroes', icon: Package },
  { title: 'Volunteer Opportunities', subtitle: 'Give your time and skills', icon: Clock },
  { title: 'Organization Partnerships', subtitle: 'Collaborate with your organization', icon: Building2 },
  { title: 'Community Stories', subtitle: 'Read real impact stories', icon: Star },
  { title: 'Impact Reports', subtitle: 'See measurable results', icon: TrendingUp },
];

export default function HeroBoxDiscover({ onActivate }) {
  const [activating, setActivating] = useState(false);
  const navigate = useNavigate();

  async function handleActivate() {
    setActivating(true);
    try {
      await onActivate();
    } catch (e) {
      setActivating(false);
    }
  }

  return (
    <div className="px-5 pt-6 pb-8 vantoris-scroll">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="vantoris-balance-hero rounded-3xl p-8 mb-5 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-brass/[0.05] blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/12 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Package size={28} className="text-brass" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">HeroBox</h1>
          <p className="text-white/60 text-sm mb-1">Supporting Those Who Serve</p>
          <p className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto mb-6">
            A mission-driven support platform helping military members, veterans, and their families receive meaningful assistance through coordinated financial support, care packages, and community sponsorship.
          </p>
          <button
            onClick={handleActivate}
            disabled={activating}
            className="px-6 py-3 bg-brass hover:bg-brass/90 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {activating ? 'Activating...' : 'Become a Sponsor'}
          </button>
        </div>
      </motion.div>

      {/* Discover Cards */}
      <div className="mb-5">
        <h3 className="text-foreground font-semibold text-sm mb-3 px-1">Discover HeroBox</h3>
        <div className="grid grid-cols-2 gap-3">
          {DISCOVER_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="vantoris-glass p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-navy/8 border border-navy/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-navy" strokeWidth={2} />
                </div>
                <p className="text-foreground font-semibold text-sm">{card.title}</p>
                <p className="text-gray text-[11px] mt-0.5 leading-relaxed">{card.subtitle}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mission Principles */}
      <div className="vantoris-glass-premium p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-brass/12 flex items-center justify-center">
            <Shield size={16} className="text-brass" />
          </div>
          <h3 className="text-foreground font-semibold text-sm">Our Mission</h3>
        </div>
        <div className="space-y-2">
          {[
            'Support military members, veterans, and their families',
            'Deliver meaningful assistance with dignity and respect',
            'Coordinate financial support, care packages, and communication',
            'Measure impact through outcomes, not transactions',
            'Connect communities through service and honor',
          ].map((principle, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <ChevronRight size={14} className="text-brass/60 mt-0.5 flex-shrink-0" />
              <p className="text-gray text-xs leading-relaxed">{principle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleActivate}
        disabled={activating}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy/90 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
      >
        {activating ? 'Activating...' : 'Join the Mission'}
        {!activating && <ArrowRight size={16} />}
      </button>
    </div>
  );
}