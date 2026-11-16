export const ACCOUNT_INTEGRITY_REVIEW_ROLES = Object.freeze([
  "admin",
  "administrator",
  "super_administrator",
  "executive",
  "operations_manager",
  "operations_officer",
  "finance_officer",
  "treasury_officer",
  "auditor",
]);

const reviewerRoleSet = new Set(ACCOUNT_INTEGRITY_REVIEW_ROLES);

export function canReviewAccountIntegrity(user) {
  return Boolean(user && typeof user.role === "string" && reviewerRoleSet.has(user.role));
}

/**
 * Accept only platform event metadata. Never use a client-supplied data object
 * as the source record; the handler must re-fetch the record by entity_id.
 *
 * An empty scheduled payload is the only non-entity invocation accepted.
 */
export function parseAccountIntegrityInvocation(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const hasEvent = Object.prototype.hasOwnProperty.call(payload, "event");
  if (!hasEvent) {
    return Object.keys(payload).length === 0 ? { kind: "scheduled" } : null;
  }

  if (payload.event === null) {
    return Object.keys(payload).every((key) => key === "event")
      ? { kind: "scheduled" }
      : null;
  }

  const event = payload.event;
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  if (typeof event.entity_id !== "string" || !event.entity_id.trim()) return null;

  const entityId = event.entity_id.trim();
  if (
    event.entity_name === "Transaction" &&
    (event.type === "create" || event.type === "update")
  ) {
    return {
      kind: "entity",
      entityName: "Transaction",
      entityId,
      sourceEvent: `Transaction.${event.type}`,
    };
  }

  if (event.entity_name === "Account" && event.type === "update") {
    return {
      kind: "entity",
      entityName: "Account",
      entityId,
      sourceEvent: "Account.update",
    };
  }

  return null;
}
