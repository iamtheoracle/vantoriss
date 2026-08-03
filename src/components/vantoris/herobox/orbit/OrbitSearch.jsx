import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Search, X, Sparkles, Loader2, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import OrbitResultCard from './OrbitResultCard';
import OrbitSuggestions from './OrbitSuggestions';
import OrbitNoResults from './OrbitNoResults';

const REQUEST_TYPE_LABELS = {
  care_package: 'Care Package',
  internet_support: 'Internet Support',
  financial_assistance: 'Financial Assistance',
  communication_services: 'Communication',
  essential_supplies: 'Essential Supplies',
};

const ACTIVITY_LABELS = {
  sponsored: 'Sponsorship', request_approved: 'Approval', package_delivered: 'Delivery',
  letter_received: 'Letter', impact_report: 'Impact Report', volunteer_hours: 'Volunteer',
  internet_sponsored: 'Internet', community_update: 'Community', mission_milestone: 'Milestone',
};

const DOC_LABELS = {
  statement: 'Statement', kyc_document: 'Verification', tax_document: 'Tax Document', agreement: 'Agreement', other: 'Document',
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'request', label: 'Requests' },
  { id: 'activity', label: 'Activity' },
  { id: 'document', label: 'Resources' },
  { id: 'profile', label: 'Community' },
];

