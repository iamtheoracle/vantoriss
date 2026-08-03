import { logger } from './logger.ts';

/**
 * Specialist Assistant Registry
 *
 * Each specialist is an experienced banking colleague with a focused domain.
 * The unified assistant (Bud) routes member requests to the appropriate specialist
 * transparently — the member never chooses which assistant to use.
 *
 * Specialists may collaborate: when a request spans multiple domains, the primary
 * specialist prepares the recommendation and collaborating specialists contribute notes.
 *
 * No recommendation becomes an action until staff approves it.
 */

export const SPECIALISTS = {
  payments: {
    id: 'payments',
    name: 'Payments Assistant',
    description: 'Transfers, ACH, wires, payment processing',
    keywords: ['transfer', 'payment', 'ach', 'wire', 'send money', 'move money', 'pay ', 'withdrawal', 'zelle', 'check deposit'],
    required_approver: 'admin',
    promptContext: 'You are the Payments Assistant. You handle transfers, ACH, wires, and payment processing with precision and policy compliance.',
  },
  banking: {
    id: 'banking',
    name: 'Banking Assistant',
    description: 'Accounts, balances, transactions, statements',
    keywords: ['account', 'balance', 'transaction', 'statement', 'checking', 'savings', 'history', 'ledger'],
    required_approver: 'admin',
    promptContext: 'You are the Banking Assistant. You handle account inquiries, transaction history, balance confirmations, and statement generation.',
  },
  compliance: {
    id: 'compliance',
    name: 'Compliance Assistant',
    description: 'KYC, identity verification, regulatory matters',
    keywords: ['kyc', 'identity', 'verification', 'compliance', 'regulatory', 'aml', 'sanctions', 'beneficial owner', 'screening'],
    required_approver: 'compliance',
    promptContext: 'You are the Compliance Assistant. You handle KYC verification, identity checks, regulatory compliance, and AML screening with strict adherence to policy.',
  },
  investment: {
    id: 'investment',
    name: 'Investment Assistant',
    description: 'Portfolios, trading, market insights',
    keywords: ['investment', 'portfolio', 'trade', 'trading', 'stock', 'crypto', 'forex', 'market', 'equity', 'bond', 'etf'],
    required_approver: 'admin',
    promptContext: 'You are the Investment Assistant. You provide portfolio insights, trading analysis, and market context — always with appropriate risk disclosures.',
  },
  document: {
    id: 'document',
    name: 'Document Assistant',
    description: 'Letters, statements, document generation',
    keywords: ['letter', 'confirmation letter', 'draft', 'generate document', 'balance letter', 'reference letter', 'pdf'],
    required_approver: 'admin',
    promptContext: 'You are the Document Assistant. You draft letters, generate confirmation documents, and prepare formal correspondence for staff review.',
  },
  credit: {
    id: 'credit',
    name: 'Credit Assistant',
    description: 'Loans, credit, lending decisions',
    keywords: ['loan', 'credit', 'lending', 'borrow', 'mortgage', 'interest rate', 'credit score', 'credit limit', 'financing'],
    required_approver: 'admin',
    promptContext: 'You are the Credit Assistant. You assess credit requests, evaluate lending risk, and prepare loan recommendations with supporting evidence.',
  },
  fraud: {
    id: 'fraud',
    name: 'Fraud Assistant',
    description: 'Disputes, suspicious activity, security',
    keywords: ['fraud', 'dispute', 'suspicious', 'unauthorized', 'security', 'breach', 'compromised', 'chargeback', 'stolen'],
    required_approver: 'admin',
    promptContext: 'You are the Fraud Assistant. You investigate disputes, identify suspicious activity, and recommend protective actions with urgency.',
  },
  platform: {
    id: 'platform',
    name: 'Platform Assistant',
    description: 'System diagnostics, configuration, administration',
    keywords: ['system', 'diagnostic', 'configuration', 'platform', 'health', 'status', 'integration', 'api', 'logs'],
    required_approver: 'admin',
    promptContext: 'You are the Platform Assistant. You handle system diagnostics, configuration inquiries, and platform operations for staff.',
  },
};

/**
 * Routes a member message to the appropriate specialist.
 * Returns the primary specialist, confidence level, and any collaborating specialists.
 */
export function routeSpecialist(message: string) {
  const lower = message.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [key, spec] of Object.entries(SPECIALISTS)) {
    scores[key] = 0;
    for (const kw of spec.keywords) {
      if (lower.includes(kw)) scores[key] += 1;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topSpecialist, topScore] = sorted[0];

  // No keyword match — default to banking with low confidence
  if (topScore === 0) {
    logger.info('Specialist routing: no keyword match, defaulting to banking', { message: message.substring(0, 80) });
    return {
      specialist: 'banking',
      specialistName: SPECIALISTS.banking.name,
      confidence: 'low' as const,
      collaborators: [] as string[],
      isActionImpacting: false,
    };
  }

  // Collaborators: other specialists that also scored
  const collaborators = sorted
    .filter(([key, score]) => score > 0 && key !== topSpecialist)
    .map(([key]) => key);

  const confidence: 'low' | 'medium' | 'high' = topScore >= 3 ? 'high' : topScore >= 2 ? 'medium' : 'low';

  // Determine if this is action-impacting (requires approval before execution)
  const actionImpactingSpecialists = ['payments', 'compliance', 'credit', 'fraud', 'document'];
  const isActionImpacting = actionImpactingSpecialists.includes(topSpecialist) || confidence === 'low';

  logger.info('Specialist routing complete', {
    specialist: topSpecialist,
    confidence,
    collaborators: collaborators.length,
  });

  return {
    specialist: topSpecialist,
    specialistName: SPECIALISTS[topSpecialist].name,
    confidence,
    collaborators,
    isActionImpacting,
  };
}

/**
 * Determines whether a recommendation should be escalated based on spec rules:
 * - Confidence is low
 * - Conflicting evidence exists (multiple specialists with equal scores)
 * - Additional authority is required
 */
export function shouldEscalate(routing: ReturnType<typeof routeSpecialist>, hasConflictingEvidence: boolean): boolean {
  if (routing.confidence === 'low') return true;
  if (hasConflictingEvidence && routing.collaborators.length > 0) return true;
  return false;
}

export function getSpecialistPrompt(specialistId: string): string {
  return SPECIALISTS[specialistId]?.promptContext || SPECIALISTS.banking.promptContext;
}

export function getRequiredApprover(specialistId: string): string {
  return SPECIALISTS[specialistId]?.required_approver || 'admin';
}