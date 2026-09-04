const ASSETS = [
  ['bitcoin', 'BTC', 'Bitcoin'],
  ['ethereum', 'ETH', 'Ethereum'],
  ['the-open-network', 'TON', 'Toncoin'],
  ['tether', 'USDT', 'Tether'],
];

const CACHE_KEY = 'vantoris_live_crypto_market_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,the-open-network,tether&vs_currencies=usd&include_24hr_change=true&include_market_cap=true';

export function normalizeCryptoQuotes(payload = {}) {
  return ASSETS.flatMap(([id, symbol, name]) => {
    const quote = payload[id];
    if (!quote || quote.usd == null) return [];
    return [{
      id,
      symbol,
      name,
      price: Number(quote.usd),
      change24h: Number(quote.usd_24h_change || 0),
      marketCap: Number(quote.usd_market_cap || 0),
    }];
  });
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!cached || !cached.fetchedAt || Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

export async function fetchLiveCryptoMarket({ force = false } = {}) {
  if (!force) {
    const cached = readCache();
    if (cached?.quotes?.length) return cached;
  }

  const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Crypto market source returned HTTP ${response.status}`);
  const payload = await response.json();
  const state = { quotes: normalizeCryptoQuotes(payload), fetchedAt: Date.now(), source: 'CoinGecko' };
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch { /* cache is optional */ }
  return state;
}

export function formatMarketPrice(value) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
}
