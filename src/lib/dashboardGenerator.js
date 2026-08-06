// ============================================================
// VANTORIS Dashboard Generator
// Produces the dashboard layout from the Product Catalog and
// member entitlements.
// ============================================================

import { getAllProducts, getProductById, ProductStatus } from './productCatalog';
import {
  canAccessProduct,
  getMemberEntitlements,
  shouldShowApplicationFlow,
  shouldShowComingSoonBadge,
} from './entitlementService';

/**
 * Generate the complete dashboard layout for a member.
 *
 * Returns an ordered list of widget configs — each component on the
 * Home page should render based on these configs rather than its own
 * internal logic.
 *
 * @param {object} member  { user, accounts, application, tradingAccounts, heroBoxProfile }
 * @returns {Array<WidgetConfig>}
 */
export function generateDashboardLayout(member) {
  const widgets = [];

  for (const product of getAllProducts()) {
    if (product.status === ProductStatus.Disabled || product.status === ProductStatus.Legacy) {
      continue;
    }

    const config = generateWidgetConfig(member, product);
    if (config) widgets.push(config);
  }

  return widgets;
}

/**
 * Generate the widget configuration for a single product.
 *
 * Returns `null` if the product should not appear at all on the dashboard.
 *
 * @param {object} member
 * @param {object|string} product  Catalog product or product ID
 * @returns {WidgetConfig|null}
 */
export function generateWidgetConfig(member, product) {
  const p = typeof product === 'string' ? getProductById(product) : product;
  if (!p) return null;

  const active = canAccessProduct(member, p);
  const showApply = shouldShowApplicationFlow(member, p);
  const comingSoon = shouldShowComingSoonBadge(p);

  if (!active && !showApply && !comingSoon) return null;

  const { stage } = getMemberEntitlements(member, p);

  return {
    productId: p.id,
    widgetIds: active ? (p.dashboardWidgets ?? []) : [],
    type: active ? 'product' : showApply ? 'cta' : 'coming_soon',
    stage,
    product: p,
    // CTA card copy when member is eligible but not approved
    ctaLabel: active ? null : `Open ${p.shortName}`,
    ctaRoute: active ? null : '/apply',
    comingSoon,
    showApply,
  };
}

/**
 * Returns true if the dashboard should show a CTA card prompting the member
 * to open / apply for a product they don't yet have.
 *
 * @param {object} member
 * @param {object|string} product
 * @returns {boolean}
 */
export function shouldShowCTACard(member, product) {
  const p = typeof product === 'string' ? getProductById(product) : product;
  if (!p) return false;
  return shouldShowApplicationFlow(member, p) && !canAccessProduct(member, p);
}
