import { eventBus } from './eventBus.ts';
import { logger } from './logger.ts';

export function createTrust(registries) {
  // DENY by default — no implicit allow policy
  const DEFAULT_DECISION = { effect: 'deny', reason: 'No matching allow policy found' };

  return {
    async authorize(request) {
      logger.debug('Trust evaluating request', { requestId: request.id, userId: request.userId });

      // Get policies sorted by priority (highest first)
      const policies = registries.policy.list();

      for (const policy of policies) {
        if (this._matches(policy, request)) {
          const decision = policy.effect === 'allow'
            ? { effect: 'allow', policy: policy.name }
            : { effect: 'deny', reason: `Denied by policy: ${policy.name}` };

          await this._audit(request, decision.effect, policy.name);
          return decision;
        }
      }

      // No matching policy → DENY by default
      await this._audit(request, 'deny', 'default_deny');
      return DEFAULT_DECISION;
    },

    _matches(policy, request) {
      // Check authentication condition
      if (policy.conditions?.authenticated === true && !request.userId) return false;

      // Check role condition
      if (policy.conditions?.role && request.context?.userRole !== policy.conditions.role) return false;

      // Empty and wildcard action lists are never grants. Every requested
      // capability must be explicitly named by the policy.
      if (!Array.isArray(policy.actions) || policy.actions.length === 0) return false;
      if (policy.actions.includes('*')) return false;
      if (!Array.isArray(request.capabilities) || request.capabilities.length === 0) return false;
      return request.capabilities.every(capability => policy.actions.includes(capability));
    },

    async _audit(request, decision, policyName) {
      eventBus.publish({
        type: 'security', source: 'trust',
        payload: {
          requestId: request.id,
          userId: request.userId,
          decision,
          policy: policyName,
        },
      });
    },
  };
}

// Deprecated compatibility export; new AVCU code should use createTrust.
export const createGuardian = createTrust;