export default function OrbitSearch() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentRequests, setRecentRequests] = useState([]);

  const cacheRef = useRef({});
  const dataRef = useRef({ requests: [], activities: [], documents: [], profiles: [] });
  const dataLoadedRef = useRef(false);
  const inputRef = useRef(null);

  // Load data when expanded
  useEffect(() => {
    if (expanded && !dataLoadedRef.current) {
      loadOrbitData();
    }
    if (expanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [expanded]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSearching(false);
      setActiveFilter('all');
      return;
    }
    const timer = setTimeout(() => executeSearch(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  async function loadOrbitData() {
    try {
      const me = await base44.auth.me();
      const [reqs, acts, docs, profs] = await Promise.all([
        base44.entities.HeroBoxRequest.filter({ user_id: me.id }, '-created_date', 50).catch(() => []),
        base44.entities.HeroBoxActivity.filter({ user_id: me.id }, '-created_date', 30).catch(() => []),
        base44.entities.Document.filter({ user_id: me.id }).catch(() => []),
        base44.entities.HeroBoxProfile.filter({}, '-created_date', 20).catch(() => []),
      ]);
      dataRef.current = { requests: reqs, activities: acts, documents: docs, profiles: profs };
      dataLoadedRef.current = true;
      setRecentRequests(reqs.slice(0, 5));
    } catch (e) {
      console.error('Orbit data load failed:', e);
    }
  }

  async function executeSearch(q) {
    // Check cache
    if (cacheRef.current[q]) {
      setResults(cacheRef.current[q]);
      setSearching(false);
      return;
    }

    setSearching(true);

    try {
      // LLM intent parsing
      const intent = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Orbit, the intelligent discovery assistant for HeroBox, a humanitarian support platform for military members, veterans, and their families.

Parse the user's natural language search query and extract structured search intent.

HeroBox request types:
- care_package: Care packages with snacks, hygiene products, essentials for deployed personnel
- internet_support: Internet connectivity and communication technology support
- financial_assistance: Financial aid, monetary support, emergency funding
- communication_services: Letters, calls, messaging services
- essential_supplies: Basic necessities, provisions, medical supplies, disaster relief

Additional categories:
- activity: Recent mission activities, deliveries, milestones, impact reports
- resource: Documents, articles, FAQs, policies, guides, statements
- community: Organizations, sponsors, heroes, volunteers

User query: "${q}"

Extract:
1. keywords: All relevant lowercase search terms including synonyms and related terms. For "snacks" also include "food", "meals", "provisions".
2. categories: Which categories are relevant from the types listed above.
3. recipient_type: Type of recipient mentioned (military, veteran, children, family, disaster_relief, medical). Empty string if not specified.
4. urgency: "high" if emergency/urgent language is used, "normal" otherwise.`,
        response_json_schema: {
          type: 'object',
          properties: {
            keywords: { type: 'array', items: { type: 'string' }, description: 'Lowercase search terms including synonyms' },
            categories: { type: 'array', items: { type: 'string' }, description: 'Matching HeroBox categories' },
            recipient_type: { type: 'string', description: 'Type of recipient if mentioned' },
            urgency: { type: 'string', enum: ['normal', 'high'], description: 'Urgency level' },
          },
        },
      });

      const filtered = filterResults(dataRef.current, intent, q);
      cacheRef.current[q] = filtered;
      setResults(filtered);
    } catch (e) {
      // Fallback to simple keyword search
      const filtered = simpleSearch(dataRef.current, q);
      cacheRef.current[q] = filtered;
      setResults(filtered);
    }

    setSearching(false);
  }

  function filterResults(data, intent, rawQuery) {
    const llmKeywords = (intent.keywords || []).map(k => k.toLowerCase());
    const queryWords = rawQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const keywords = [...new Set([...llmKeywords, ...queryWords])];

    const groups = {};
    const categories = (intent.categories || []).map(c => c.toLowerCase());

    // Filter requests
    const matchedRequests = data.requests.filter(r => {
      if (categories.length > 0 && categories.includes(r.request_type)) return true;
      const text = `${r.title} ${r.description || ''} ${r.recipient_name || ''} ${r.recipient_location || ''} ${r.request_type} ${r.mission_notes || ''}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedRequests.length > 0) {
      groups.request = matchedRequests.map(r => toResult(r, 'request')).sort((a, b) => b.createdAt - a.createdAt);
    }

    // Filter activities
    const matchedActivities = data.activities.filter(a => {
      if (categories.length > 0 && categories.includes('activity')) return true;
      const text = `${a.title} ${a.description || ''} ${a.activity_type} ${a.recipient_name || ''}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedActivities.length > 0) {
      groups.activity = matchedActivities.map(a => toResult(a, 'activity')).sort((a, b) => b.createdAt - a.createdAt);
    }

    // Filter documents
    const matchedDocs = data.documents.filter(d => {
      if (categories.length > 0 && categories.includes('resource')) return true;
      const text = `${d.title} ${d.type} ${d.reference_number || ''}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedDocs.length > 0) {
      groups.document = matchedDocs.map(d => toResult(d, 'document')).sort((a, b) => b.createdAt - a.createdAt);
    }

    // Filter profiles
    const matchedProfiles = data.profiles.filter(p => {
      if (categories.length > 0 && categories.includes('community')) return true;
      const text = `${p.role} ${p.mission_statement || ''}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedProfiles.length > 0) {
      groups.profile = matchedProfiles.map(p => toResult(p, 'profile')).sort((a, b) => b.createdAt - a.createdAt);
    }

    return groups;
  }

  function simpleSearch(data, q) {
    const keywords = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const groups = {};

    const matchedRequests = data.requests.filter(r => {
      const text = `${r.title} ${r.description || ''} ${r.recipient_name || ''} ${r.request_type}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedRequests.length > 0) groups.request = matchedRequests.map(r => toResult(r, 'request'));

    const matchedActivities = data.activities.filter(a => {
      const text = `${a.title} ${a.description || ''} ${a.activity_type}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedActivities.length > 0) groups.activity = matchedActivities.map(a => toResult(a, 'activity'));

    const matchedDocs = data.documents.filter(d => {
      const text = `${d.title} ${d.type}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (matchedDocs.length > 0) groups.document = matchedDocs.map(d => toResult(d, 'document'));

    return groups;
  }

  function toResult(entity, type) {
    const createdAt = new Date(entity.created_date);
    switch (type) {
      case 'request':
        return {
          id: entity.id, type, title: entity.title,
          category: REQUEST_TYPE_LABELS[entity.request_type] || 'Request',
          description: entity.description || entity.recipient_location || '',
          status: entity.status, amount: entity.amount,
          action: ['pending', 'under_review'].includes(entity.status) ? 'Sponsor' : 'View',
          rawType: entity.request_type, createdAt,
        };
      case 'activity':
        return {
          id: entity.id, type, title: entity.title,
          category: ACTIVITY_LABELS[entity.activity_type] || 'Activity',
          description: entity.description || entity.recipient_name || '',
          status: entity.status, amount: entity.amount,
          action: 'View', createdAt,
        };
      case 'document':
        return {
          id: entity.id, type, title: entity.title,
          category: DOC_LABELS[entity.type] || 'Document',
          description: entity.reference_number || '',
          status: entity.status, amount: null,
          action: 'Download', fileUrl: entity.file_url, createdAt,
        };
      case 'profile':
        return {
          id: entity.id, type, title: entity.role ? entity.role.charAt(0).toUpperCase() + entity.role.slice(1) : 'Member',
          category: 'Community Member',
          description: entity.mission_statement || '',
          status: entity.status, amount: null,
          action: 'View', createdAt,
        };
      default: return { id: entity.id, type, title: 'Unknown', category: '', description: '', status: '', amount: null, action: 'View', createdAt };
    }
  }

  function handleResultAction(result) {
    if (result.type === 'document' && result.fileUrl) {
      window.open(result.fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      setExpanded(false);
    }
  }

  function handleSuggestion(suggestionQuery) {
    setQuery(suggestionQuery);
  }

  function handleSelectItem(item) {
    setExpanded(false);
  }

  // Get filtered groups for display
  const filteredGroups = results ? (
    activeFilter === 'all' ? results : { [activeFilter]: results[activeFilter] }
  ) : null;

  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;
  const hasResults = totalResults > 0;
  const showNoResults = results && !hasResults && !searching;

  // Filter counts
  const filterCounts = results ? {
    all: totalResults,
    request: results.request?.length || 0,
    activity: results.activity?.length || 0,
    document: results.document?.length || 0,
    profile: results.profile?.length || 0,
  } : null;

  return (
    <>
      {/* Collapsed search bar */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setExpanded(true)}
        className="vantoris-glass-premium px-4 py-3.5 mb-4 flex items-center gap-3 w-full hover:shadow-float transition-all group"
      >
        <Search size={18} className="text-gray" />
        <span className="text-gray text-sm flex-1 text-left">Discover HeroBox with Orbit...</span>
        <div className="flex items-center gap-1 px-2 py-1 bg-brass/10 rounded-lg">
          <Sparkles size={11} className="text-brass" />
          <span className="text-brass text-[10px] font-bold uppercase tracking-wider">Orbit</span>
        </div>
      </motion.button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="orbit-overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto vantoris-scroll"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Sticky search header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-slate-100 p-4 safe-pt-top">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-brass/30 transition-colors">
                  <Search size={18} className="text-gray flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search HeroBox naturally..."
                    className="flex-1 bg-transparent outline-none text-foreground text-sm placeholder:text-gray/50 selectable-content"
                  />
                  {searching && <Loader2 size={16} className="text-brass animate-spin flex-shrink-0" />}
                  {query && !searching && (
                    <button onClick={() => setQuery('')} className="text-gray/50 hover:text-gray flex-shrink-0">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button onClick={() => setExpanded(false)} className="text-navy text-sm font-medium flex-shrink-0">
                  Cancel
                </button>
              </div>

              {/* Filter tabs */}
              {filterCounts && (
                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto vantoris-scroll">
                  {FILTER_TABS.map(tab => {
                    const count = filterCounts[tab.id] || 0;
                    if (tab.id !== 'all' && count === 0) return null;
                    const active = activeFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                          active ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                        {count > 0 && <span className={`text-[9px] ${active ? 'text-white/60' : 'text-gray/50'}`}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-h-[calc(100vh-80px)]">
              {!query.trim() ? (
                <OrbitSuggestions
                  recentItems={recentRequests}
                  onSelectSuggestion={handleSuggestion}
                  onSelectItem={handleSelectItem}
                />
              ) : searching ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-14 h-14 rounded-2xl bg-brass/10 flex items-center justify-center mb-4">
                    <Sparkles size={22} className="text-brass animate-pulse" />
                  </div>
                  <p className="text-foreground text-sm font-semibold">Orbit is searching...</p>
                  <p className="text-gray text-xs mt-1">Understanding your request</p>
                </div>
              ) : showNoResults ? (
                <OrbitNoResults
                  query={query}
                  popularItems={recentRequests}
                  onSelectSuggestion={handleSuggestion}
                  onSelectItem={handleSelectItem}
                />
              ) : hasResults && filteredGroups ? (
                <div className="px-4 py-4 space-y-5">
                  {Object.entries(filteredGroups).map(([groupKey, items]) => {
                    if (!items || items.length === 0) return null;
                    const groupLabel = FILTER_TABS.find(t => t.id === groupKey)?.label || groupKey;
                    return (
                      <div key={groupKey}>
                        <div className="flex items-center justify-between mb-2.5 px-1">
                          <p className="text-gray text-[10px] font-bold uppercase tracking-wider">{groupLabel}</p>
                          <span className="text-gray/40 text-[10px]">{items.length} {items.length === 1 ? 'result' : 'results'}</span>
                        </div>
                        <div className="space-y-2.5">
                          {items.map((result, i) => (
                            <OrbitResultCard
                              key={result.id}
                              result={result}
                              onAction={handleResultAction}
                              index={i}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}