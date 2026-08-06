// ============================================================
// VANTORIS Navigation Generator
// Builds navigation structures from the Product Catalog.
// ============================================================

import { getAllProducts, getProductById, ProductStatus } from './productCatalog';
import { canAccessProduct, shouldShowApplicationFlow } from './entitlementService';

/**
 * Build the main bottom-navigation items for a member.
 * Returns only products the member actively owns that have `mainMenu: true`.
 *
 * @param {object} member  { user, accounts, application, tradingAccounts, heroBoxProfile }
 * @returns {Array<{ label: string, route: string, icon: string, productId: string }>}
 */
export function generateMainNavigation(member) {
  return getAllProducts()
    .filter(
      p =>
        p.navigation?.mainMenu &&
        p.status !== ProductStatus.Disabled &&
        canAccessProduct(member, p),
    )
    .map(p => ({
      label: p.navigation.menuLabel,
      route: p.navigation.route,
      icon: p.navigation.icon,
      productId: p.id,
    }));
}

/**
 * Build the "More" section items for a member.
 * Includes:
 *   - Products the member owns (`moreSection: true`)
 *   - Eligible but not-yet-applied products → shown with "Apply Now" action
 *   - Coming Soon products → shown with badge
 *
 * @param {object} member
 * @returns {Array<{ label: string, route: string|null, icon: string, productId: string, category: string, status: string, showApply: boolean, comingSoon: boolean }>}
 */
export function generateMoreSectionItems(member) {
  return getAllProducts()
    .filter(p => p.status !== ProductStatus.Disabled && p.status !== ProductStatus.Legacy)
    .filter(
      p =>
        p.navigation?.moreSection ||
        canAccessProduct(member, p) ||
        shouldShowApplicationFlow(member, p) ||
        p.status === ProductStatus.ComingSoon,
    )
    .map(p => ({
      label: p.navigation?.menuLabel ?? p.shortName,
      route: canAccessProduct(member, p) ? (p.navigation?.route ?? null) : null,
      icon: p.navigation?.icon ?? p.icon,
      productId: p.id,
      category: p.category,
      status: p.status,
      showApply: shouldShowApplicationFlow(member, p),
      comingSoon: p.status === ProductStatus.ComingSoon,
      description: p.description,
    }));
}

/**
 * Group More-section items by product category.
 *
 * @param {object} member
 * @returns {Record<string, Array>}  category → items[]
 */
export function generateMoreSectionByCategory(member) {
  const items = generateMoreSectionItems(member);
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

/**
 * Generate a breadcrumb trail for a given product + optional sub-page.
 *
 * @param {string} productId
 * @param {{ subPage?: string }} [context]
 * @returns {Array<{ label: string, route: string|null }>}
 */
export function generateBreadcrumbs(productId, context = {}) {
  const product = getProductById(productId);
  const crumbs = [{ label: 'Home', route: '/' }];
  if (product) {
    crumbs.push({ label: product.shortName, route: product.navigation?.route ?? null });
  }
  if (context.subPage) {
    crumbs.push({ label: context.subPage, route: null });
  }
  return crumbs;
}
