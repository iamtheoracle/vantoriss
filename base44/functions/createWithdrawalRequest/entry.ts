// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isRecord,
  jsonResponse,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

const ALLOWED_METHODS = new Set([
  'ACH Transfer',
  'Domestic Wire',
  'International Wire',
  'External Transfer',
  "Cashier's Check",
  'Check by Mail',
]);

export default async function createWithdrawalRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  let base44: Base44Client;
  let actor: AuthenticatedActor | null;
  try {
    base44 = createClientFromRequest(req) as Base44Client;
    const user = await base44.auth.me();
    actor = user ? {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    } : null;
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }
  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsedBody;
  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
  const amount = body.amount;
  const method = body.method;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!accountId || accountId.length > 128) return jsonResponse({ error: 'A valid account_id is required.' }, 400);
  if (actor.role !== 'user') {
    await writeBlockedMutationAudit(base44, actor, 'withdrawal.create', accountId, 'member_role_required', idempotencyKey);
    return jsonResponse({ error: 'Only an authenticated member can submit a withdrawal request.' }, 403);
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 100_000_000 || !Number.isSafeInteger(Math.round(amount * 100)) || Math.abs(amount * 100 - Math.round(amount * 100)) > Number.EPSILON * Math.max(1, Math.abs(amount * 100)) * 4) {
    return jsonResponse({ error: 'amount must be a positive finite amount with at most two decimal places.' }, 400);
  }
  if (typeof method !== 'string' || !ALLOWED_METHODS.has(method)) {
    return jsonResponse({ error: 'A supported withdrawal method is required.' }, 400);
  }
  if (notes.length > 1000) return jsonResponse({ error: 'notes must be 1,000 characters or fewer.' }, 400);
  if (!expectedUpdatedDate) return jsonResponse({ error: 'expected_updated_date is required.' }, 400);

  const command: Record<string, unknown> = {
    account_id: accountId,
    amount,
    method,
    notes,
    expected_updated_date: expectedUpdatedDate,
    require_authoritative_account_lookup: true,
    require_actor_owns_account: true,
    require_account_revision_match: true,
    require_account_active: true,
    require_member_kyc_approved: true,
    require_sufficient_available_funds: true,
    include_pending_withdrawal_reservations: true,
    enforce_authoritative_withdrawal_limits: true,
    allowed_methods: [...ALLOWED_METHODS],
    create_request_with_pending_status: true,
    audit_action: 'withdrawal_requested',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('withdrawal.create', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'withdrawal.create', accountId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'withdrawal.create', accountId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedRequest = outcome.result.withdrawalRequest;
  if (
    !savedRequest ||
    typeof savedRequest.id !== 'string' ||
    savedRequest.account_id !== accountId ||
    savedRequest.user_id !== actor.id ||
    savedRequest.amount !== amount ||
    savedRequest.method !== method ||
    savedRequest.status !== 'pending' ||
    typeof savedRequest.updated_date !== 'string' ||
    savedRequest.updated_date === expectedUpdatedDate
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'withdrawal.create', accountId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the withdrawal request and audit record. Resolve the outcome with the same idempotency key before retrying.',
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
      account_id: savedRequest.account_id,
      user_id: savedRequest.user_id,
      amount: savedRequest.amount,
      method: savedRequest.method,
      status: savedRequest.status,
      updated_date: savedRequest.updated_date,
    },
  });
}
