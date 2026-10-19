// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  isRecord,
  jsonResponse,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

export default async function reviewInvestmentRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  let base44: Base44Client;
  let actor: AuthenticatedActor | null;
  try {
    base44 = createClientFromRequest(req) as Base44Client;
    const user = await base44.auth.me();
    actor = user ? { id: user.id, role: user.role, full_name: user.full_name, email: user.email } : null;
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }
  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);

  const parsed: unknown = await req.json().catch(() => null);
  if (!isRecord(parsed)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsed;
  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const requestId = typeof body.request_id === 'string' ? body.request_id.trim() : '';
  const requestType = body.request_type;
  const decision = body.decision;
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'investment.request.review', requestId || 'unknown', 'role_not_authorized', idempotencyKey,
    );
    return jsonResponse({ error: 'You are not authorized to review investment requests.', audit_recorded: auditRecorded }, 403);
  }
  if (!requestId || requestId.length > 128) return jsonResponse({ error: 'A valid request_id is required.' }, 400);
  if (requestType !== 'deposit' && requestType !== 'withdrawal') {
    return jsonResponse({ error: 'request_type must be deposit or withdrawal.' }, 400);
  }
  if (decision !== 'approved' && decision !== 'rejected') {
    return jsonResponse({ error: 'decision must be approved or rejected.' }, 400);
  }
  if (adminNotes.length > 2000) return jsonResponse({ error: 'admin_notes must be 2,000 characters or fewer.' }, 400);
  if (decision === 'rejected' && !adminNotes) return jsonResponse({ error: 'A rejection reason is required for the audit trail.' }, 400);

  const isDeposit = requestType === 'deposit';
  const isApproval = decision === 'approved';
  const action = isDeposit ? 'investment.deposit.review' : 'investment.withdrawal.review';
  const command: Record<string, unknown> = {
    request_id: requestId,
    request_type: requestType,
    decision,
    admin_notes: adminNotes,
    expected_request_status: 'requested',
    expected_updated_date: expectedUpdatedDate,
    require_authoritative_request_lookup: true,
    require_authoritative_portfolio_lookup: true,
    require_request_owner_and_portfolio_consistency: true,
    require_request_revision_match: true,
    require_portfolio_revision_check_inside_transaction: true,
    require_idempotency_resolution_before_revision_check: true,
    prevent_duplicate_commit_for_same_idempotency_key: true,
    update_request_portfolio_ledger_and_audit_atomically: true,
    apply_portfolio_and_ledger_changes_only_on_approval: true,
    no_portfolio_balance_or_ledger_mutation_on_rejection: true,
    audit_action: `investment_${requestType}_${decision}`,
    notification_outbox_required: true,
  };

  if (isDeposit) {
    command.require_verified_funding_evidence = isApproval;
    command.required_funding_evidence_status = isApproval ? 'verified' : undefined;
    command.credit_portfolio_only_after_verified_funding = true;
    command.create_investment_transaction_only_on_approval = true;
    command.never_trust_client_amount_user_id_or_portfolio_balance = true;
  } else {
    command.require_connected_authoritative_investment_provider = isApproval;
    command.require_payout_confirmation = isApproval;
    command.require_sufficient_available_cash = isApproval;
    command.consume_existing_withdrawal_reservation_atomically = isApproval;
    command.release_withdrawal_reservation_atomically = !isApproval;
    command.never_double_reserve_withdrawal_amount = true;
    command.never_mark_withdrawal_paid_without_provider_confirmation = true;
    command.create_investment_transaction_only_on_confirmed_payout = true;
  }

  const outcome = await invokeAtomicMutationService(action, actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, action, requestId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, action, requestId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedRequest = isDeposit ? outcome.result.investmentDepositRequest : outcome.result.investmentWithdrawalRequest;
  const transaction = outcome.result.transaction;
  const portfolio = outcome.result.portfolio;
  const operationInvalid =
    !savedRequest ||
    savedRequest.id !== requestId ||
    savedRequest.status !== decision ||
    typeof savedRequest.updated_date !== 'string' ||
    !savedRequest.updated_date ||
    savedRequest.updated_date === expectedUpdatedDate ||
    typeof savedRequest.user_id !== 'string' ||
    typeof savedRequest.portfolio_id !== 'string' ||
    typeof savedRequest.amount !== 'number' ||
    !Number.isFinite(savedRequest.amount) ||
    savedRequest.amount <= 0 ||
    (isApproval && (
      !transaction ||
      typeof transaction.id !== 'string' ||
      transaction.portfolio_id !== savedRequest.portfolio_id ||
      transaction.user_id !== savedRequest.user_id ||
      transaction.type !== requestType ||
      transaction.amount !== savedRequest.amount ||
      transaction.status !== 'completed' ||
      !portfolio ||
      portfolio.id !== savedRequest.portfolio_id ||
      typeof portfolio.updated_date !== 'string'
    )) ||
    (isApproval && outcome.result.portfolio_balance_modified !== true) ||
    (!isApproval && (outcome.result.portfolio_balance_modified !== false || (transaction !== undefined && transaction !== null))) ||
    (isDeposit && isApproval && outcome.result.funding_verified !== true) ||
    (!isDeposit && isApproval && (
      outcome.result.payout_confirmed !== true ||
      savedRequest.payout_confirmed !== true
    ));

  if (operationInvalid) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, action, requestId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the investment request state, required funding/payout evidence, ledger entry, portfolio revision, and audit record. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    request: {
      id: savedRequest.id,
      user_id: savedRequest.user_id,
      portfolio_id: savedRequest.portfolio_id,
      amount: savedRequest.amount,
      status: savedRequest.status,
      updated_date: savedRequest.updated_date,
      payout_confirmed: savedRequest.payout_confirmed === true,
    },
    transaction: transaction || null,
    portfolio: portfolio ? {
      id: portfolio.id,
      updated_date: portfolio.updated_date,
      cash_balance: portfolio.cash_balance,
      total_value: portfolio.total_value,
    } : null,
    funding_verified: outcome.result.funding_verified === true,
    payout_confirmed: outcome.result.payout_confirmed === true,
  });
}
