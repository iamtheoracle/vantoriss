import {
  ACCOUNT_INTEGRITY_REVIEW_ROLES,
  canReviewAccountIntegrity,
  parseAccountIntegrityInvocation,
} from "../../functions/reconcileAccountIntegrity/index.ts";

Deno.test("only roles with operations review capability can review integrity alerts", () => {
  for (const role of ACCOUNT_INTEGRITY_REVIEW_ROLES) {
    if (!canReviewAccountIntegrity({ role })) {
      throw new Error(`Expected ${role} to be an integrity reviewer`);
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
    if (canReviewAccountIntegrity({ role })) {
      throw new Error(`Unexpected integrity-review access for ${role}`);
    }
  }

  if (canReviewAccountIntegrity(null) || canReviewAccountIntegrity({})) {
    throw new Error("Unauthenticated or role-less users must be denied");
  }
});

Deno.test("accepts only supported Transaction and Account event metadata", () => {
  const transaction = parseAccountIntegrityInvocation({
    event: { entity_name: "Transaction", type: "create", entity_id: "txn-1" },
    data: { account_id: "forged-account" },
  });
  if (
    transaction?.kind !== "entity" ||
    transaction.entityName !== "Transaction" ||
    transaction.entityId !== "txn-1" ||
    transaction.sourceEvent !== "Transaction.create"
  ) {
    throw new Error("Transaction event metadata was not parsed correctly");
  }

  const account = parseAccountIntegrityInvocation({
    event: { entity_name: "Account", type: "update", entity_id: "account-1" },
  });
  if (
    account?.kind !== "entity" ||
    account.entityName !== "Account" ||
    account.entityId !== "account-1" ||
    account.sourceEvent !== "Account.update"
  ) {
    throw new Error("Account event metadata was not parsed correctly");
  }
});

Deno.test("rejects unsupported, incomplete, and malformed events", () => {
  for (const payload of [
    null,
    [],
    { data: { account_id: "account-1" } },
    { event: { entity_name: "Transaction", type: "delete", entity_id: "txn-1" } },
    { event: { entity_name: "Account", type: "create", entity_id: "account-1" } },
    { event: { entity_name: "User", type: "update", entity_id: "user-1" } },
    { event: { entity_name: "Transaction", type: "create", entity_id: "" } },
    { event: { entity_name: "Transaction", type: "create", entity_id: 123 } },
    { event: "forged" },
    { event: null, data: { account_id: "account-1" } },
  ]) {
    if (parseAccountIntegrityInvocation(payload) !== null) {
      throw new Error(`Unexpectedly accepted malformed payload: ${JSON.stringify(payload)}`);
    }
  }
});

Deno.test("accepts only an empty payload as the scheduled sweep invocation", () => {
  if (parseAccountIntegrityInvocation({})?.kind !== "scheduled") {
    throw new Error("Empty scheduled invocation was rejected");
  }
  if (parseAccountIntegrityInvocation({ event: null })?.kind !== "scheduled") {
    throw new Error("Null-event scheduled invocation was rejected");
  }
});
