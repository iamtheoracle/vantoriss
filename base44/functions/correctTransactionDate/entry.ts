// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  isRecord,
  jsonResponse,
  validateDateCorrection,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';
import { isDateOnly } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

export default async function correctTransactionDate(req: Request): Promise<Response> {
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
    await writeBlockedMutationAudit(base44, actor, 'transaction.date.correct', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to correct transaction dates.' }, 403);
  }

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsedBody;

  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);
  const correctionError = validateDateCorrection(body);
  if (correctionError) return jsonResponse({ error: correctionError }, 400);

  const transactionId = typeof body.transaction_id === 'string' ? body.transaction_id.trim() : '';
  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
  const transactionDate = typeof body.transaction_date === 'string' ? body.transaction_date : '';
  const expectedCurrentDate = typeof body.expected_current_transaction_date === 'string'
    ? body.expected_current_transaction_date
    : null;
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  if (!transactionId || transactionId.length > 128) return jsonResponse({ error: 'transaction_id is invalid.' }, 400);
  if (body.expected_status !== 'completed' && body.expected_status !== 'reversed') {
    return jsonResponse({ error: 'expected_status must be completed or reversed.' }, 400);
  }
  const expectedStatus = body.expected_status;

  // The atomic service must verify account ownership, actual transaction state,
  // old date, and revision in its transaction. This endpoint never supplies
  // amount/balance fields, and the service must update only transaction_date.
  const command: Record<string, unknown> = {
    transaction_id: transactionId,
    account_id: accountId,
    transaction_date: transactionDate,
    expected_current_transaction_date: expectedCurrentDate,
    expected_updated_date: expectedUpdatedDate,
    expected_status: expectedStatus,
    allowed_statuses: ['completed', 'reversed'],
    allowed_fields: ['transaction_date'],
    audit_action: 'transaction_edited',
  };

  const outcome = await invokeAtomicMutationService('transaction.date.correct', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'transaction.date.correct', transactionId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'transaction.date.correct', transactionId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedTransaction = outcome.result.transaction;
  const savedDate = savedTransaction?.transaction_date;
  const savedStatus = savedTransaction?.status;
  if (
    savedTransaction?.id !== transactionId ||
    savedTransaction?.account_id !== accountId ||
    !isDateOnly(savedDate) ||
    savedDate !== transactionDate ||
    (savedStatus !== 'completed' && savedStatus !== 'reversed') ||
    typeof savedTransaction.updated_date !== 'string' ||
    savedTransaction.updated_date === expectedUpdatedDate
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'transaction.date.correct', transactionId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the requested transaction date. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    transaction: {
      id: savedTransaction.id,
      account_id: savedTransaction.account_id,
      transaction_date: savedTransaction.transaction_date,
      updated_date: savedTransaction.updated_date,
      status: savedTransaction.status,
    },
    audit_recorded: true,
  });
}
