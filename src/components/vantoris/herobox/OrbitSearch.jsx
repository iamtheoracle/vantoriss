import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Search, X, Package, Wifi, DollarSign, MessageCircle, Heart, Users,
  Clock, FileText, HeartPulse, AlertTriangle, TrendingUp,
  Sparkles, Building2, Loader2, ChevronRight,
} from 'lucide-react';
import OrbitResultCard from './OrbitResultCard';

const SUGGESTIONS = [
  { label: 'Military Care', query: 'military care package', icon: Package, color: 'text-brass', bg: 'bg-brass/10' },
  { label: 'Internet Support', query: 'internet', icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/10' },
  { label: 'Financial Aid', query: 'financial assistance', icon: DollarSign, color: 'text-mint', bg: 'bg-mint/10' },
  { label: "Children's Programs", query: 'children', icon: Heart, color: 'text-brass', bg: 'bg-brass/10' },
  { label: 'Medical Support', query: 'medical', icon: HeartPulse, color: 'text-crimson', bg: 'bg-crimson/10' },
  { label: 'Emergency Relief', query: 'emergency relief disaster', icon: AlertTriangle, color: 'text-crimson', bg: 'bg-crimson/10' },
  { label: 'Volunteer', query: 'volunteer', icon: Clock, color: 'text-gray', bg: 'bg-slate-100' },
  { label: 'Community', query: 'community', icon: Users, color: 'text-navy', bg: 'bg-navy/8' },
];

const CATEGORY_META = {
  care_package: { label: 'Care Packages', icon: Package, color: 'text-brass', bg: 'bg-brass/10' },
  internet_support: { label: 'Internet Support', icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/10' },
  financial_assistance: { label: 'Financial Assistance', icon: DollarSign, color: 'text-mint', bg: 'bg-mint/10' },
  communication_services: { label: 'Communication', icon: MessageCircle, color: 'text-navy', bg: 'bg-navy/8' },
  essential_supplies: { label: 'Essential Supplies', icon: Package, color: 'text-brass', bg: 'bg-brass/10' },
};

const ROLE_META = {
  sponsor: { label: 'Sponsors', icon: Heart, color: 'text-brass', bg: 'bg-brass/10' },
  hero: { label: 'Heroes', icon: Users, color: 'text-navy', bg: 'bg-navy/8' },
  volunteer: { label: 'Volunteers', icon: Clock, color: 'text-gray', bg: 'bg-slate-100' },
  organization: { label: 'Organizations', icon: Building2, color: 'text-champagne', bg: 'bg-champagne/10' },
};

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('orbit_recent_searches') || '[]'); }
  catch { return []; }
}

function addRecentSearch(query) {
  try {
    const recent = getRecentSearches().filter(q => q !== query);
    recent.unshift(query);
    localStorage.setItem('orbit_recent_searches', JSON.stringify(recent.slice(0, 5)));
  } catch {}
}

function scoreItem(item, queryWords, fields) {
  let score = 0;
  for (const word of queryWords) {
    if (word.length < 2) continue;
    for (const field of fields) {
      const value = String(item[field] || '').toLowerCase();
      if (value.includes(word)) {
        score += 1;
        if (value === word) score += 2;
        if (value.startsWith(word)) score += 1;
      }
    }
  }
  return score;
}

