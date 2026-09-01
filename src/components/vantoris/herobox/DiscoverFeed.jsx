import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { loadHeroBoxDiscoverContent, executeHeroBoxDiscovery } from '@/lib/heroboxDiscovery';
import { isOrgDonorVisible, isCaseDonorVisible } from '@/lib/discoveryPipeline';
import DiscoverCard from './DiscoverCard';
import DiscoverSection from './DiscoverSection';
import {
  Search, Sparkles, Heart, Stethoscope, Shield, Users, Utensils,
  AlertCircle, Package, Newspaper, Loader2, RefreshCw, Compass,
} from 'lucide-react';

// Category filter definitions
const CATEGORIES = [
  { id: 'all', label: 'Browse All', icon: Compass },
  { id: 'featured', label: 'Featured Needs', icon: Sparkles },
  { id: 'organizations', label: 'Organizations', icon: Heart },
  { id: 'medical', label: 'Medical Relief', icon: Stethoscope },
  { id: 'military', label: 'Military & Veterans', icon: Shield },
  { id: 'humanitarian', label: 'Humanitarian Relief', icon: Users },
  { id: 'children', label: 'Children & Families', icon: Users },
  { id: 'emergency', label: 'Emergency Support', icon: AlertCircle },
  { id: 'food', label: 'Food Assistance', icon: Utensils },
  { id: 'care', label: 'Care Package Opportunities', icon: Package },
  { id: 'news', label: 'Humanitarian News', icon: Newspaper },
];

const ORG_TYPE_MAP = {
  medical: ['medical_relief'],
  military: ['veteran_support', 'military_support', 'military_family_support', 'deployed_support'],
  humanitarian: ['humanitarian', 'ngo', 'charity', 'disaster_response', 'emergency_relief'],
  children: ['childrens_home', 'orphanage', 'shelter'],
  emergency: ['emergency_relief', 'disaster_response'],
  food: ['food_assistance'],
};

const CASE_CATEGORY_MAP = {
  medical: ['surgery_medical'],
  military: ['military_support'],
  humanitarian: ['financial_assistance', 'essential_supplies', 'shelter'],
  children: ['children_support'],
  emergency: ['emergency', 'disaster_relief'],
  food: ['food'],
  care: ['essential_supplies', 'communication', 'food'],
};

