/**
 * Vantoris Command Router
 *
 * Vantoris Assistant is the only customer-facing AI. Command coordinates a
 * professional institutional workforce of specialist divisions. Routing is
 * evidence-oriented: a lead division owns the work and only the minimum
 * necessary supporting divisions are engaged.
 */

export const COMMAND_DIVISIONS = {
  COMMAND: 'command', INTELLIGENCE: 'intelligence', OPERATIONS: 'operations', COMPLIANCE: 'compliance',
  SECURITY: 'security', SUPPORT: 'support', LOGISTICS: 'logistics', HUMANITARIAN: 'humanitarian',
  RECONNAISSANCE: 'reconnaissance', FINANCE: 'finance', MARKETS: 'markets', PORTFOLIO: 'portfolio',
  RISK: 'risk', NAVIGATION: 'navigation', RECORDS: 'records', COMMUNICATIONS: 'communications',
};

export const DIVISION_AGENTS = Object.fromEntries(Object.values(COMMAND_DIVISIONS).map((division) => [division, division]));

export const DIVISION_LABELS = Object.fromEntries(
  Object.entries(COMMAND_DIVISIONS).map(([key, value]) => [value, key.charAt(0) + key.slice(1).toLowerCase()]),
);

const ROUTING_PATTERNS = [
  { division: COMMAND_DIVISIONS.OPERATIONS, keywords: ['transfer', 'send money', 'payment', 'ach', 'wire', 'deposit', 'withdraw', 'withdrawal', 'move money', 'fund', 'funding', 'pay', 'routing number', 'account number', 'direct deposit', 'check deposit', 'declined', 'transaction', 'balance', 'fee', 'overdraft', 'statement', 'account status', 'frozen', 'closed', 'dispute', 'charge', 'pending', 'history', 'account issue'] },
  { division: COMMAND_DIVISIONS.COMPLIANCE, keywords: ['kyc', 'verification', 'identity', 'id upload', 'document upload', 'verification status', 'compliance', 'approved', 'rejected', 'application', 'joint account', 'business account', 'ein', 'aml', 'sanctions', 'regulatory'] },
  { division: COMMAND_DIVISIONS.SECURITY, keywords: ['fraud', 'unauthorized', 'suspicious', 'security', 'breach', 'compromised', 'hacked', 'stolen', 'identity theft', 'frozen account', 'access control'] },
  { division: COMMAND_DIVISIONS.SUPPORT, keywords: ['help', 'support', 'guide', 'onboarding', 'next step', 'what do i do', 'how do i', 'where is', 'contact', 'advisor'] },
  { division: COMMAND_DIVISIONS.LOGISTICS, keywords: ['herobox', 'care package', 'shipping', 'delivery', 'tracking', 'order', 'fulfillment', 'package'] },
  { division: COMMAND_DIVISIONS.HUMANITARIAN, keywords: ['humanitarian', 'ngo', 'orphanage', 'children', 'relief', 'assistance', 'charity', 'donate', 'sponsor', 'hero', 'veteran', 'military', 'deployed'] },
  { division: COMMAND_DIVISIONS.RECONNAISSANCE, keywords: ['search', 'find', 'discover', 'research', 'current', 'latest', 'news', 'emerging', 'what is happening'] },
  { division: COMMAND_DIVISIONS.FINANCE, keywords: ['financial analysis', 'financial report', 'account intelligence', 'balance sheet', 'income', 'expense', 'cash flow', 'profit', 'loss'] },
  { division: COMMAND_DIVISIONS.MARKETS, keywords: ['investment research', 'market', 'stock', 'bond', 'etf', 'index', 'trading', 'signal', 'buy', 'sell', 'ticker', 'crypto', 'bitcoin', 'ethereum'] },
  { division: COMMAND_DIVISIONS.PORTFOLIO, keywords: ['portfolio', 'position', 'allocation', 'performance', 'pnl', 'p&l', 'dividend', 'investment deposit', 'investment withdrawal'] },
  { division: COMMAND_DIVISIONS.RISK, keywords: ['risk', 'exposure', 'volatility', 'var', 'stress test', 'counterparty', 'operational risk'] },
  { division: COMMAND_DIVISIONS.NAVIGATION, keywords: ['where do i go', 'next action', 'what should i do next', 'how long', 'timeline', 'when will', 'plan', 'route'] },
  { division: COMMAND_DIVISIONS.RECORDS, keywords: ['statement', 'document', 'letter', 'certificate', 'proof of', 'reference letter', 'balance letter', 'summary', 'archive', 'historical'] },
  { division: COMMAND_DIVISIONS.COMMUNICATIONS, keywords: ['email', 'sms', 'whatsapp', 'notification', 'notify', 'alert', 'communicate'] },
  { division: COMMAND_DIVISIONS.COMMAND, keywords: ['diagnostic', 'health', 'system status', 'platform', 'uptime', 'background job', 'scheduled', 'metric', 'audit log', 'configuration', 'system report', 'generate account', 'build', 'code'] },
];

function scoreDivision(lower, pattern) {
  return pattern.keywords.reduce((score, keyword) => score + (lower.includes(keyword) ? keyword.split(' ').length : 0), 0);
}

/** Returns the lead division for a request. */
export function routeRequest(message) {
  return routeWork(message).leadDivision;
}

/**
 * Produces an institutional routing plan: one lead division plus only the
 * specialist divisions with meaningful evidence of relevance.
 */
export function routeWork(message) {
  const lower = String(message || '').toLowerCase();
  const scored = ROUTING_PATTERNS
    .map((pattern) => ({ division: pattern.division, score: scoreDivision(lower, pattern) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const lead = scored[0] || { division: COMMAND_DIVISIONS.OPERATIONS, score: 0 };
  const collaborators = scored
    .slice(1)
    .filter((item) => item.score >= Math.max(1, Math.ceil(lead.score * 0.35)))
    .slice(0, 3)
    .map((item) => item.division);

  return {
    leadDivision: lead.division,
    collaborators,
    divisions: [lead.division, ...collaborators],
    confidence: lead.score >= 3 ? 'high' : lead.score >= 1 ? 'medium' : 'low',
    score: lead.score,
  };
}

export function getAgentName(division) {
  return DIVISION_AGENTS[division] || DIVISION_AGENTS[COMMAND_DIVISIONS.OPERATIONS];
}

export function getDivisionLabel(division) {
  return DIVISION_LABELS[division] || DIVISION_LABELS[COMMAND_DIVISIONS.OPERATIONS];
}

export function getCaseType(division) {
  return division || COMMAND_DIVISIONS.OPERATIONS;
}

export const SPECIALIST_TYPES = COMMAND_DIVISIONS;
export const SPECIALIST_AGENTS = DIVISION_AGENTS;
export const SPECIALIST_LABELS = DIVISION_LABELS;
export const getSpecialistLabel = getDivisionLabel;
