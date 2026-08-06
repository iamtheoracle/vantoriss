import React from 'react';
import { useMemberEntitlements } from '@/hooks/useMemberEntitlements';
import FeatureGate from '@/components/vantoris/FeatureGate';
import VantorisLoading from '@/components/vantoris/system/VantorisLoading';

/**
 * EntitlementRoute — Protects pages that require a specific product entitlement.
 *
 * Usage in App.jsx:
 *   <Route
 *     path="/investments"
 *     element={
 *       <EntitlementRoute product="investments" featureName="Investments">
 *         <Investments />
 *       </EntitlementRoute>
 *     }
 *   />
 *
 * If the member is not entitled, renders the FeatureGate upsell/onboarding
 * experience instead of the protected page. This prevents direct-URL access to
 * features the member hasn't unlocked.
 */
export default function EntitlementRoute({ product, featureName, children }) {
  const { loading, entitlements } = useMemberEntitlements();

  if (loading) {
    return <VantorisLoading className="h-96" />;
  }

  const hasAccess = entitlements?.products?.[product] ?? false;

  if (!hasAccess) {
    // Render the FeatureGate upsell/onboarding experience only.
    // The protected children are NOT passed in — FeatureGate renders its own UI.
    return <FeatureGate featureName={featureName ?? product} />;
  }

  return children;
}
