// ============================================================
// VANTORIS Application Workflow Engine
// Manages product application state transitions.
// All logic reads from the Product Catalog — do not duplicate
// transition rules here.
// ============================================================

import { WorkflowStage } from './productCatalog';

// Human-readable labels for each workflow stage
const STAGE_LABELS = {
  [WorkflowStage.NotApplied]: 'Not Applied',
  [WorkflowStage.EligibleToApply]: 'Eligible to Apply',
  [WorkflowStage.ApplicationStarted]: 'Application Started',
  [WorkflowStage.DocumentsPending]: 'Documents Pending',
  [WorkflowStage.UnderReview]: 'Under Review',
  [WorkflowStage.AdditionalInfoRequired]: 'Additional Information Required',
  [WorkflowStage.Approved]: 'Approved',
  [WorkflowStage.Rejected]: 'Rejected',
  [WorkflowStage.Active]: 'Active',
  [WorkflowStage.Suspended]: 'Suspended',
  [WorkflowStage.Closed]: 'Closed',
};

// Human-readable descriptions for each workflow stage
const STAGE_DESCRIPTIONS = {
  [WorkflowStage.NotApplied]: 'You have not yet applied for this product.',
  [WorkflowStage.EligibleToApply]: 'You meet the requirements and can apply now.',
  [WorkflowStage.ApplicationStarted]: 'Your application is in progress.',
  [WorkflowStage.DocumentsPending]: 'Please upload the required documents to continue.',
  [WorkflowStage.UnderReview]: 'Our team is reviewing your application.',
  [WorkflowStage.AdditionalInfoRequired]: 'We need additional information to proceed.',
  [WorkflowStage.Approved]: 'Your application has been approved.',
  [WorkflowStage.Rejected]: 'Your application was not approved at this time.',
  [WorkflowStage.Active]: 'This product is active and ready to use.',
  [WorkflowStage.Suspended]: 'This product has been temporarily suspended.',
  [WorkflowStage.Closed]: 'This product has been closed.',
};

// Actions a member must take at each stage to advance
const STAGE_REQUIRED_ACTIONS = {
  [WorkflowStage.NotApplied]: ['Check eligibility requirements'],
  [WorkflowStage.EligibleToApply]: ['Start your application'],
  [WorkflowStage.ApplicationStarted]: ['Complete and submit the application form'],
  [WorkflowStage.DocumentsPending]: ['Upload all required documents'],
  [WorkflowStage.UnderReview]: ['Wait for our team to complete the review'],
  [WorkflowStage.AdditionalInfoRequired]: ['Submit the requested additional information or documents'],
  [WorkflowStage.Approved]: ['Accept the terms and activate your product'],
  [WorkflowStage.Rejected]: ['Contact support if you believe this is an error'],
  [WorkflowStage.Active]: [],
  [WorkflowStage.Suspended]: ['Contact support to reinstate your account'],
  [WorkflowStage.Closed]: [],
};

/**
 * Determine whether transitioning a product from `currentStage` to
 * `targetStage` is a valid move according to the catalog's workflow rules.
 *
 * @param {object} product     Full product definition from productCatalog.js
 * @param {string} currentStage
 * @param {string} targetStage
 * @returns {boolean}
 */
export function canTransition(product, currentStage, targetStage) {
  if (!product?.workflowTransitions) return false;
  const allowed = product.workflowTransitions[currentStage];
  return Array.isArray(allowed) && allowed.includes(targetStage);
}

/**
 * Return all valid next stages from `currentStage` for the given product.
 *
 * @param {object} product
 * @param {string} currentStage
 * @returns {string[]}
 */
export function getNextStages(product, currentStage) {
  if (!product?.workflowTransitions) return [];
  return product.workflowTransitions[currentStage] ?? [];
}

/**
 * Return a human-readable label for a workflow stage.
 *
 * @param {string} stage
 * @returns {string}
 */
export function getStageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage;
}

/**
 * Return a human-readable description for a workflow stage.
 *
 * @param {string} stage
 * @returns {string}
 */
export function getStageDescription(stage) {
  return STAGE_DESCRIPTIONS[stage] ?? '';
}

/**
 * Return the list of actions a member must take to advance beyond the
 * given stage.
 *
 * @param {object} product  (reserved for future product-specific overrides)
 * @param {string} stage
 * @returns {string[]}
 */
export function getRequiredActions(product, stage) {
  if (product?.requiredActionsOverride?.[stage]) {
    return product.requiredActionsOverride[stage];
  }
  return STAGE_REQUIRED_ACTIONS[stage] ?? [];
}

/**
 * Convenience: is the product considered "owned" and live for the member?
 *
 * @param {string} stage
 * @returns {boolean}
 */
export function isActiveStage(stage) {
  return stage === WorkflowStage.Active;
}

/**
 * Convenience: has the member's application been approved (but not yet activated)?
 *
 * @param {string} stage
 * @returns {boolean}
 */
export function isApprovedStage(stage) {
  return stage === WorkflowStage.Approved;
}

/**
 * Convenience: is the application still in-flight (any mid-funnel stage)?
 *
 * @param {string} stage
 * @returns {boolean}
 */
export function isInProgressStage(stage) {
  return [
    WorkflowStage.ApplicationStarted,
    WorkflowStage.DocumentsPending,
    WorkflowStage.UnderReview,
    WorkflowStage.AdditionalInfoRequired,
  ].includes(stage);
}

/**
 * Convenience: has the application process ended (terminal state)?
 *
 * @param {string} stage
 * @returns {boolean}
 */
export function isTerminalStage(stage) {
  return [WorkflowStage.Rejected, WorkflowStage.Closed].includes(stage);
}
