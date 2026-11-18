import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const APPROVER_ROLES = new Set([
  "admin", "administrator", "super_administrator",
  "operations_officer", "operations_manager", "finance_officer",
  "treasury_officer", "compliance_officer",
]);

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed." }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const approver = await base44.auth.me();
    if (!approver?.id) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!APPROVER_ROLES.has(approver.role)) {
      return Response.json({ error: "You are not authorized to finalize withdrawals." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.withdrawal_request_id || "").trim();
    const notes = String(body.admin_notes || "").trim().slice(0, 2000);
    if (!requestId) {
      return Response.json({ error: "withdrawal_request_id is required." }, { status: 400 });
    }

    const service = base44.asServiceRole;
    const withdrawal = await service.entities.WithdrawalRequest.get(requestId).catch(() => null);
    if (!withdrawal) {
      return Response.json({ error: "Withdrawal request not found." }, { status: 404 });
    }

    const reference = `WD-${withdrawal.id}`;
    if (withdrawal.status === "paid") {
      const existing = await service.entities.Transaction.filter({ withdrawal_request_id: withdrawal.id }).catch(() => []);
      return Response.json({
        success: true,
        already_processed: true,
        withdrawal_request_id: withdrawal.id,
        transaction_id: withdrawal.transaction_id || existing[0]?.id || null,
        message: "This withdrawal has already been finalized. No additional debit was posted.",
      });
    }
    if (withdrawal.status !== "pending" && withdrawal.status !== "processing") {
      return Response.json({ error: `Only pending withdrawals can be finalized (current status: ${withdrawal.status}).` }, { status: 409 });
    }

    const amount = money(Math.abs(Number(withdrawal.amount)));
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Withdrawal amount is invalid." }, { status: 422 });
    }

    const account = await service.entities.Account.get(withdrawal.account_id).catch(() => null);
    if (!account || account.user_id !== withdrawal.user_id) {
      return Response.json({ error: "The withdrawal account could not be verified against the member." }, { status: 409 });
    }
    if (account.status !== "active") {
      return Response.json({ error: "The account is not active. No funds were debited." }, { status: 409 });
    }

    const limits = await service.entities.WithdrawalLimit.filter({ account_type: account.account_type, enabled: true }).catch(() => []);
    const singleLimit = limits.find((item: any) => Number(item.single_limit) > 0)?.single_limit;
    if (singleLimit && amount > Number(singleLimit)) {
      return Response.json({ error: "This withdrawal exceeds the configured single-withdrawal limit." }, { status: 409 });
    }

    // Move the request into a recoverable processing state before posting.
    if (withdrawal.status === "pending") {
      await service.entities.WithdrawalRequest.update(withdrawal.id, {
        status: "processing",
        processing_reference: reference,
        processed_by: approver.id,
        failure_reason: "",
      });
    }

    // A stable request reference allows a retry to resume a partially completed posting.
    let ledgerEntries = await service.entities.Transaction.filter({ withdrawal_request_id: withdrawal.id }).catch(() => []);
    let transaction = ledgerEntries.find((entry: any) => entry.reference === reference) || null;
    let currentAccount = await service.entities.Account.get(account.id);

    if (!transaction) {
      const before = money(Number(currentAccount.balance || 0));
      if (before < amount) {
        await service.entities.WithdrawalRequest.update(withdrawal.id, {
          status: "pending",
          failure_reason: "Insufficient available balance at approval time.",
        });
        return Response.json({ error: "Insufficient available balance. The request remains pending." }, { status: 409 });
      }

      const after = money(before - amount);
      transaction = await service.entities.Transaction.create({
        account_id: account.id,
        user_id: withdrawal.user_id,
        withdrawal_request_id: withdrawal.id,
        type: "withdrawal",
        amount: -amount,
        description: `Withdrawal - ${withdrawal.method}`,
        reference,
        balance_before: before,
        balance_after: after,
        created_by_admin: true,
        transaction_date: new Date().toISOString().slice(0, 10),
        posting_date: new Date().toISOString().slice(0, 10),
        source: "system",
        status: "completed",
      });
    }

    const expectedBefore = money(Number(transaction.balance_before));
    const expectedAfter = money(Number(transaction.balance_after));
    const liveBalance = money(Number(currentAccount.balance || 0));

    if (liveBalance === expectedBefore) {
      await service.entities.Account.update(account.id, { balance: expectedAfter });
    } else if (liveBalance !== expectedAfter) {
      await service.entities.WithdrawalRequest.update(withdrawal.id, {
        status: "processing",
        failure_reason: "Account balance changed during withdrawal posting; manual reconciliation is required.",
      });
      return Response.json({
        error: "Withdrawal posting paused because the account balance no longer matches the ledger posting checkpoint. No second debit was attempted.",
        requires_reconciliation: true,
        transaction_id: transaction.id,
      }, { status: 409 });
    }

    await service.entities.WithdrawalRequest.update(withdrawal.id, {
      status: "paid",
      admin_notes: notes,
      processed_at: new Date().toISOString(),
      processed_by: approver.id,
      transaction_id: transaction.id,
      processing_reference: reference,
      failure_reason: "",
    });

    await service.entities.Notification.create({
      user_id: withdrawal.user_id,
      title: "Withdrawal Processed",
      message: `Your withdrawal of ${amount.toFixed(2)} via ${withdrawal.method} has been processed.`,
      type: "success",
      read: false,
    }).catch(() => null);

    await service.entities.AuditLog.create({
      action_type: "withdrawal_processed",
      description: `Withdrawal processed: ${amount.toFixed(2)} via ${withdrawal.method}`,
      details: `Request ID: ${withdrawal.id}; Ledger transaction: ${transaction.id}; Notes: ${notes || "None"}`,
      account_id: account.id,
      amount: -amount,
      balance_before: expectedBefore,
      balance_after: expectedAfter,
      target_user_id: withdrawal.user_id,
      user_id: approver.id,
      admin_name: approver.full_name || approver.email || "Administrator",
    }).catch(() => null);

    return Response.json({
      success: true,
      already_processed: false,
      withdrawal_request_id: withdrawal.id,
      transaction_id: transaction.id,
      account_id: account.id,
      balance_before: expectedBefore,
      balance_after: expectedAfter,
      amount,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Withdrawal finalization failed." }, { status: 500 });
  }
}
