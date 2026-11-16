import {
  ACCOUNT_INTEGRITY_REVIEW_CAPABILITY,
  ACCOUNT_INTEGRITY_REVIEW_ROLES,
  canReviewAccountIntegrity,
  getLatestPostedTransactionPair,
  isScheduledIntegrityInvocation,
} from "../../functions/reconcileAccountIntegrity/index.ts";
import {
  getPermissionMatrix,
  userHasCapability,
} from "../../../src/lib/operationsAccess.js";

Deno.test("integrity reviewer roles exactly follow the authoritative capability matrix", () => {
  const expected = Object.keys(getPermissionMatrix()).filter(role =>
    userHasCapability({ role }, ACCOUNT_INTEGRITY_REVIEW_CAPABILITY)
  );

  if (JSON.stringify(ACCOUNT_INTEGRITY_REVIEW_ROLES) !== JSON.stringify(expected)) {
    throw new Error("Integrity reviewer roles diverge from operationsAccess capability matrix");
  }

  for (const role of expected) {
    if (!canReviewAccountIntegrity({ role })) {
      throw new Error(`Expected capability holder ${role} to review integrity alerts`);
    }
  }

  for (const role of [
    "user",
    "customer_support",
    "compliance_officer",
    "kyc_officer",
    "risk_officer",
    "it_administrator",
    "herobox_manager",
    "volunteer_manager",
    "shipping_manager",
    "investment_manager",
    "investment_officer",
  ]) {
    if (userHasCapability({ role }, ACCOUNT_INTEGRITY_REVIEW_CAPABILITY)) {
      throw new Error(`Test assumption invalid: ${role} has the review capability`);
    }
    if (canReviewAccountIntegrity({ role })) {
      throw new Error(`Unexpected integrity-review access for ${role}`);
    }
  }

  if (canReviewAccountIntegrity(null) || canReviewAccountIntegrity({})) {
    throw new Error("Unauthenticated or role-less users must be denied");
  }
});

Deno.test("scheduled/manual sweep accepts only an empty invocation object", () => {
  if (!isScheduledIntegrityInvocation({})) {
    throw new Error("Empty scheduled invocation was rejected");
  }

  for (const payload of [
    null,
    [],
    { event: { entity_name: "Transaction", type: "create", entity_id: "txn-1" } },
    { event: { entity_name: "Account", type: "update", entity_id: "account-1" } },
    { data: { account_id: "forged-account" } },
    { event: null },
    { user_id: "forged-operator" },
  ]) {
    if (isScheduledIntegrityInvocation(payload)) {
      throw new Error(`Untrusted event/request payload was accepted: ${JSON.stringify(payload)}`);
    }
  }
});


Deno.test("prior posted balance skips newer pending or failed transactions", () => {
  const olderPosted = { id: "posted-1", status: "completed", balance_after: 100 };
  const latestPosted = { id: "posted-2", status: "completed", balance_after: 125 };
  const pending = { id: "pending-1", status: "pending", balance_after: null };
  const result = getLatestPostedTransactionPair([pending, latestPosted, olderPosted]);

  if (result.latest !== latestPosted || result.prior !== olderPosted) {
    throw new Error("Expected latest and prior posted transactions in chronological order");
  }

  const empty = getLatestPostedTransactionPair([pending]);
  if (empty.latest !== null || empty.prior !== null) {
    throw new Error("Transactions without a posted balance snapshot must be ignored");
  }
});
