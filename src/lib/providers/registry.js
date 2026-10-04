// ============================================================
// VANTORIS — PROVIDER ARCHITECTURE
// ============================================================
// The backbone of the "Reality first" principle (Spec §25, §30).
//
// Every product surface (Money, Cards, Travel, Homes, HeroBox,
// News, etc.) checks its provider before displaying data. If no
// real provider is connected, the UI shows a truthful unavailable
// state — never fabricated data.
//
// Each provider is a plain object with:
//   id          — stable identifier
//   name        — display name
//   connected   — is a real backend/provider wired up?
//   capabilities— string[] of supported actions
//   methods     — async functions returning real data or null
//
// When a real provider integration is added, update its entry
// here: flip `connected` to true, list capabilities, and
// implement the methods against the real adapter.
// ============================================================

export const providers = {
  // ---- Financial Account ----
  financial: {
    id: 'financial',
    name: 'USD Account',
    connected: true, // Base44 Account entity serves as the system of record
    capabilities: ['balance', 'account_details', 'statements', 'activity', 'transfers'],
    description: 'USD account balances, account details, statements, and transaction activity.',
  },

  // ---- Payments ----
  payments: {
    id: 'payments',
    name: 'Payments',
    connected: true, // Transaction entity records real payment state
    capabilities: ['send', 'receive', 'add_funds', 'status_tracking'],
    description: 'Send, receive, and add funds with real transaction state tracking.',
  },

  // ---- Cards ----
  cards: {
    id: 'cards',
    name: 'Cards',
    connected: false, // No card-issuing provider connected
    capabilities: [],
    description: 'Debit, credit, virtual, and physical card management.',
  },

  // ---- Travel ----
  travel: {
    id: 'travel',
    name: 'Travel',
    connected: false, // No flight/hotel/car inventory provider connected
    capabilities: [],
    description: 'Flights, hotels, cars, activities, trips, and flight tracking.',
  },

  // ---- Homes ----
  homes: {
    id: 'homes',
    name: 'Homes',
    connected: false, // No property/listing data provider connected
    capabilities: [],
    description: 'Property search, listings, saved homes, and price alerts.',
  },

  // ---- HeroBox Marketplace ----
  marketplace: {
    id: 'marketplace',
    name: 'HeroBox Marketplace',
    connected: true, // HeroBoxProduct entity holds the catalog
    capabilities: ['browse', 'categories', 'packages', 'checkout'],
    description: 'Marketplace products, packages, and checkout.',
  },

  // ---- Shipping ----
  shipping: {
    id: 'shipping',
    name: 'Shipping',
    connected: false, // No carrier/shipping-rate provider connected
    capabilities: [],
    description: 'Real shipping rate calculation, carrier selection, and tracking.',
  },

  // ---- Connect (SIM/eSIM/Data) ----
  connect: {
    id: 'connect',
    name: 'Connect',
    connected: false, // No mobile/SIM/eSIM provider connected
    capabilities: [],
    description: 'Phones, SIM, eSIM, data plans, mobile top-ups, and international calling.',
  },

  // ---- NGO / Donations ----
  ngo: {
    id: 'ngo',
    name: 'Giving',
    connected: true, // OrganizationProfile entity holds verified orgs
    capabilities: ['browse', 'donate', 'receipt'],
    description: 'Discover verified organizations and donate through Vantoris.',
  },

  // ---- News ----
  news: {
    id: 'news',
    name: 'News',
    connected: false, // No news provider/API connected
    capabilities: [],
    description: 'Daily news briefing, source attribution, and personalized alerts.',
  },

  // ---- Identity / KYC ----
  kyc: {
    id: 'kyc',
    name: 'Identity Verification',
    connected: true, // Application + VerificationRequest entities
    capabilities: ['submit', 'review_status'],
    description: 'Identity verification and KYC status.',
  },

  // ---- Notifications ----
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    connected: true, // Notification entity
    capabilities: ['list', 'preferences'],
    description: 'Central notification center with preference controls.',
  },

  // ---- AI / Ask Vantoris ----
  ai: {
    id: 'ai',
    name: 'Ask Vantoris',
    connected: true, // Vantoris Assistant agent
    capabilities: ['chat', 'account_data', 'guidance'],
    description: 'AI intelligence layer connecting the entire ecosystem.',
  },
};

// Get a provider by id
export function getProvider(id) {
  return providers[id] || null;
}

// Check if a provider is connected
export function isProviderConnected(id) {
  const p = providers[id];
  return p ? p.connected : false;
}

// Check if a provider has a specific capability
export function hasCapability(id, capability) {
  const p = providers[id];
  if (!p || !p.connected) return false;
  return p.capabilities.includes(capability);
}

// Get all connected providers
export function getConnectedProviders() {
  return Object.values(providers).filter(p => p.connected);
}

// Get all unavailable providers
export function getUnavailableProviders() {
  return Object.values(providers).filter(p => !p.connected);
}