import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const TRUSTED_DOMAINS = new Set([
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
const QUERY = '(humanitarian OR banking OR finance OR investment OR bitcoin OR ethereum OR crypto OR regulation OR markets)';

function normalizeDomain(value = '') {
  return String(value).toLowerCase().replace(/^www\./, '').trim();
}

function parseDate(value: unknown) {
  const raw = String(value || '').slice(0, 14);
  if (raw.length !== 14) return null;
  const date = new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function classify(headline = '') {
  const lower = headline.toLowerCase();
  if (/(bitcoin|ethereum|crypto|blockchain|stablecoin|token|defi|bank|interest rate|inflation|market|stock|bond|investment|finance|fund|treasury)/.test(lower)) return 'financial';
  if (/(humanitarian|relief|refugee|disaster|famine|food security|aid|displacement)/.test(lower)) return 'humanitarian';
  if (/(regulation|regulator|sec |central bank|law|legislation|sanction)/.test(lower)) return 'regulatory';
  if (/(military|veteran|defense|defence)/.test(lower)) return 'military';
  if (/(technology|ai |artificial intelligence|cyber)/.test(lower)) return 'technology';
  return 'international';
}

Deno.serve(async (req) => {
  const startedAt = new Date().toISOString();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const run = await base44.entities.DiscoveryRun.create({
      run_type: 'news_monitoring',
      status: 'running',
      started_at: startedAt,
      triggered_by: 'event',
      responsible_division: 'intelligence',
      summary: 'Real-time trusted news refresh started.',
    }).catch(() => null);

    const url = new URL(GDELT_URL);
    url.searchParams.set('query', QUERY);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('format', 'json');
    url.searchParams.set('maxrecords', '50');
    url.searchParams.set('timespan', '24h');
    url.searchParams.set('sort', 'datedesc');

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`GDELT returned HTTP ${response.status}`);
    const payload = await response.json();
    const articles = Array.isArray(payload?.articles) ? payload.articles : [];

    const existing = await base44.entities.NewsRecord.filter({ status: 'active' }, '-publication_date', 200).catch(() => []);
    const knownUrls = new Set((existing || []).map((item) => item.source_url).filter(Boolean));

    let discovered = 0;
    let updated = 0;
    for (const article of articles) {
      const sourceDomain = normalizeDomain(article.domain);
      const sourceUrl = String(article.url || '').trim();
      const headline = String(article.title || '').trim();
      if (!headline || !sourceUrl || !TRUSTED_DOMAINS.has(sourceDomain)) continue;

      if (knownUrls.has(sourceUrl)) {
        const existingRecord = existing.find((item) => item.source_url === sourceUrl);
        if (existingRecord?.id) {
          await base44.entities.NewsRecord.update(existingRecord.id, {
            last_checked: new Date().toISOString(),
            freshness_status: 'current',
          }).catch(() => {});
          updated += 1;
        }
        continue;
      }

      await base44.entities.NewsRecord.create({
        headline,
        summary: '',
        category: classify(headline),
        source_url: sourceUrl,
        source_name: sourceDomain,
        source_domain: sourceDomain,
        publication_date: parseDate(article.seendate),
        discovered_date: new Date().toISOString(),
        last_checked: new Date().toISOString(),
        freshness_status: 'current',
        verification_status: 'unverified',
        confidence_level: 'high',
        corroborating_sources: '[]',
        conflicting_reports: '[]',
        is_confirmed: false,
        responsible_division: 'intelligence',
        status: 'active',
      });
      knownUrls.add(sourceUrl);
      discovered += 1;
    }

    const completedAt = new Date().toISOString();
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'completed',
        completed_at: completedAt,
        sources_checked: TRUSTED_DOMAINS.size,
        records_discovered: discovered,
        records_updated: updated,
        summary: `Real-time news refresh: ${discovered} new trusted-source articles, ${updated} existing records refreshed.`,
      }).catch(() => {});
    }

    return Response.json({
      ok: true,
      source: 'GDELT',
      discovered,
      updated,
      refreshed_at: completedAt,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : 'News refresh failed',
    }, { status: 500 });
  }
});
