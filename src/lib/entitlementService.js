// ============================================================
// VANTORIS Entitlement Service
// All visibility decisions flow through here.
// Never import productCatalog directly in UI components —
// always use this service instead.
// ============================================================

import {
  getAllProducts,
  getProductById,
  ProductStatus,
  WorkflowStage,
} from './productCatalog';
import { isActiveStage } from './workflowEngine';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Derive a member's current workflow stage for a given product from the
 * data structures returned by the Base44 backend.
 *
 * The backend stores product status on:
 *   - member.accounts[]    → account type maps to product id
 *   - member.application   → the onboarding application record
 *   - member.tradingAccounts[]
 *
 * We map those backend signals to WorkflowStage values here so the rest of
 * the UI never needs to know the shape of the raw API response.
 *
 * @param {object} member   { user, accounts, application, tradingAccounts, heroBoxProfile }
 * @param {object} product  Full catalog product entry
 * @returns {string}  One of WorkflowStage
 */
function deriveStage(member, product) {
  const { user, accounts = [], application, tradingAccounts = [], heroBoxProfile } = member ?? {};

  if (!user) return WorkflowStage.NotApplied;

  // ---- HeroBox ----
  if (product.id === 'herobox') {
    return heroBoxProfile ? WorkflowStage.Active : WorkflowStage.NotApplied;
  }

  // ---- Investment / Trading ----
  if (product.id === 'investment') {
    if (tradingAccounts.length > 0) return WorkflowStage.Active;
    if (application) {
      const appStatus = application.status?.toLowerCase();
      if (appStatus === 'approved') return WorkflowStage.Approved;
      if (['submitted', 'under_review', 'review'].includes(appStatus)) return WorkflowStage.UnderReview;
      if (['documents_pending', 'pending_documents'].includes(appStatus)) return WorkflowStage.DocumentsPending;
      if (appStatus === 'additional_info') return WorkflowStage.AdditionalInfoRequired;
      if (appStatus === 'rejected') return WorkflowStage.Rejected;
      if (appStatus === 'started') return WorkflowStage.ApplicationStarted;
    }
    return WorkflowStage.EligibleToApply;
  }

  // ---- Account-based products ----
  const accountTypeMap = {
    personal_checking: ['checking', 'personal_checking'],
    joint_checking: ['joint_checking', 'joint'],
    savings: ['savings'],
    business_account: ['business', 'business_checking'],
    credit_card: ['credit_card'],
    personal_loan: ['personal_loan', 'loan'],
    wealth_management: ['wealth', 'wealth_management'],
  };

  const matchTypes = accountTypeMap[product.id] ?? [];
  if (matchTypes.length > 0) {
    const matchedAccount = accounts.find(a =>
      matchTypes.includes((a.account_type || a.type || '').toLowerCase()),
    );
    if (matchedAccount) {
      const acctStatus = (matchedAccount.status || '').toLowerCase();
      if (acctStatus === 'suspended') return WorkflowStage.Suspended;
      if (acctStatus === 'closed') return WorkflowStage.Closed;
      return WorkflowStage.Active;
    }
  }

  // ---- Crypto ----
  if (product.id === 'crypto') {
    return WorkflowStage.EligibleToApply;
  }

  // Default: check application status for remaining products
  if (application) {
    const appStatus = application.status?.toLowerCase();
    if (['approved', 'active'].includes(appStatus)) return WorkflowStage.Approved;
    if (['submitted', 'under_review'].includes(appStatus)) return WorkflowStage.UnderReview;
    if (['pending', 'documents_pending'].includes(appStatus)) return WorkflowStage.DocumentsPending;
    if (appStatus === 'additional_info') return WorkflowStage.AdditionalInfoRequired;
    if (appStatus === 'rejected') return WorkflowStage.Rejected;
    if (appStatus === 'started') return WorkflowStage.ApplicationStarted;
    return WorkflowStage.EligibleToApply;
  }

  return WorkflowStage.NotApplied;
}

/**
 * Check basic eligibility for a product (age, country, etc.).
 * When we have full profile data this can be extended.
 *
 * @param {object} member
 * @param {object} product
 * @returns {boolean}
 */
