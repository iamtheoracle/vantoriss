/**
 * useMemberEntitlements — Re-exported from EntitlementContext for convenience.
 * Data is fetched once per session via EntitlementProvider; all consumers share
 * the same cached result, avoiding duplicate API calls.
 */
export { useMemberEntitlements } from '@/lib/EntitlementContext';
