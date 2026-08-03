import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Heart, Mail, Clock, LayoutGrid, Users, ChevronRight, Check, TrendingUp, Wifi, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/formatCurrency';
import ImpactDashboard from '@/components/vantoris/herobox/ImpactDashboard';
import RequestCard from '@/components/vantoris/herobox/RequestCard';
import SponsorFlow from '@/components/vantoris/herobox/SponsorFlow';
import CommunityFeed from '@/components/vantoris/herobox/CommunityFeed';
import HeroBoxDiscover from '@/components/vantoris/herobox/HeroBoxDiscover';
import OrbitSearch from '@/components/vantoris/herobox/OrbitSearch';

const ACTIVITY_META = {
  sponsored: { icon: Heart, color: 'text-brass', bg: 'bg-brass/12', label: 'Sponsored' },
  request_approved: { icon: Check, color: 'text-mint', bg: 'bg-mint/12', label: 'Approved' },
  package_delivered: { icon: Package, color: 'text-mint', bg: 'bg-mint/12', label: 'Delivered' },
  letter_received: { icon: Mail, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Letter' },
  impact_report: { icon: TrendingUp, color: 'text-navy', bg: 'bg-navy/8', label: 'Impact' },
  volunteer_hours: { icon: Clock, color: 'text-gray', bg: 'bg-slate-100', label: 'Volunteer' },
  internet_sponsored: { icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Internet' },
  community_update: { icon: Users, color: 'text-navy', bg: 'bg-navy/8', label: 'Community' },
  mission_milestone: { icon: Award, color: 'text-brass', bg: 'bg-brass/12', label: 'Milestone' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'requests', label: 'Requests', icon: Package },
  { id: 'community', label: 'Community', icon: Users },
];

const REQUEST_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

export default function HeroBox() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [requestFilter, setRequestFilter] = useState('all');
  const [showSponsor, setShowSponsor] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const [profiles, accts] = await Promise.all([
      base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []),
      base44.entities.Account.filter({ user_id: me.id, status: 'active' }).catch(() => []),
    ]);
    const prof = profiles[0] || null;
    setProfile(prof);
    setAccounts(accts);
    if (prof) {
      const [reqs, acts] = await Promise.all([
        base44.entities.HeroBoxRequest.filter({ user_id: me.id }, '-created_date', 20).catch(() => []),
        base44.entities.HeroBoxActivity.filter({ user_id: me.id }, '-created_date', 20).catch(() => []),
      ]);
      setRequests(reqs);
      setActivities(acts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, [loadData]);

  async function handleActivate() {
    const me = await base44.auth.me();
    await base44.entities.HeroBoxProfile.create({
      user_id: me.id,
      role: 'sponsor',
      status: 'active',
    });
    setLoading(true);
    loadData();
  }

  async function handleSendLetter() {
    try {
      const me = await base44.auth.me();
      await base44.entities.HeroBoxActivity.create({
        user_id: me.id,
        activity_type: 'letter_received',
        title: 'Thank You Letter Sent',
        description: 'A letter of appreciation has been sent to a deployed hero.',
        status: 'completed',
      });
      await base44.entities.HeroBoxProfile.update(profile.id, {
        letters_sent: (profile.letters_sent || 0) + 1,
      });
      toast({ title: 'Letter Sent', description: 'Your message of appreciation has been sent.' });
      loadData();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }

  async function handleVolunteer() {
    try {
      const me = await base44.auth.me();
      await base44.entities.HeroBoxActivity.create({
        user_id: me.id,
        activity_type: 'volunteer_hours',
        title: 'Volunteer Hours Logged',
        description: '2 hours of community service contributed.',
        status: 'completed',
      });
      await base44.entities.HeroBoxProfile.update(profile.id, {
        volunteer_hours: (profile.volunteer_hours || 0) + 2,
      });
      toast({ title: 'Hours Logged', description: 'Thank you for your service to the community.' });
      loadData();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <HeroBoxDiscover onActivate={handleActivate} />;
  }

  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'all') return true;
    if (requestFilter === 'pending') return ['pending', 'under_review'].includes(r.status);
    if (requestFilter === 'active') return ['approved', 'in_progress'].includes(r.status);
    if (requestFilter === 'completed') return ['delivered', 'completed'].includes(r.status);
    return true;
  });

  return (
    <div className="px-5 pt-6 pb-8 vantoris-scroll">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="vantoris-balance-hero rounded-3xl p-5 mb-4 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 border border-white/8 flex items-center justify-center transition-all">
              <ArrowLeft size={18} className="text-white/70" />
            </button>
            <div className="flex items-center gap-2">
              <Package size={18} className="text-brass" />
              <span className="text-white font-semibold text-sm">HeroBox</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${profile.status === 'active' ? 'bg-mint/20 text-mint' : 'bg-brass/20 text-brass'}`}>
              {profile.status === 'active' ? 'Active' : profile.status}
            </span>
          </div>
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1">Total Contribution</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(profile.total_contribution || 0)}</p>
            <p className="text-white/50 text-[11px] mt-0.5 capitalize">{profile.role} · Mission Support</p>
          </div>
        </div>
      </motion.div>

      {/* Orbit Intelligent Discovery */}
      <OrbitSearch />

      {/* Impact Dashboard */}
      <ImpactDashboard profile={profile} activities={activities} />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <button onClick={() => setShowSponsor(true)} className="vantoris-glass p-3 flex flex-col items-center gap-2 hover:shadow-float transition-all">
          <div className="w-10 h-10 rounded-xl bg-brass/12 flex items-center justify-center">
            <Package size={18} className="text-brass" />
          </div>
          <span className="text-foreground text-[11px] font-medium">Sponsor</span>
        </button>
        <button onClick={handleSendLetter} className="vantoris-glass p-3 flex flex-col items-center gap-2 hover:shadow-float transition-all">
          <div className="w-10 h-10 rounded-xl bg-champagne/12 flex items-center justify-center">
            <Mail size={18} className="text-champagne" />
          </div>
          <span className="text-foreground text-[11px] font-medium">Send Letter</span>
        </button>
        <button onClick={handleVolunteer} className="vantoris-glass p-3 flex flex-col items-center gap-2 hover:shadow-float transition-all">
          <div className="w-10 h-10 rounded-xl bg-mint/12 flex items-center justify-center">
            <Clock size={18} className="text-mint" />
          </div>
          <span className="text-foreground text-[11px] font-medium">Volunteer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 px-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                active ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-foreground font-semibold text-sm">Recent Activity</h3>
            <span className="text-gray text-[11px]">{activities.length} total</span>
          </div>
          <div className="vantoris-glass-flat p-2">
            {activities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray text-sm">No activity yet</p>
                <p className="text-gray/50 text-[11px] mt-1">Your mission activity will appear here</p>
              </div>
            ) : (
              activities.slice(0, 8).map((activity, idx) => {
                const meta = ACTIVITY_META[activity.activity_type] || ACTIVITY_META.sponsored;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-100/70 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray text-[11px]">{meta.label}</span>
                        <span className="text-gray/30 text-[10px]">·</span>
                        <span className="text-gray text-[11px]">
                          {new Date(activity.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {activity.amount > 0 && (
                      <p className="text-brass text-xs font-semibold flex-shrink-0">{formatCurrency(activity.amount)}</p>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto">
            {REQUEST_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setRequestFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  requestFilter === f.id ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filteredRequests.length === 0 ? (
            <div className="vantoris-glass-flat p-6 text-center">
              <p className="text-gray text-sm">No requests found</p>
              <button onClick={() => setShowSponsor(true)} className="mt-3 text-brass text-xs font-medium">
                Sponsor a package →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRequests.map((req, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <RequestCard request={req} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <CommunityFeed activities={activities} />
      )}

      {/* Sponsor Flow */}
      <SponsorFlow
        open={showSponsor}
        onClose={() => setShowSponsor(false)}
        accounts={accounts}
        profile={profile}
        onSuccess={() => loadData()}
      />
    </div>
  );
}