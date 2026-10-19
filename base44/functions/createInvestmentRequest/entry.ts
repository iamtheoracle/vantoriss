// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isRecord,
  jsonResponse,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';
import { isUuid, isValidRevision } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const REQUEST_TYPES = new Set(['deposit', 'withdrawal']);
const MAX_REQUEST_AMOUNT = 100_000_000;

export default async function createInvestmentRequest(req: Request): Promise<Response> {
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
  if (!isUuid(body.idempotency_key)) return jsonResponse({ error: 'A valid UUID idempotency_key is required.' }, 400);
  if (!isValidRevision(body.expected_updated_date)) return jsonResponse({ error: 'expected_updated_date is required.' }, 400);

  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  const portfolioId = typeof body.portfolio_id === 'string' ? body.portfolio_id.trim() : '';
  const requestType = typeof body.request_type === 'string' ? body.request_type : '';
  const amount = body.amount;

  if (actor.role !== 'user') {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'investment.request.create', portfolioId || 'unknown', 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only an authenticated member can submit an investment request.', audit_recorded: auditRecorded }, 403);
  }
  if (!portfolioId || portfolioId.length > 128) return jsonResponse({ error: 'A valid portfolio_id is required.' }, 400);
  if (!REQUEST_TYPES.has(requestType)) return jsonResponse({ error: 'request_type must be deposit or withdrawal.' }, 400);
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > MAX_REQUEST_AMOUNT ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > Number.EPSILON * Math.max(1, Math.abs(amount * 100)) * 4) {
    return jsonResponse({ error: 'amount must be a positive amount no greater than 100,000,000 with at most two decimal places.' }, 400);
  }

  const isWithdrawal = requestType === 'withdrawal';
  const action = isWithdrawal ? 'investment.withdrawal.request' : 'investment.deposit.request';
  const command: Record<string, unknown> = {
    portfolio_id: portfolioId,
    expected_updated_date: body.expected_updated_date,
    request_type: requestType,
    amount,
    require_authoritative_portfolio_lookup: true,
    require_actor_owns_portfolio: true,
    require_portfolio_revision_match: true,
    require_portfolio_not_suspended_or_closed: true,
    require_idempotency_resolution_before_revision_check: true,
    create_request_with_requested_status: true,
    never_update_portfolio_balances_for_request_creation: true,
    never_trust_client_user_id_or_portfolio_balance: true,
    prevent_duplicate_commit_for_same_idempotency_key: true,
    audit_action: isWithdrawal ? 'investment_withdrawal_requested' : 'investment_deposit_requested',
    notification_outbox_required: true,
  };

  if (isWithdrawal) {
    command.require_connected_authoritative_investment_provider = true;
    command.require_sufficient_available_cash_after_pending_withdrawal_reservations = true;
    command.reserve_withdrawal_amount_atomically = true;
    command.never_transfer_funds_during_request_creation = true;
  } else {
    command.require_funding_evidence_before_any_credit = true;
    command.never_credit_portfolio_during_request_creation = true;
  }

  const outcome = await invokeAtomicMutationService(action, actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, action, portfolioId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, action, portfolioId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const request = isWithdrawal ? outcome.result.investmentWithdrawalRequest : outcome.result.investmentDepositRequest;
  if (
    !request || typeof request.id !== 'string' || !request.id ||
    request.user_id !== actor.id ||
    request.portfolio_id !== portfolioId ||
    request.amount !== amount ||
    request.status !== 'requested' ||
    typeof request.updated_date !== 'string' || !request.updated_date
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, action, portfolioId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the owned investment request and audit record. Resolve the operation using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    request: {
      id: request.id,
      user_id: request.user_id,
      portfolio_id: request.portfolio_id,
      amount: request.amount,
      status: request.status,
      updated_date: request.updated_date,
    },
  });
}
