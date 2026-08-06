// ============================================================
// VANTORIS Route Protection
// Wrap product routes to prevent unauthorized access via URL.
// ============================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canAccessProduct, getMemberEntitlements } from './entitlementService';
import { getProductById, WorkflowStage } from './productCatalog';
import { isInProgressStage } from './workflowEngine';

// ---------------------------------------------------------------------------
// React component wrapper
// ---------------------------------------------------------------------------

/**
 * Higher-order component that guards a product route.
 *
 * If the member does not have an active entitlement for `productId`, they are
 * redirected to `redirectTo` (default: '/').
 *
 * Usage:
 *   <Route path="/investments" element={<WithProductAccess productId="investment"><Investments /></WithProductAccess>} />
 *
 * @param {{ productId: string, redirectTo?: string, member: object, children: React.ReactNode }} props
 */
export function WithProductAccess({ productId, redirectTo = '/', member, children }) {
  const navigate = useNavigate();
  const product = getProductById(productId);

  const allowed = product ? canAccessProduct(member, product) : false;

  useEffect(() => {
    if (!allowed) {
      navigate(redirectTo, { replace: true });
    }
  }, [allowed, navigate, redirectTo]);

  if (!allowed) return null;
  return children;
}

// ---------------------------------------------------------------------------
// Imperative check
// ---------------------------------------------------------------------------

/**
 * Validate that `member` can access `productId`. Returns `true` if allowed.
 * Throws an Error with a descriptive message if access is denied.
 *
 * Useful in data-loader functions or API middleware.
 *
 * @param {object} member
 * @param {string} productId
 * @returns {true}
 * @throws {Error}
 */
export function checkProductAccess(member, productId) {
  const product = getProductById(productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);

  const { stage } = getMemberEntitlements(member, product);

  if (canAccessProduct(member, product)) return true;

  if (isInProgressStage(stage)) {
    throw new Error(`Your application for ${product.name} is currently ${stage}. Access will be granted once approved.`);
  }

  if (stage === WorkflowStage.Rejected) {
    throw new Error(`Your application for ${product.name} was not approved. Please contact support.`);
  }

  throw new Error(`You do not have access to ${product.name}. Please apply to get started.`);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Hook that verifies the member has active access to `productId`.
 * Redirects to `redirectTo` if access is denied.
 *
 * @param {string} productId
 * @param {object} member
 * @param {string} [redirectTo='/']
 * @returns {{ allowed: boolean, stage: string|null }}
 */
export function useProductAccess(productId, member, redirectTo = '/') {
  const navigate = useNavigate();
  const product = getProductById(productId);
  const entitlement = product ? getMemberEntitlements(member, product) : null;
  const allowed = entitlement ? canAccessProduct(member, product) : false;

  useEffect(() => {
    if (product && !allowed) {
      navigate(redirectTo, { replace: true });
    }
  }, [allowed, product, navigate, redirectTo]);

  return { allowed, stage: entitlement?.stage ?? null };
}
