import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

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

const TOLERANCE = 0.01;
const ACCOUNT_UPDATE_GRACE_MS = 120000;

async function handleRequest(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const { createClientFromRequest } = await import("npm:@base44/sdk@0.8.31");
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!canReviewAccountIntegrity(user)) {
      return Response.json({ error: "Account integrity review access is required." }, { status: 403 });
    }

    const payload = await req.json().catch(() => null);
    const invocation = parseAccountIntegrityInvocation(payload);
    if (!invocation) {
      return Response.json({ error: "Unsupported or malformed integrity event." }, { status: 400 });
    }

    const service = base44.asServiceRole;
    const now = new Date();

    async function reconcileAccount(accountId, sourceEvent) {
      if (!accountId) return { skipped: true };
      const account = await service.entities.Account.get(accountId).catch(() => null);
      if (!account) return { skipped: true, reason: "account_not_found" };

      const transactions = await service.entities.Transaction.filter(
        { account_id: accountId }, "-created_date", 20
      );
      const latest = (Array.isArray(transactions) ? transactions : []).find(txn =>
        !["pending", "failed", "reversed"].includes(txn.status || "completed") &&
        txn.balance_after !== null && txn.balance_after !== undefined &&
        Number.isFinite(Number(txn.balance_after))
      );
      if (!latest) return { skipped: true, reason: "no_posted_balance_snapshot" };

      // An account write can arrive just before its matching transaction record.
      // Give that pair a short grace period; the scheduled sweep is the backstop.
      const accountUpdated = new Date(account.updated_date || 0).getTime();
      const latestTxnCreated = new Date(latest.created_date || 0).getTime();
      if (sourceEvent === "Account.update" && accountUpdated > latestTxnCreated &&
          Date.now() - accountUpdated < ACCOUNT_UPDATE_GRACE_MS) {
        return { skipped: true, reason: "account_update_grace_period" };
      }
      if (sourceEvent.startsWith("Transaction.") && latestTxnCreated > accountUpdated &&
          Date.now() - latestTxnCreated < ACCOUNT_UPDATE_GRACE_MS) {
        return { skipped: true, reason: "transaction_update_grace_period" };
      }

      const actual = Number(account.balance);
      const expected = Number(latest.balance_after);
      if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
        return { skipped: true, reason: "non_numeric_balance" };
      }

      const checks = [];
      const accountDifference = Math.round((actual - expected) * 100) / 100;
      if (Math.abs(accountDifference) > TOLERANCE) {
        checks.push("Account balance " + actual.toFixed(2) +
          " differs from the latest completed transaction balance_after " +
          expected.toFixed(2) + " (difference " + accountDifference.toFixed(2) + ").");
      }

      const prior = (Array.isArray(transactions) ? transactions : []).slice(1).find(txn =>
        !["pending", "failed", "reversed"].includes(txn.status || "completed") &&
        txn.balance_after !== null && txn.balance_after !== undefined &&
        Number.isFinite(Number(txn.balance_after))
      );
      let difference = accountDifference;
      let expectedRecordedBalance = expected;
      let actualRecordedBalance = actual;
      if (prior && !["opening_balance", "transfer"].includes(latest.type) &&
          Number.isFinite(Number(latest.amount))) {
        const arithmeticExpected = Number(prior.balance_after) + Number(latest.amount);
        const arithmeticDifference = Math.round((expected - arithmeticExpected) * 100) / 100;
        if (Math.abs(arithmeticDifference) > TOLERANCE) {
          checks.push("Transaction running-balance mismatch: previous posted balance " +
            Number(prior.balance_after).toFixed(2) + " plus transaction amount " +
            Number(latest.amount).toFixed(2) + " should be " +
            arithmeticExpected.toFixed(2) + ", but the transaction records " +
            expected.toFixed(2) + ".");
          if (Math.abs(accountDifference) <= TOLERANCE) {
            difference = arithmeticDifference;
            expectedRecordedBalance = arithmeticExpected;
            actualRecordedBalance = expected;
          }
        }
      }

      const openAlerts = await service.entities.IntegrityAlert.filter(
        { account_id: accountId, status: "open" }, "-created_date", 10
      );

      if (checks.length === 0) {
        for (const alert of (openAlerts || [])) {
          await service.entities.IntegrityAlert.update(alert.id, {
            status: "resolved",
            resolved_at: now.toISOString(),
            last_seen_at: now.toISOString()
          });
        }
        return { account_id: accountId, status: "balanced" };
      }

      const fingerprint = accountId + ":account-ledger-integrity";
      const details = checks.join(" ");
      const existing = (openAlerts || []).find(alert => alert.fingerprint === fingerprint);
      if (existing) {
        await service.entities.IntegrityAlert.update(existing.id, {
          actual_balance: actualRecordedBalance,
          expected_balance: expectedRecordedBalance,
          difference,
          details,
          last_seen_at: now.toISOString(),
          source_event: sourceEvent
        });
        return { account_id: accountId, status: "alert_updated" };
      }

      const lastFour = String(account.account_number || "").slice(-4);
      const created = await service.entities.IntegrityAlert.create({
        account_id: accountId,
        member_user_id: account.user_id || "",
        fingerprint,
        title: "Account balance discrepancy" + (lastFour ? " · •••• " + lastFour : ""),
        details,
        severity: "high",
        status: "open",
        expected_balance: expectedRecordedBalance,
        actual_balance: actualRecordedBalance,
        difference,
        source_event: sourceEvent,
        first_seen_at: now.toISOString(),
        last_seen_at: now.toISOString()
      });

      const users = await service.entities.User.list("-created_date", 500);
      const reviewers = (users || []).filter(candidate =>
        ACCOUNT_INTEGRITY_REVIEW_ROLES.includes(candidate.role)
      );
      await Promise.all(reviewers.map(candidate =>
        service.entities.Notification.create({
          user_id: candidate.id,
          title: "Account integrity alert",
          message: "A balance discrepancy was detected for account ending " +
            (lastFour || "unknown") + ". Review the open integrity alert in the operations dashboard.",
          type: "warning",
          link: "/operations"
        }).catch(error => console.error("Integrity reviewer notification failed:", error))
      ));
      return { account_id: accountId, status: "alert_created", alert_id: created.id };
    }

    if (invocation.kind === "entity" && invocation.entityName === "Transaction") {
      // Event data is untrusted. Resolve account ownership only from the stored
      // transaction record fetched by the platform-supplied entity ID.
      const transaction = await service.entities.Transaction.get(invocation.entityId).catch(() => null);
      if (!transaction) {
        return Response.json({ error: "Transaction event record not found." }, { status: 404 });
      }
      const result = await reconcileAccount(transaction.account_id, invocation.sourceEvent);
      return Response.json({ success: true, result });
    }

    if (invocation.kind === "entity" && invocation.entityName === "Account") {
      const result = await reconcileAccount(invocation.entityId, invocation.sourceEvent);
      return Response.json({ success: true, result });
    }

    // Scheduled backstop: scan all accounts in bounded pages. This endpoint
    // remains read-only for Account and Transaction records.
    let offset = 0;
    let checked = 0;
    const pageSize = 500;
    while (true) {
      const accounts = await service.entities.Account.filter({}, "-created_date", pageSize, offset);
      if (!accounts?.length) break;
      for (const account of accounts) {
        await reconcileAccount(account.id, "scheduled_reconciliation");
        checked += 1;
      }
      if (accounts.length < pageSize) break;
      offset += pageSize;
    }
    return Response.json({ success: true, checked, checked_at: now.toISOString() });
  } catch (error) {
    console.error("Account integrity reconciliation failed:", error);
    return Response.json({ success: false, error: "Integrity reconciliation failed." }, { status: 500 });
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}
