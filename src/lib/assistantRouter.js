/**
 * Unified Assistant Router
 * 
 * Classifies member/staff requests and determines which specialist assistant
 * should handle the interaction. This is the routing layer described in the
 * Vantoris Assistant Orchestration Production Amendment v1.1.
 * 
 * Routing is automatic and transparent — the user never chooses a specialist.
 */

export const SPECIALIST_TYPES = {
  PAYMENTS: 'payments',
  BANKING: 'banking',
  COMPLIANCE: 'compliance',
  INVESTMENT: 'investment',
  DOCUMENT: 'document',
  PLATFORM: 'platform',
};

export const SPECIALIST_AGENTS = {
  [SPECIALIST_TYPES.PAYMENTS]: 'payments_specialist',
  [SPECIALIST_TYPES.BANKING]: 'banking_specialist',
  [SPECIALIST_TYPES.COMPLIANCE]: 'compliance_specialist',
  [SPECIALIST_TYPES.INVESTMENT]: 'investment_specialist',
  [SPECIALIST_TYPES.DOCUMENT]: 'document_specialist',
  [SPECIALIST_TYPES.PLATFORM]: 'platform_specialist',
};

export const SPECIALIST_LABELS = {
  [SPECIALIST_TYPES.PAYMENTS]: 'Payments Assistant',
  [SPECIALIST_TYPES.BANKING]: 'Banking Assistant',
  [SPECIALIST_TYPES.COMPLIANCE]: 'Compliance Assistant',
  [SPECIALIST_TYPES.INVESTMENT]: 'Investment Assistant',
  [SPECIALIST_TYPES.DOCUMENT]: 'Document Assistant',
  [SPECIALIST_TYPES.PLATFORM]: 'Platform Assistant',
};

const ROUTING_PATTERNS = [
  {
    type: SPECIALIST_TYPES.PAYMENTS,
    keywords: [
      'transfer', 'send money', 'payment', 'ach', 'wire', 'deposit', 'withdraw',
      'withdrawal', 'move money', 'fund', 'funding', 'pay', 'routing number',
      'account number', 'direct deposit', 'check deposit',
    ],
  },
  {
    type: SPECIALIST_TYPES.BANKING,
    keywords: [
      'declined', 'transaction', 'balance', 'fee', 'overdraft', 'statement',
      'account status', 'frozen', 'closed', 'dispute', 'charge', 'pending',
      'history', 'account issue', 'why was',
    ],
  },
  {
    type: SPECIALIST_TYPES.COMPLIANCE,
    keywords: [
      'kyc', 'verification', 'identity', 'id upload', 'document upload',
      'verification status', 'compliance', 'approved', 'rejected', 'application',
      'joint account', 'business account', 'ein',
    ],
  },
  {
    type: SPECIALIST_TYPES.INVESTMENT,
    keywords: [
      'investment', 'portfolio', 'trading', 'trade', 'stock', 'crypto',
      'forex', 'margin', 'equity', 'leverage', 'brokerage', 'securities',
    ],
  },
  {
    type: SPECIALIST_TYPES.DOCUMENT,
    keywords: [
      'letter', 'confirmation', 'reference letter', 'balance letter',
      'summary', 'statement', 'document', 'certificate', 'draft', 'proof of',
    ],
  },
  {
    type: SPECIALIST_TYPES.PLATFORM,
    keywords: [
      'diagnostic', 'health', 'system status', 'platform', 'uptime',
      'background job', 'scheduled', 'metric', 'audit log', 'configuration',
      'system report',
    ],
  },
];

/**
 * Classifies a user message and returns the appropriate specialist type.
 * Falls back to BANKING for general banking queries.
 * @param {string} message - The user's message text
 * @returns {string} - Specialist type from SPECIALIST_TYPES
 */
export function routeRequest(message) {
  const lower = message.toLowerCase();
  let bestMatch = SPECIALIST_TYPES.BANKING;
  let bestScore = 0;

  for (const pattern of ROUTING_PATTERNS) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(' ').length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern.type;
    }
  }

  return bestMatch;
}

/**
 * Returns the agent name for a given specialist type.
 * @param {string} specialistType - From SPECIALIST_TYPES
 * @returns {string} - Agent config name
 */
export function getAgentName(specialistType) {
  return SPECIALIST_AGENTS[specialistType] || SPECIALIST_AGENTS[SPECIALIST_TYPES.BANKING];
}

/**
 * Returns the human-readable label for a specialist type.
 * @param {string} specialistType - From SPECIALIST_TYPES
 * @returns {string} - Display label
 */
export function getSpecialistLabel(specialistType) {
  return SPECIALIST_LABELS[specialistType] || SPECIALIST_LABELS[SPECIALIST_TYPES.BANKING];
}

/**
 * Returns the case_type value for CaseWorkspace entity.
 * @param {string} specialistType - From SPECIALIST_TYPES
 * @returns {string} - Case type enum value
 */
export function getCaseType(specialistType) {
  return specialistType || SPECIALIST_TYPES.BANKING;
}