function meetsEligibility(member, product) {
  if (!member?.user) return false;
  if (product.status === ProductStatus.Disabled) return false;
  // Legacy products are not open for new applicants
  if (product.status === ProductStatus.Legacy) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a member's complete entitlement status for a single product.
 *
 * @param {object} member  { user, accounts, application, tradingAccounts, heroBoxProfile }
 * @param {object|string} product  Catalog product object or product ID string
 * @returns {{ stage: string, permissions: string[], features: string[], limits: object, eligible: boolean }}
 */
export function getMemberEntitlements(member, product) {
  const p = typeof product === 'string' ? getProductById(product) : product;
  if (!p) return { stage: WorkflowStage.NotApplied, permissions: [], features: [], limits: {}, eligible: false };

  const stage = deriveStage(member, p);
  const active = isActiveStage(stage);
  const eligible = meetsEligibility(member, p);

  return {
    stage,
    permissions: active ? (p.memberEntitlements?.permissions ?? []) : [],
    features: active ? (p.memberEntitlements?.features ?? []) : [],
    limits: active ? (p.memberEntitlements?.limits ?? {}) : {},
    eligible,
    product: p,
  };
}

/**
 * Return true if the member can access (view/use) the product right now.
 *
 * @param {object} member
 * @param {object|string} product
 * @returns {boolean}
 */
export function canAccessProduct(member, product) {
  const { stage } = getMemberEntitlements(member, product);
  return isActiveStage(stage);
}

/**
 * Return all products the member either owns or is eligible to apply for.
 *
 * @param {object} member
 * @returns {Array<{ product: object, stage: string, eligible: boolean }>}
 */
export function getVisibleProducts(member) {
  return getAllProducts()
    .filter(p => p.status !== ProductStatus.Disabled && p.status !== ProductStatus.Legacy)
    .map(p => {
      const { stage, eligible } = getMemberEntitlements(member, p);
      return { product: p, stage, eligible };
    })
    .filter(({ stage, eligible }) => {
      // Always show products member actively has
      if (isActiveStage(stage)) return true;
      // Show products that are in-flight (applied for)
      if (
        [
          WorkflowStage.EligibleToApply,
          WorkflowStage.ApplicationStarted,
          WorkflowStage.DocumentsPending,
          WorkflowStage.UnderReview,
          WorkflowStage.AdditionalInfoRequired,
          WorkflowStage.Approved,
        ].includes(stage)
      )
        return true;
      // Show products member is eligible for (to prompt application)
      return eligible;
    });
}

/**
 * Return dashboard widget IDs for all products the member actively has.
 *
 * @param {object} member
 * @returns {string[]}
 */
export function getVisibleWidgets(member) {
  return getAllProducts()
    .filter(p => canAccessProduct(member, p))
    .flatMap(p => p.dashboardWidgets ?? []);
}

/**
 * Return navigation items for the member's active products.
 *
 * @param {object} member
 * @returns {Array<{ label: string, route: string, icon: string, productId: string }>}
 */
export function getVisibleNavigationItems(member) {
  return getAllProducts()
    .filter(p => p.navigation?.mainMenu && canAccessProduct(member, p))
    .map(p => ({
      label: p.navigation.menuLabel,
      route: p.navigation.route,
      icon: p.navigation.icon,
      productId: p.id,
    }));
}

/**
 * Return quick action IDs for all products the member actively has.
 *
 * @param {object} member
 * @returns {string[]}
 */
export function getVisibleQuickActions(member) {
  return [
    ...new Set(
      getAllProducts()
        .filter(p => canAccessProduct(member, p))
        .flatMap(p => p.quickActions ?? []),
    ),
  ];
}

/**
 * Returns true if the member is eligible but hasn't yet been approved —
 * meaning the UI should show an "Apply Now" or "Open Account" CTA.
 *
 * @param {object} member
 * @param {object|string} product
 * @returns {boolean}
 */
export function shouldShowApplicationFlow(member, product) {
  const p = typeof product === 'string' ? getProductById(product) : product;
  if (!p) return false;
  const { stage, eligible } = getMemberEntitlements(member, p);
  if (!eligible) return false;
  return [
    WorkflowStage.NotApplied,
    WorkflowStage.EligibleToApply,
    WorkflowStage.Rejected,
  ].includes(stage);
}

/**
 * Returns true if the product should display a "Coming Soon" badge.
 *
 * @param {object|string} product
 * @returns {boolean}
 */
export function shouldShowComingSoonBadge(product) {
  const p = typeof product === 'string' ? getProductById(product) : product;
  return p?.status === ProductStatus.ComingSoon;
}

/**
 * Return the safe navigation route for a product.
 * If the member cannot access the product, returns the fallback route (dashboard).
 *
 * @param {object} member
 * @param {object|string} product
 * @param {string} [fallback='/']
 * @returns {string}
 */
export function getProductRoute(member, product, fallback = '/') {
  const p = typeof product === 'string' ? getProductById(product) : product;
  if (!p) return fallback;
  if (canAccessProduct(member, p)) return p.navigation?.route ?? fallback;
  return fallback;
}