export default function OrbitSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [allData, setAllData] = useState({ requests: [], profiles: [], activities: [], documents: [] });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchCache = useRef({});
  const debounceRef = useRef(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const [requests, profiles, activities, documents] = await Promise.all([
        base44.entities.HeroBoxRequest.filter({}, '-created_date', 50).catch(() => []),
        base44.entities.HeroBoxProfile.filter({ status: 'active' }, '-created_date', 50).catch(() => []),
        base44.entities.HeroBoxActivity.filter({}, '-created_date', 30).catch(() => []),
        base44.entities.Document.filter({ status: 'active' }, '-created_date', 20).catch(() => []),
      ]);
      setAllData({ requests, profiles, activities, documents });
    } catch {}
    setDataLoaded(true);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      setLlmLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      handleSearch(query.trim());
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleSearch(q) {
    if (searchCache.current[q]) {
      setResults(searchCache.current[q]);
      setLoading(false);
      return;
    }

    const instantResults = clientSideSearch(allData, q);

    if (instantResults.total > 0) {
      searchCache.current[q] = instantResults;
      setResults(instantResults);
      setLoading(false);
      addRecentSearch(q);
      setRecentSearches(getRecentSearches());
      return;
    }

    if (q.split(/\s+/).length > 2) {
      llmEnhancedSearch(q);
    } else {
      searchCache.current[q] = instantResults;
      setResults(instantResults);
      setLoading(false);
    }
  }

  async function llmEnhancedSearch(q) {
    setLlmLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Orbit, HeroBox's intelligent discovery assistant. A user searched for: "${q}".

Extract search keywords, synonyms, and related terms that would help find matching items in a HeroBox database.

Available request types: care_package, internet_support, financial_assistance, communication_services, essential_supplies
Available profile roles: sponsor, hero, volunteer, organization

Consider:
- Synonyms (food=snacks=meals, help=support=aid)
- Military terminology (deployed, veteran, service member, troop, deployment)
- Humanitarian terminology (relief, aid, disaster, emergency, crisis)
- Abbreviations (VA, PTSD)
- Recipient types (military, veteran, children, family, elderly)

Return keywords and related terms to search for in the database.`,
        response_json_schema: {
          type: 'object',
          properties: {
            keywords: { type: 'array', items: { type: 'string' }, description: 'All related keywords and synonyms to search for' },
            categories: { type: 'array', items: { type: 'string' }, description: 'Matching request types' },
          },
        },
      });

      const enhancedResults = clientSideSearch(allData, q, response.keywords || []);
      searchCache.current[q] = enhancedResults;
      setResults(enhancedResults);
      addRecentSearch(q);
      setRecentSearches(getRecentSearches());
    } catch {
      searchCache.current[q] = { total: 0, groups: [] };
      setResults({ total: 0, groups: [] });
    }
    setLlmLoading(false);
    setLoading(false);
  }

  function clientSideSearch(data, q, extraKeywords = []) {
    const queryWords = [...q.toLowerCase().split(/\s+/), ...extraKeywords.map(k => k.toLowerCase())].filter(w => w.length > 1);

    const scoredRequests = data.requests.map(item => ({
      item,
      score: scoreItem(item, queryWords, ['title', 'description', 'request_type', 'recipient_name', 'recipient_location', 'mission_notes']),
    })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    const scoredProfiles = data.profiles.map(item => ({
      item,
      score: scoreItem(item, queryWords, ['role', 'mission_statement']),
    })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    const scoredActivities = data.activities.map(item => ({
      item,
      score: scoreItem(item, queryWords, ['title', 'description', 'activity_type', 'recipient_name']),
    })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    const scoredDocuments = data.documents.map(item => ({
      item,
      score: scoreItem(item, queryWords, ['title', 'type']),
    })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    const groups = [];

    const requestGroups = {};
    scoredRequests.forEach(s => {
      const type = s.item.request_type;
      if (!requestGroups[type]) requestGroups[type] = [];
      requestGroups[type].push(s.item);
    });
    Object.entries(requestGroups).forEach(([type, items]) => {
      const meta = CATEGORY_META[type] || CATEGORY_META.care_package;
      groups.push({ id: `request-${type}`, label: meta.label, icon: meta.icon, color: meta.color, bg: meta.bg, items, type: 'request' });
    });

    const profileGroups = {};
    scoredProfiles.forEach(s => {
      const role = s.item.role;
      if (!profileGroups[role]) profileGroups[role] = [];
      profileGroups[role].push(s.item);
    });
    Object.entries(profileGroups).forEach(([role, items]) => {
      const meta = ROLE_META[role] || ROLE_META.sponsor;
      groups.push({ id: `profile-${role}`, label: meta.label, icon: meta.icon, color: meta.color, bg: meta.bg, items, type: 'profile' });
    });

    if (scoredActivities.length > 0) {
      groups.push({ id: 'activities', label: 'Community Activity', icon: TrendingUp, color: 'text-navy', bg: 'bg-navy/8', items: scoredActivities.map(s => s.item), type: 'activity' });
    }

    if (scoredDocuments.length > 0) {
      groups.push({ id: 'documents', label: 'Resources', icon: FileText, color: 'text-gray', bg: 'bg-slate-100', items: scoredDocuments.map(s => s.item), type: 'document' });
    }

    const total = scoredRequests.length + scoredProfiles.length + scoredActivities.length + scoredDocuments.length;
    return { groups, total };
  }

  function handleResultAction(item, type) {
    if (type === 'document' && item.file_url) {
      window.open(item.file_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/herobox');
    }
  }

  const showSuggestions = !query.trim() && dataLoaded;
  const showResults = results !== null && results.total > 0 && !loading;
  const showNoResults = results !== null && results.total === 0 && !loading;

  return (
    <div className="mb-5">
      {/* Search field */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Sparkles size={18} className="text-brass" />
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search HeroBox — try 'military care packages'"
          className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-foreground text-sm placeholder:text-gray/50 focus:outline-none focus:ring-2 focus:ring-brass/20 focus:border-brass/30 transition-all shadow-sm font-medium"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Suggestions */}
        {showSuggestions && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3"
          >
            <p className="text-gray text-[10px] uppercase tracking-wider font-semibold mb-2.5 px-1">Discover</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUGGESTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuery(s.query)}
                    className="vantoris-glass p-3 flex flex-col items-center gap-2 hover:shadow-float transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <Icon size={17} className={s.color} />
                    </div>
                    <span className="text-foreground text-[11px] font-medium text-center leading-tight">{s.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="mt-3">
                <p className="text-gray text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(q => (
                    <button
                      key={q}
                      onClick={() => setQuery(q)}
                      className="px-3 py-1.5 bg-slate-100 text-gray rounded-lg text-[11px] font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Clock size={10} />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {(loading || llmLoading) && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-col items-center py-8"
          >
            <Loader2 size={24} className="text-brass animate-spin mb-2" />
            <p className="text-gray text-xs">{llmLoading ? 'Understanding your search...' : 'Searching HeroBox...'}</p>
          </motion.div>
        )}

        {/* Results */}
        {showResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-gray text-[10px] uppercase tracking-wider font-semibold">
                {results.total} {results.total === 1 ? 'result' : 'results'}
              </p>
              {results.groups.length > 1 && (
                <p className="text-gray/50 text-[10px]">Across {results.groups.length} categories</p>
              )}
            </div>
            {results.groups.map(group => {
              const Icon = group.icon;
              return (
                <div key={group.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className={`w-6 h-6 rounded-lg ${group.bg} flex items-center justify-center`}>
                      <Icon size={12} className={group.color} />
                    </div>
                    <h4 className="text-foreground font-semibold text-xs">{group.label}</h4>
                    <span className="text-gray/50 text-[10px]">({group.items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.slice(0, 5).map(item => (
                      <OrbitResultCard
                        key={item.id}
                        item={item}
                        group={group}
                        onAction={() => handleResultAction(item, group.type)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* No results — never show an empty page */}
        {showNoResults && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4"
          >
            <div className="vantoris-glass-flat p-6 text-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Search size={20} className="text-gray/40" />
              </div>
              <p className="text-foreground font-semibold text-sm mb-1">No exact matches found</p>
              <p className="text-gray text-xs">Try a different search or explore popular categories below</p>
            </div>
            {allData.requests.length > 0 && (
              <div>
                <p className="text-gray text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">Popular Support Opportunities</p>
                <div className="space-y-2">
                  {allData.requests.slice(0, 3).map(item => {
                    const meta = CATEGORY_META[item.request_type] || CATEGORY_META.care_package;
                    return (
                      <OrbitResultCard
                        key={item.id}
                        item={item}
                        group={{ id: 'alt', label: meta.label, icon: meta.icon, color: meta.color, bg: meta.bg, type: 'request' }}
                        onAction={() => handleResultAction(item, 'request')}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTIONS.slice(0, 4).map(s => (
                <button
                  key={s.label}
                  onClick={() => setQuery(s.query)}
                  className="px-3 py-1.5 bg-slate-100 text-gray rounded-lg text-[11px] font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  {s.label}
                  <ChevronRight size={10} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}