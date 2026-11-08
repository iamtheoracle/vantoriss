import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const ADMIN_ROLES = new Set([
  "admin", "administrator", "super_administrator", "operations_officer", "operations_manager", "compliance_officer", "executive", "finance_officer", "kyc_officer", "treasury_officer", "investment_officer", "investment_manager", "auditor", "risk_officer", "it_administrator", "customer_support", "herobox_manager", "volunteer_manager", "shipping_manager"
]);
const TOLERANCE = 0.01;
const ACCOUNT_UPDATE_GRACE_MS = 120000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const service = base44.asServiceRole;
    const payload = await req.json().catch(() => ({}));
    const event = payload.event || null;
    const eventData = payload.data || null;
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
      // Give that pair a short grace period; the five-minute sweep is the backstop.
      const accountUpdated = new Date(account.updated_date || eventData?.updated_date || 0).getTime();
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
      const administrators = (users || []).filter(user => ADMIN_ROLES.has(user.role));
      await Promise.all(administrators.map(user =>
        service.entities.Notification.create({
          user_id: user.id,
          title: "Account integrity alert",
          message: "A balance discrepancy was detected for account ending " +
            (lastFour || "unknown") + ". Review the open integrity alert in the admin dashboard.",
          type: "warning",
          link: "/operations"
        }).catch(error => console.error("Admin alert notification failed:", error))
      ));
      return { account_id: accountId, status: "alert_created", alert_id: created.id };
    }

    if (event?.entity_name === "Transaction") {
      let transaction = eventData;
      if (payload.payload_too_large || !transaction) {
        transaction = await service.entities.Transaction.get(event.entity_id);
      }
      const result = await reconcileAccount(transaction?.account_id, "Transaction." + event.type);
      return Response.json({ success: true, result });
    }

    if (event?.entity_name === "Account") {
      const result = await reconcileAccount(event.entity_id, "Account." + event.type);
      return Response.json({ success: true, result });
    }

    // Scheduled backstop: scan all accounts in bounded pages.
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
});
