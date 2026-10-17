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

export default async function setAccountStatus(req: Request): Promise<Response> {
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
  const targetStatus = body.status;
  const expectedStatus = body.expected_status;
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!accountId || accountId.length > 128) {
    return jsonResponse({ error: 'A valid account_id is required.' }, 400);
  }
  if (targetStatus !== 'frozen' && targetStatus !== 'active') {
    return jsonResponse({ error: 'status must be frozen or active.' }, 400);
  }
  if (expectedStatus !== 'frozen' && expectedStatus !== 'active') {
    return jsonResponse({ error: 'expected_status must be frozen or active.' }, 400);
  }
  if (targetStatus === expectedStatus) {
    return jsonResponse({ error: 'The requested account status must differ from the expected current status.' }, 400);
  }

  const isFinancialOperator = isAllowedFinancialRole(actor);
  const isSelfServiceFreeze = actor.role === 'user' && targetStatus === 'frozen';
  if (!isFinancialOperator && !isSelfServiceFreeze) {
    await writeBlockedMutationAudit(base44, actor, 'account.status_change', accountId, 'role_not_authorized', idempotencyKey);
    return jsonResponse({ error: 'You are not authorized to perform this account-status change.' }, 403);
  }

  const command: Record<string, unknown> = {
    account_id: accountId,
    status: targetStatus,
    expected_status: expectedStatus,
    expected_updated_date: body.expected_updated_date,
    require_authoritative_account_lookup: true,
    require_account_revision_match: true,
    require_actor_owns_account: isSelfServiceFreeze,
    allow_member_freeze_only: isSelfServiceFreeze,
    require_operator_role: isFinancialOperator,
    audit_action: targetStatus === 'frozen' ? 'account_frozen' : 'account_unfrozen',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('account.status_change', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'account.status_change', accountId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'account.status_change', accountId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedAccount = outcome.result.account;
  if (
    !savedAccount ||
    savedAccount.id !== accountId ||
    savedAccount.status !== targetStatus ||
    typeof savedAccount.updated_date !== 'string' ||
    savedAccount.updated_date === body.expected_updated_date
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'account.status_change', accountId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the requested account status. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    account: {
      id: savedAccount.id,
      status: savedAccount.status,
      updated_date: savedAccount.updated_date,
    },
    audit_recorded: true,
  });
}
