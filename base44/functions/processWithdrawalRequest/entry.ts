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

export default async function processWithdrawalRequest(req: Request): Promise<Response> {
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

  if (!isAllowedFinancialRole(actor)) {
    await writeBlockedMutationAudit(base44, actor, 'withdrawal.review', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to process withdrawal requests.' }, 403);
  }

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsedBody;
  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const requestId = typeof body.request_id === 'string' ? body.request_id.trim() : '';
  const decision = body.decision;
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!requestId || requestId.length > 128) return jsonResponse({ error: 'A valid request_id is required.' }, 400);
  if (decision !== 'paid' && decision !== 'rejected') {
    return jsonResponse({ error: 'decision must be paid or rejected.' }, 400);
  }
  if (adminNotes.length > 2000) return jsonResponse({ error: 'admin_notes must be 2,000 characters or fewer.' }, 400);

  // The service resolves amount/account/method and checks pending state plus
  // revision within its transaction. "paid" is forbidden without authoritative
  // payout confirmation and sufficient funds; the browser never posts a ledger
  // entry or computes a new balance.
  const command: Record<string, unknown> = {
    request_id: requestId,
    decision,
    admin_notes: adminNotes,
    expected_request_status: 'pending',
    expected_updated_date: expectedUpdatedDate,
    require_authoritative_request_lookup: true,
    require_sufficient_available_funds: decision === 'paid',
    require_payout_confirmation: decision === 'paid',
    prevent_negative_balances: true,
    audit_action: decision === 'paid' ? 'withdrawal_processed' : 'withdrawal_rejected',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('withdrawal.review', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'withdrawal.review', requestId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'withdrawal.review', requestId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedRequest = outcome.result.withdrawalRequest;
  if (
    savedRequest?.id !== requestId ||
    savedRequest.status !== decision ||
    typeof savedRequest.updated_date !== 'string' ||
    savedRequest.updated_date === expectedUpdatedDate ||
    (decision === 'paid' && savedRequest.payout_confirmed !== true)
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'withdrawal.review', requestId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the requested withdrawal state and payout evidence. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    request: {
      id: savedRequest.id,
      status: savedRequest.status,
      updated_date: savedRequest.updated_date,
      payout_confirmed: savedRequest.payout_confirmed === true,
    },
    audit_recorded: true,
  });
}
