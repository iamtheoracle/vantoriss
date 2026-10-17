import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  jsonResponse,
  validateDateCorrection,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
} from '../../shared/financialMutationGateway.ts';
import { isDateOnly } from '../../shared/financialMutationRules.mjs';

export default async function correctTransactionDate(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let base44: any;
  let actor: any;
  try {
    base44 = createClientFromRequest(req);
    actor = await base44.auth.me();
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }
  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);

  if (!isAllowedFinancialRole(actor)) {
    await writeBlockedMutationAudit(base44, actor, 'transaction.date.correct', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to correct transaction dates.' }, 403);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  }

  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);
  const correctionError = validateDateCorrection(body);
  if (correctionError) return jsonResponse({ error: correctionError }, 400);

  const transactionId = body.transaction_id.trim();
  if (transactionId.length > 128) return jsonResponse({ error: 'transaction_id is invalid.' }, 400);


  // Never let this endpoint change amounts, balances, posting dates, status,
  // references, or descriptions. The atomic service must re-check revision,
  // transaction state, and current date inside its own transaction.
  const command = {
    transaction_id: transactionId,
    account_id: body.account_id,
    transaction_date: body.transaction_date,
    expected_current_transaction_date: body.expected_current_transaction_date ?? null,
    expected_updated_date: body.expected_updated_date,
    expected_status: body.expected_status,
    allowed_statuses: ['completed', 'reversed'],
    allowed_fields: ['transaction_date'],
    audit_action: 'transaction_edited',
  };

  const outcome = await invokeAtomicMutationService('transaction.date.correct', actor, command, body.idempotency_key);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'transaction.date.correct', transactionId, outcome.code, body.idempotency_key)
      : await writeBlockedMutationAudit(base44, actor, 'transaction.date.correct', transactionId, outcome.code, body.idempotency_key);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedTransaction = outcome.result.transaction;
  const savedDate = savedTransaction?.transaction_date;
  if (
    savedTransaction?.id !== transactionId ||
    savedTransaction?.account_id !== body.account_id ||
    !isDateOnly(savedDate) ||
    savedDate !== body.transaction_date ||
    !['completed', 'reversed'].includes(savedTransaction?.status) ||
    !savedTransaction?.updated_date ||
    savedTransaction.updated_date === body.expected_updated_date
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'transaction.date.correct', transactionId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', body.idempotency_key,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the requested transaction date. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: body.idempotency_key,
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
