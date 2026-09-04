import assert from 'node:assert/strict';
import { buildGdeltUrl, normalizeGdeltArticle } from '../src/lib/liveNews.js';
import { normalizeCryptoQuotes } from '../src/lib/liveMarket.js';

const newsUrl = buildGdeltUrl('bitcoin OR ethereum', '24h');
assert.ok(newsUrl.includes('api.gdeltproject.org/api/v2/doc/doc'));
assert.ok(newsUrl.includes('timespan=24h'));

const article = normalizeGdeltArticle({
  title: 'Bitcoin market update',
  url: 'https://example.com/story',
  domain: 'example.com',
  language: 'English',
  seendate: '20260904102030',
});
assert.equal(article.headline, 'Bitcoin market update');
assert.equal(article.source_url, 'https://example.com/story');
assert.equal(article.source_domain, 'example.com');
assert.equal(article.category, 'financial');
assert.equal(article.verification_status, 'unverified');

const quotes = normalizeCryptoQuotes({
  bitcoin: { usd: 100000, usd_24h_change: 2.5, usd_market_cap: 2000000000000 },
  ethereum: { usd: 4000, usd_24h_change: -1.2, usd_market_cap: 500000000000 },
  'the-open-network': { usd: 3, usd_24h_change: 0.8, usd_market_cap: 8000000000 },
  tether: { usd: 1, usd_24h_change: 0.01, usd_market_cap: 150000000000 },
});
assert.equal(quotes.length, 4);
assert.equal(quotes[0].symbol, 'BTC');
assert.equal(quotes[0].price, 100000);
assert.equal(quotes[1].change24h, -1.2);

console.log('live intelligence tests passed');
