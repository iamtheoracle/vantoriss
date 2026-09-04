const TRUSTED_NEWS_DOMAINS = new Set([
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'bbc.co.uk',
  'news.un.org',
  'reliefweb.int',
  'cnbc.com',
  'ft.com',
  'bloomberg.com',
  'coindesk.com',
  'cointelegraph.com',
  'theblock.co',
]);

const NEWS_QUERY = '(humanitarian OR banking OR finance OR investment OR bitcoin OR ethereum OR crypto OR regulation OR markets)';

export function buildGdeltUrl(query = NEWS_QUERY, timespan = '24h') {
  const params = new URLSearchParams({
    query,
    mode: 'artlist',
    format: 'json',
    maxrecords: '50',
    timespan,
    sort: 'datedesc',
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

function parseGdeltDate(value) {
  if (!value || String(value).length < 14) return null;
  const raw = String(value).slice(0, 14);
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function classifyNewsCategory(headline = '') {
  const lower = headline.toLowerCase();
  if (/(bitcoin|ethereum|crypto|blockchain|stablecoin|token|defi)/.test(lower)) return 'financial';
  if (/(bank|interest rate|inflation|market|stock|bond|investment|finance|fund|treasury)/.test(lower)) return 'financial';
  if (/(humanitarian|relief|refugee|disaster|famine|food security|aid|displacement)/.test(lower)) return 'humanitarian';
  if (/(regulation|regulator|sec |central bank|law|legislation|sanction)/.test(lower)) return 'regulatory';
  if (/(military|veteran|defense|defence)/.test(lower)) return 'military';
  if (/(technology|ai |artificial intelligence|cyber)/.test(lower)) return 'technology';
  return 'international';
}

export function isTrustedNewsDomain(domain = '') {
  const normalized = domain.toLowerCase().replace(/^www\./, '').trim();
  return TRUSTED_NEWS_DOMAINS.has(normalized);
}

export function normalizeGdeltArticle(article = {}) {
  const headline = String(article.title || '').trim();
  const sourceDomain = String(article.domain || '').toLowerCase().replace(/^www\./, '').trim();
  return {
    headline,
    summary: '',
    category: classifyNewsCategory(headline),
    source_url: String(article.url || '').trim(),
    source_name: sourceDomain,
    source_domain: sourceDomain,
    publication_date: parseGdeltDate(article.seendate),
    discovered_date: new Date().toISOString(),
    last_checked: new Date().toISOString(),
    freshness_status: 'current',
    verification_status: 'unverified',
    confidence_level: isTrustedNewsDomain(sourceDomain) ? 'high' : 'low',
    corroborating_sources: '[]',
    conflicting_reports: '[]',
    is_confirmed: false,
    responsible_division: 'intelligence',
    status: 'active',
  };
}

export async function fetchLiveNews({ query = NEWS_QUERY, timespan = '24h' } = {}) {
  const response = await fetch(buildGdeltUrl(query, timespan), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Live news source returned HTTP ${response.status}`);
  const payload = await response.json();
  const articles = Array.isArray(payload?.articles) ? payload.articles : [];
  return articles
    .map(normalizeGdeltArticle)
    .filter(item => item.headline && item.source_url && isTrustedNewsDomain(item.source_domain));
}

export const TRUSTED_NEWS_SOURCE_COUNT = TRUSTED_NEWS_DOMAINS.size;
