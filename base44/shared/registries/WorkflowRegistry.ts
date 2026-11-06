/**
 * Versioned workflow definition registry.
 * Definitions describe approved paths; they do not themselves execute operations.
 */
const definitions = new Map();

const builtIns = [
  {
    name: 'assistant_recommendation_review',
    version: '1.0.0',
    description: 'Route an AVA action-impacting recommendation to an authorized reviewer.',
    enabled: true,
    approvalRequired: true,
    requiredApproverRoles: ['admin', 'administrator', 'super_administrator', 'compliance_officer'],
    steps: ['prepare', 'validate_evidence', 'staff_review', 'approval_decision', 'authorized_execution', 'verify_result', 'audit'],
    executionEnabled: false,
  },
  {
    name: 'member_application_review',
    version: '1.0.0',
    description: 'Review a member application and its verification requirements.',
    enabled: true,
    approvalRequired: true,
    requiredApproverRoles: ['admin', 'administrator', 'super_administrator', 'kyc_officer', 'compliance_officer'],
    steps: ['submitted', 'identity_review', 'compliance_review', 'approval_decision', 'account_provisioning', 'member_notification', 'audit'],
    executionEnabled: false,
  },
  {
    name: 'transfer_request',
    version: '1.0.0',
    description: 'Prepare, review and submit a transfer only through a verified provider workflow.',
    enabled: true,
    approvalRequired: true,
    requiredApproverRoles: ['admin', 'administrator', 'super_administrator', 'finance_officer', 'treasury_officer'],
    steps: ['request_received', 'beneficiary_validation', 'risk_review', 'approval_decision', 'provider_submission', 'settlement_reconciliation', 'audit'],
    executionEnabled: false,
  },
  {
    name: 'card_issuance',
    version: '1.0.0',
    description: 'Prepare card issuance after issuer connectivity and member eligibility are verified.',
    enabled: true,
    approvalRequired: true,
    requiredApproverRoles: ['admin', 'administrator', 'super_administrator', 'operations_manager'],
    steps: ['member_eligibility', 'account_validation', 'issuer_readiness', 'approval_decision', 'issuer_submission', 'activation_verification', 'audit'],
    executionEnabled: false,
  },
  {
    name: 'investment_withdrawal',
    version: '1.0.0',
    description: 'Review investment withdrawal requests before provider-backed execution.',
    enabled: true,
    approvalRequired: true,
    requiredApproverRoles: ['admin', 'administrator', 'super_administrator', 'finance_officer', 'investment_officer'],
    steps: ['request_received', 'portfolio_validation', 'risk_review', 'approval_decision', 'provider_execution', 'settlement_verification', 'audit'],
    executionEnabled: false,
  },
];

for (const definition of builtIns) {
  definitions.set(`${definition.name}@${definition.version}`, Object.freeze(definition));
}

function keyFor(name, version) {
  return version ? `${name}@${version}` : name;
}

export const WorkflowRegistry = {
  register(definition) {
    if (!definition?.name || !definition?.version || !Array.isArray(definition.steps) || definition.steps.length === 0) {
      throw new Error('Workflow definitions require a name, version and ordered steps');
    }
    const key = keyFor(definition.name, definition.version);
    definitions.set(key, Object.freeze({ ...definition, steps: [...definition.steps] }));
    return definitions.get(key);
  },

  get(name, version) {
    if (version) return definitions.get(keyFor(name, version)) || null;
    return this.list().filter(item => item.name === name).sort((a, b) => b.version.localeCompare(a.version))[0] || null;
  },

  list() {
    return Array.from(definitions.values()).map(item => ({ ...item, steps: [...item.steps] }));
  },

  resolve(name, version) {
    const definition = this.get(name, version);
    return definition ? { ...definition, steps: [...definition.steps] } : null;
  },

  remove(name, version) {
    if (version) return definitions.delete(keyFor(name, version));
    let removed = false;
    for (const key of definitions.keys()) {
      if (key.startsWith(`${name}@`)) removed = definitions.delete(key) || removed;
    }
    return removed;
  },
};