export default function DiscoverFeed({ onShop, onDonate }) {
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({ organizations: [], cases: [], news: [] });
  const [discoveryStatus, setDiscoveryStatus] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const content = await loadHeroBoxDiscoverContent();
      setData(content);
    } catch (e) {
      console.error('Discover load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleRefreshDiscovery() {
    setDiscovering(true);
    setDiscoveryStatus(null);
    try {
      const result = await executeHeroBoxDiscovery({ autoApproveHighConfidence: true });
      setDiscoveryStatus(result);
      await loadData();
    } catch (e) {
      setDiscoveryStatus({ errors: [e.message] });
    } finally {
      setDiscovering(false);
    }
  }

  // Filter items by category and search
  function filterByCategory(items, type) {
    if (activeCategory === 'all' || activeCategory === 'featured') return items;
    if (activeCategory === 'organizations' && type === 'org') return items;
    if (activeCategory === 'news' && type === 'news') return items;

    if (type === 'org') {
      const types = ORG_TYPE_MAP[activeCategory];
      if (!types) return [];
      return items.filter(o => types.includes(o.organization_type));
    }
    if (type === 'case') {
      const cats = CASE_CATEGORY_MAP[activeCategory];
      if (!cats) return [];
      return items.filter(c => cats.includes(c.category));
    }
    return [];
  }

  function filterBySearch(items, searchFields) {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      searchFields(item).some(field => (field || '').toLowerCase().includes(q))
    );
  }

  const allOrgs = filterBySearch(
    filterByCategory(data.organizations, 'org'),
    o => [o.name, o.description, o.mission, o.location, o.areas_served]
  );
  const allCases = filterBySearch(
    filterByCategory(data.cases, 'case'),
    c => [c.case_title, c.stated_need, c.location, c.recipient_name]
  );
  const allNews = filterBySearch(
    activeCategory === 'all' || activeCategory === 'news' ? data.news : [],
    n => [n.headline, n.summary, n.source_name]
  );

  const featuredCases = allCases.slice(0, 4);
  const featuredOrgs = allOrgs.slice(0, 6);
  const hasAnyContent = allOrgs.length > 0 || allCases.length > 0 || allNews.length > 0;

  return (
    <div className="vantoris-scroll">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="vantoris-balance-hero rounded-3xl p-6 mb-5 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-brass/[0.05] blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/12 flex items-center justify-center mx-auto mb-3 border border-white/10">
            <Heart size={24} className="text-brass" />
          </div>
          <h1 className="text-white text-xl font-bold mb-1">HeroBox</h1>
          <p className="text-white/70 text-sm mb-1">They are our heroes. We can be theirs too.</p>
          <p className="text-white/40 text-[11px] leading-relaxed max-w-sm mx-auto">
            Discover verified organizations, humanitarian needs, and care package opportunities — sourced from legitimate public sources by the Vantoris Discovery Engine.
          </p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div className="vantoris-glass-premium px-4 py-3 mb-4 flex items-center gap-3">
        <Search size={18} className="text-gray flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search HeroBox..."
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-gray/50 selectable-content"
        />
        <button
          onClick={handleRefreshDiscovery}
          disabled={discovering}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brass/10 border border-brass/15 text-brass text-[11px] font-semibold hover:bg-brass/20 transition disabled:opacity-50 flex-shrink-0"
        >
          {discovering ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {discovering ? 'Discovering...' : 'Refresh'}
        </button>
      </div>

      {/* Discovery Status */}
      {discoveryStatus && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vantoris-glass p-3 mb-4"
        >
          <p className="text-xs text-foreground font-medium mb-1">Discovery Complete</p>
          <p className="text-[11px] text-gray">
            {discoveryStatus.organizations?.discovered || 0} organizations discovered ({discoveryStatus.organizations?.approved || 0} auto-approved) · {' '}
            {discoveryStatus.cases?.discovered || 0} humanitarian cases ({discoveryStatus.cases?.approved || 0} auto-approved) · {' '}
            {discoveryStatus.news?.discovered || 0} news items
          </p>
          {discoveryStatus.errors?.length > 0 && (
            <p className="text-[10px] text-crimson mt-1">{discoveryStatus.errors.length} errors — see admin Discovery Network for details.</p>
          )}
        </motion.div>
      )}

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto vantoris-scroll pb-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                active ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
              }`}
            >
              <Icon size={12} /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={28} className="text-brass animate-spin mb-3" />
          <p className="text-gray text-sm">Loading discovered content...</p>
        </div>
      ) : !hasAnyContent ? (
        <EmptyState onRefresh={handleRefreshDiscovery} discovering={discovering} />
      ) : (
        <div>
          {/* Featured Needs */}
          {activeCategory === 'all' && featuredCases.length > 0 && (
            <DiscoverSection
              title="Featured Needs"
              icon={Sparkles}
              items={featuredCases}
              renderItem={(item, i) => (
                <DiscoverCard key={item.id} item={item} type="case" onShop={onShop} onDonate={onDonate} index={i} />
              )}
            />
          )}

          {/* Organizations */}
          {(activeCategory === 'all' || activeCategory === 'organizations' || ORG_TYPE_MAP[activeCategory]) && (
            <DiscoverSection
              title={activeCategory === 'all' ? 'Organizations' : CATEGORIES.find(c => c.id === activeCategory)?.label || 'Organizations'}
              icon={Heart}
              items={allOrgs.slice(0, activeCategory === 'all' ? 6 : 50)}
              renderItem={(item, i) => (
                <DiscoverCard key={item.id} item={item} type="organization" onShop={onShop} onDonate={onDonate} index={i} />
              )}
            />
          )}

          {/* Cases (by category) */}
          {activeCategory !== 'all' && activeCategory !== 'organizations' && activeCategory !== 'news' && CASE_CATEGORY_MAP[activeCategory] && (
            <DiscoverSection
              title={CATEGORIES.find(c => c.id === activeCategory)?.label || 'Needs'}
              icon={CATEGORIES.find(c => c.id === activeCategory)?.icon || Heart}
              items={allCases}
              renderItem={(item, i) => (
                <DiscoverCard key={item.id} item={item} type="case" onShop={onShop} onDonate={onDonate} index={i} />
              )}
            />
          )}

          {/* Humanitarian News */}
          {(activeCategory === 'all' || activeCategory === 'news') && allNews.length > 0 && (
            <DiscoverSection
              title="Humanitarian News"
              icon={Newspaper}
              items={allNews}
              renderItem={(item, i) => (
                <DiscoverCard key={item.id} item={item} type="news" onShop={onShop} onDonate={onDonate} index={i} />
              )}
            />
          )}

          {/* Care Package Opportunities CTA */}
          {activeCategory === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="vantoris-glass-premium p-5 mb-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
                  <Package size={18} className="text-brass" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-sm">Care Package Opportunities</h3>
                  <p className="text-gray text-[11px]">Send meaningful support to deployed service members and families.</p>
                </div>
              </div>
              <button
                onClick={onShop}
                className="w-full py-3 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition flex items-center justify-center gap-2"
              >
                <Package size={16} /> Browse Care Packages
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Trust Footer */}
      <div className="vantoris-glass p-4 mb-4">
        <div className="flex items-start gap-2.5">
          <Shield size={14} className="text-brass mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-foreground mb-1">Discovery is not authorization.</p>
            <p className="text-[10px] text-gray leading-relaxed">
              HeroBox discovers information from legitimate public sources. Discovering an organization or need does not authorize spending money. All financial actions remain subject to Vantoris authorization. You remain in control of what you support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onRefresh, discovering }) {
  return (
    <div className="vantoris-glass p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brass/10 flex items-center justify-center mx-auto mb-4">
        <Compass size={24} className="text-brass" />
      </div>
      <h3 className="text-foreground font-semibold text-sm mb-2">No verified content available yet</h3>
      <p className="text-gray text-xs leading-relaxed mb-5 max-w-sm mx-auto">
        The Vantoris Discovery Engine continuously browses legitimate public sources — Charity Navigator, IRS nonprofit records, official NGO websites, and recognized humanitarian news — to find verified organizations and needs.
      </p>
      <p className="text-gray text-[11px] leading-relaxed mb-4">
        Only approved records appear here. Content is reviewed through the Vantoris verification pipeline before publishing.
      </p>
      <button
        onClick={onRefresh}
        disabled={discovering}
        className="px-6 py-3 rounded-xl bg-brass text-white text-sm font-semibold hover:bg-brass/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
      >
        {discovering ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        {discovering ? 'Discovering...' : 'Start Discovery'}
      </button>
    </div>
  );
}